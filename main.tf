terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = "us-west-2"
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "catalytica_api_logs" {
  name              = "/catalytica/api/calls"
  retention_in_days = 14
}

# IAM Role for EC2 CloudWatch
resource "aws_iam_role" "ec2_cloudwatch_role" {
  name = "catalytica-ec2-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Action = "sts:AssumeRole",
      Effect = "Allow",
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "cloudwatch_policy_attachment" {
  role       = aws_iam_role.ec2_cloudwatch_role.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "catalytica-ec2-cloudwatch-profile"
  role = aws_iam_role.ec2_cloudwatch_role.name
}

resource "aws_launch_template" "catalytica_template" {
  name_prefix   = "catalytica-template"
  image_id      = "ami-07eb43faa7d786c82"
  instance_type = "t2.small"
  key_name      = "catalytica-key"
  vpc_security_group_ids = ["sg-068e3daeda5e15279", "sg-053c014d58ec801c5"]

  iam_instance_profile {
    arn = aws_iam_instance_profile.ec2_profile.arn
  }

  user_data = base64encode(<<EOF
#!/bin/bash
set -e
exec > /var/log/user-data.log 2>&1

echo "Starting user data script at $(date)"

sudo apt update -y
sudo apt install -y nginx git curl nodejs npm python3-pip build-essential net-tools python3 make g++

echo "Installing CloudWatch agent..."
mkdir -p /tmp/cloudwatch
cd /tmp/cloudwatch
wget https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb
sudo apt-get install -f -y

sudo mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/
sudo cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<'EOT'
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/catalytica-api/*.log",
            "log_group_name": "/catalytica/api/calls",
            "log_stream_name": "{instance_id}-api-logs",
            "timestamp_format": "%Y-%m-%d %H:%M:%S"
          },
          {
            "file_path": "/home/ubuntu/Catalytica/backend/logs/*.log",
            "log_group_name": "/catalytica/api/calls",
            "log_stream_name": "{instance_id}-backend-logs",
            "timestamp_format": "%Y-%m-%d %H:%M:%S"
          }
        ]
      }
    }
  }
}
EOT

sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
sudo systemctl enable amazon-cloudwatch-agent
sudo systemctl start amazon-cloudwatch-agent

sudo mkdir -p /var/log/catalytica-api
sudo chmod 755 /var/log/catalytica-api
sudo mkdir -p /home/ubuntu/Catalytica/backend/logs
sudo chmod 755 /home/ubuntu/Catalytica/backend/logs

cd /home/ubuntu
if [ ! -d "Catalytica/backend" ]; then
  git clone https://github.com/AnthonyL103/Catalytica.git
else
  cd Catalytica/backend
  sudo chown -R ubuntu:ubuntu .
  export HOME=/home/ubuntu
  sudo -u ubuntu git config --global --add safe.directory /home/ubuntu/Catalytica/backend
  sudo -u ubuntu git reset --hard origin/main
  sudo -u ubuntu git pull origin main
  cd ..
  find . -mindepth 1 -maxdepth 1 -not -name "backend" -exec rm -rf {} \;
fi

cd /home/ubuntu/Catalytica/backend
npm install
npm install --save @google-cloud/vision bcrypt nodemon express-list-endpoints winston winston-daily-rotate-file stripe axios @sendgrid/mail

for port in 5001 5002 5003 5005 5006; do
  sudo fuser -k $port/tcp || true
done
sudo pkill -f node || true
sudo pkill -f pm2 || true

npm install pm2@latest -g
pm2 update
pm2 delete all || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd

sudo chown -R ubuntu:ubuntu /home/ubuntu/.pm2
sudo chmod -R 775 /home/ubuntu/.pm2

sudo systemctl restart nginx

echo "User data script finished successfully at $(date)"
EOF
  )

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb" "catalytica_alb" {
  name               = "catalytica-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = ["sg-068e3daeda5e15279", "sg-053c014d58ec801c5"]
  subnets            = ["subnet-0808f06feea54df94", "subnet-07f7f3d986f211a70", "subnet-0ff7879cd731fe688", "subnet-0c064f12fd07fae84"]

  enable_deletion_protection = false

  tags = {
    Name = "Catalytica-ALB"
  }
}

resource "aws_lb_target_group" "catalytica_target_group" {
  name        = "catalytica-tg"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = "vpc-09d64440bb95753ac"
  target_type = "instance"

  health_check {
    path                = "/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 2
  }

  tags = {
    Name = "Catalytica-TargetGroup"
  }
}

resource "aws_lb_listener" "catalytica_https_listener" {
  load_balancer_arn = aws_lb.catalytica_alb.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-2016-08"
  certificate_arn   = "arn:aws:acm:us-west-2:060795900722:certificate/baa52ade-f2cb-4a0b-af0e-77fd4c3c7a99"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.catalytica_target_group.arn
  }
}

resource "aws_autoscaling_group" "catalytica_asg" {
  name                 = "catalytica-asg"
  desired_capacity     = 1
  max_size             = 3
  min_size             = 1
  vpc_zone_identifier  = ["subnet-0808f06feea54df94", "subnet-07f7f3d986f211a70", "subnet-0ff7879cd731fe688", "subnet-0c064f12fd07fae84"]

  launch_template {
    id      = aws_launch_template.catalytica_template.id
    version = "$Latest"
  }

  target_group_arns = [aws_lb_target_group.catalytica_target_group.arn]

  lifecycle {
    create_before_destroy = true
  }

  tag {
    key                 = "Name"
    value               = "Catalytica-ASG-Instance"
    propagate_at_launch = true
  }
}

resource "aws_db_instance" "catalytica_rds" {
  identifier          = "catalytica-db"
  instance_class      = "db.t4g.micro"
  allocated_storage   = 20
  engine              = "postgres"
  storage_encrypted   = true
  publicly_accessible = true

  lifecycle {
    ignore_changes = [
      copy_tags_to_snapshot,
      performance_insights_enabled,
      skip_final_snapshot,
      max_allocated_storage
    ]
  }
}

resource "aws_amplify_app" "catalytica_amplify" {
  name       = "Catalytica"
  repository = "https://github.com/AnthonyL103/Catalytica"

  custom_rule {
    source = "/<*>"
    status = "404-200"
    target = "/index.html"
  }

  lifecycle {
    ignore_changes = all
  }
}

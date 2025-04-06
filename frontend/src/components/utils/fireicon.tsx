import { useEffect} from "react";

interface FireAnimationProps {
  size?: number; 
  className?: string; 
  isVisible?: boolean; 
}

const FireAnimation: React.FC<FireAnimationProps> = ({ 
  size = 100,
  className = "",
  isVisible = true
}) => {
  const fireStyles = `
    @keyframes scaleUpDown {
      0%, 100% { transform: scaleY(1) scaleX(1); }
      50%, 90% { transform: scaleY(1.1); }
      75% { transform: scaleY(0.95); }
      80% { transform: scaleX(0.95); }
    }
    
    @keyframes shake {
      0%, 100% { transform: skewX(0) scale(1); }
      50% { transform: skewX(5deg) scale(0.9); }
    }
    
    @keyframes particleUp {
      0% { opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% { opacity: 0; top: -100%; transform: scale(0.5); }
    }
    
    @keyframes glow {
      0%, 100% { background-color: #ef5a00; }
      50% { background-color: #ff7800; }
    }
    
    .fire-center {
      animation: scaleUpDown 3s infinite ease-out;
    }
    
    .fire-center-main {
      background-image: radial-gradient(farthest-corner at 10px 0, #d43300 0%, #ef5a00 95%);
      transform: scaleX(0.8) rotate(45deg);
      border-radius: 0 40% 60% 40%;
      filter: drop-shadow(0 0 10px #d43322);
    }
    
    .fire-center-particle {
      top: 60%;
      left: 45%;
      width: 10px;
      height: 10px;
      background-color: #ef5a00;
      border-radius: 50%;
      filter: drop-shadow(0 0 10px #d43322);
      animation: particleUp 2s infinite ease-out;
    }
    
    .fire-right {
      animation: shake 2s infinite ease-out;
    }
    
    .fire-right-main {
      top: 15%;
      right: -25%;
      width: 80%;
      height: 80%;
      background-color: #ef5a00;
      transform: scaleX(0.8) rotate(45deg);
      border-radius: 0 40% 60% 40%;
      filter: drop-shadow(0 0 10px #d43322);
    }
    
    .fire-right-particle {
      top: 45%;
      left: 50%;
      width: 15px;
      height: 15px;
      background-color: #ef5a00;
      transform: scaleX(0.8) rotate(45deg);
      border-radius: 50%;
      filter: drop-shadow(0 0 10px #d43322);
      animation: particleUp 2s infinite ease-out;
    }
    
    .fire-left {
      animation: shake 3s infinite ease-out;
    }
    
    .fire-left-main {
      top: 15%;
      left: -20%;
      width: 80%;
      height: 80%;
      background-color: #ef5a00;
      transform: scaleX(0.8) rotate(45deg);
      border-radius: 0 40% 60% 40%;
      filter: drop-shadow(0 0 10px #d43322);
    }
    
    .fire-left-particle {
      top: 10%;
      left: 20%;
      width: 10%;
      height: 10%;
      background-color: #ef5a00;
      border-radius: 50%;
      filter: drop-shadow(0 0 10px #d43322);
      animation: particleUp 3s infinite ease-out;
    }
    
    .fire-bottom-main {
      top: 30%;
      left: 20%;
      width: 75%;
      height: 75%;
      background-color: #ff7800;
      transform: scaleX(0.8) rotate(45deg);
      border-radius: 0 40% 100% 40%;
      filter: blur(10px);
      animation: glow 2s infinite ease-out;
    }
  `;

  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = fireStyles;
    document.head.appendChild(styleEl);
    
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  if (!isVisible) {
    return <div 
    className={`relative bg-transparent ${className}`}
    style={{ 
      width: `${size}px`, 
      height: `${size}px`,
      margin: '0 auto',
      opacity: 0
    }}
  />;
  }

  return (
    <div 
      className={`relative bg-transparent ${className}`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        margin: '0 auto'
      }}
    >
      <div className="absolute h-full w-full fire-center">
        <div className="absolute w-full h-full fire-center-main"></div>
        <div className="absolute fire-center-particle"></div>
      </div>
      
      <div className="absolute h-full w-full fire-right">
        <div className="absolute fire-right-main"></div>
        <div className="absolute fire-right-particle"></div>
      </div>
      
      <div className="absolute h-full w-full fire-left">
        <div className="absolute fire-left-main"></div>
        <div className="absolute fire-left-particle"></div>
      </div>
      
      <div className="absolute fire-bottom">
        <div className="absolute fire-bottom-main"></div>
      </div>
    </div>
  );
};

export default FireAnimation;
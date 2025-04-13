module.exports = {
    apps: [
      {
        name: "suggestions",
        script: "./components/getsuggestions.ts",
        instances: 1,
        env: {
          NODE_ENV: "production",
          PORT: 5002
        }
      }
    ]
  };
  
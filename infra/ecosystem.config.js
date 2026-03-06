const path = require('path');

// Em producao: este arquivo fica em BASE_PATH (ex: D:\IMPLANTACAO\hub\app)
const root = __dirname;
const backendDir = path.join(root, 'backend');

module.exports = {
  apps: [
    {
      name: 'hub-backend',
      script: path.join(backendDir, 'dist', 'main.js'),
      cwd: backendDir,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: { NODE_ENV: 'production' },
      filter_env: ['GITHUB_TOKEN', 'GITHUB_REPO'],
      merge_logs: true,
    }
  ],
};

module.exports = {
  apps: [{
    name: 'aavegotchi-petter',
    script: 'auto-petter.js',
    cwd: '/root/aavegotchi-auto-petter',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    // Restart policy
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    // Advanced options
    kill_timeout: 5000,
    listen_timeout: 3000,
    // Environment variables (optional - will use .env file)
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};

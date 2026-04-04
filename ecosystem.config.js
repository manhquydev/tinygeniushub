/**
 * PM2 Ecosystem Configuration - Cùng Con Tự Học
 * =============================================================================
 * Purpose: Process Manager configuration for production deployment
 * Usage: pm2 start ecosystem.config.js --env production
 * =============================================================================
 */

module.exports = {
  apps: [
    {
      // Main Web Application
      name: 'cungcontuhoc-web',
      script: './node_modules/.bin/next',
      args: 'start --hostname 0.0.0.0 --port 3000',
      cwd: '/srv/cungcontuhoc',
      env: { 
        NODE_ENV: 'production',
        PORT: 3000
      },
      
      // Process Management
      instances: 1,           // Single instance (can increase for multi-core)
      exec_mode: 'fork',      // Fork mode for Next.js
      max_memory_restart: '1G', // Restart if memory exceeds 1GB
      
      // Restart Behavior
      restart_delay: 3000,    // Wait 3 seconds before restart
      max_restarts: 5,        // Max 5 restarts in 15 seconds
      min_uptime: '10s',      // Must stay up 10s to be considered stable
      
      // Logging
      log_file: '/var/log/pm2/cungcontuhoc-web.log',
      out_file: '/var/log/pm2/cungcontuhoc-web-out.log',
      error_file: '/var/log/pm2/cungcontuhoc-web-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Monitoring & Control
      autorestart: true,
      watch: false,           // Don't watch files (production)
      ignore_watch: ['node_modules', 'logs', '.git'],
      
      // Environment Variables
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      // Background Worker Process
      name: 'cungcontuhoc-worker',
      script: './node_modules/.bin/tsx',
      args: 'src/worker/index.ts',
      cwd: '/srv/cungcontuhoc',
      env: { 
        NODE_ENV: 'production' 
      },
      
      // Process Management
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '512M', // Lower memory limit for worker
      
      // Restart Behavior
      restart_delay: 5000,
      max_restarts: 3,
      
      // Logging
      log_file: '/var/log/pm2/cungcontuhoc-worker.log',
      out_file: '/var/log/pm2/cungcontuhoc-worker-out.log',
      error_file: '/var/log/pm2/cungcontuhoc-worker-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Monitoring & Control
      autorestart: true,
      watch: false
    }
  ],

  // Deployment Configuration (optional, for pm2 deploy)
  deploy: {
    production: {
      user: 'deploy',
      host: 'cungcontuhoc.io.vn',
      ref: 'origin/main',
      repo: 'https://github.com/manhquydev/cungcontuhoc.git',
      path: '/srv/cungcontuhoc',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.js --env production'
    }
  }
};

/**
 * PM2 Ecosystem Configuration - TinyGenius Hub
 * =============================================================================
 * Purpose: Process Manager configuration for production deployment
 * Usage: pm2 start ecosystem.config.js --env production
 * =============================================================================
 */

export default {
  apps: [
    {
      // Main Web Application
      name: 'tinygeniushub-web',
      script: 'pnpm',
      args: 'start',
      cwd: '/var/www/tinygeniushub',
      env_file: '/var/www/tinygeniushub/.env',
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
      log_file: '/var/log/pm2/tinygeniushub-web.log',
      out_file: '/var/log/pm2/tinygeniushub-web-out.log',
      error_file: '/var/log/pm2/tinygeniushub-web-error.log',
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
      name: 'tinygeniushub-worker',
      script: 'npx',
      args: 'tsx src/worker/index.ts',
      cwd: '/var/www/tinygeniushub',
      env_file: '/var/www/tinygeniushub/.env',
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
      log_file: '/var/log/pm2/tinygeniushub-worker.log',
      out_file: '/var/log/pm2/tinygeniushub-worker-out.log',
      error_file: '/var/log/pm2/tinygeniushub-worker-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Monitoring & Control
      autorestart: true,
      watch: false,

      env_production: {
        NODE_ENV: 'production'
      }
    }
  ],

  // Deployment Configuration (optional, for pm2 deploy)
  deploy: {
    production: {
      user: 'deploy',
      host: 'tinygeniushubvn.tech',
      ref: 'origin/main',
      repo: 'https://github.com/manhquydev/cungcontuhoc.git',
      path: '/var/www/tinygeniushub',
      'post-deploy': 'pnpm install && pnpm build && pm2 reload ecosystem.config.js --env production'
    }
  }
};

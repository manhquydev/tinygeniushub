#!/bin/bash
# =============================================================================
# Nginx + SSL Setup Script - TinyGenius Hub
# =============================================================================
# Purpose: Configure Nginx reverse proxy with Let's Encrypt SSL
# Run as: deploy user (with sudo access)
# Target: Ubuntu 22.04 LTS
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Error handler
error_handler() {
    log_error "Script failed at line $1"
    exit 1
}
trap 'error_handler $LINENO' ERR

# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
DOMAIN="${1:-tinygeniushubvn.tech}"
EMAIL="${2:-admin@tinygeniushubvn.tech}"

echo "🔧 Setting up Nginx + SSL for $DOMAIN..."

# -----------------------------------------------------------------------------
# 1. Install Nginx
# -----------------------------------------------------------------------------
log_info "Installing Nginx..."
sudo apt-get install -y nginx
log_success "Nginx installed"

# -----------------------------------------------------------------------------
# 2. Remove Default Site
# -----------------------------------------------------------------------------
log_info "Removing default Nginx site..."
sudo rm -f /etc/nginx/sites-enabled/default
log_success "Default site removed"

# -----------------------------------------------------------------------------
# 3. Create Nginx Configuration
# -----------------------------------------------------------------------------
log_info "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/tinygeniushub > /dev/null << 'EOF'
upstream app_server {
    server 127.0.0.1:3000;
    keepalive 32;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

server {
    listen 80;
    server_name _;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name _;

    # SSL certificates (configured by certbot)
    ssl_certificate /etc/letsencrypt/live/DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Prevent sporadic 502s when upstream response headers are large.
    proxy_buffer_size 16k;
    proxy_buffers 8 16k;
    proxy_busy_buffers_size 32k;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Static files caching
    location /_next/static {
        alias /srv/tinygeniushub/.next/static;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Health checks (no rate limiting)
    location /api/health {
        proxy_pass http://app_server;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        access_log off;
    }

    # Auth endpoints (stricter rate limiting)
    location /api/auth/ {
        limit_req zone=auth burst=10 nodelay;
        proxy_pass http://app_server;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API endpoints
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://app_server;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # All other traffic
    location / {
        proxy_pass http://app_server;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Replace DOMAIN placeholder
sudo sed -i "s/DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/tinygeniushub
log_success "Nginx configuration created"

# -----------------------------------------------------------------------------
# 4. Enable Site
# -----------------------------------------------------------------------------
log_info "Enabling Nginx site..."
sudo ln -sf /etc/nginx/sites-available/tinygeniushub /etc/nginx/sites-enabled/
sudo nginx -t
log_success "Nginx configuration validated"

# -----------------------------------------------------------------------------
# 5. Start Nginx
# -----------------------------------------------------------------------------
log_info "Starting Nginx..."
sudo systemctl start nginx
sudo systemctl enable nginx
log_success "Nginx started and enabled"

# -----------------------------------------------------------------------------
# 6. Obtain SSL Certificate
# -----------------------------------------------------------------------------
log_info "Obtaining SSL certificate from Let's Encrypt..."
sudo mkdir -p /var/www/certbot
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL
log_success "SSL certificate obtained"

# -----------------------------------------------------------------------------
# 7. Setup Auto-Renewal
# -----------------------------------------------------------------------------
log_info "Setting up SSL auto-renewal..."
sudo tee /etc/cron.daily/certbot-renew > /dev/null << 'EOF'
#!/bin/bash
certbot renew --quiet --nginx
systemctl reload nginx
EOF
sudo chmod +x /etc/cron.daily/certbot-renew
log_success "SSL auto-renewal configured"

# -----------------------------------------------------------------------------
# 8. Verify SSL Renewal
# -----------------------------------------------------------------------------
log_info "Verifying SSL certificate renewal..."
sudo certbot renew --dry-run
log_success "SSL renewal test passed"

# -----------------------------------------------------------------------------
# Completion
# -----------------------------------------------------------------------------
echo ""
echo "=========================================="
log_success "Nginx and SSL configured!"
echo "=========================================="
echo ""
echo "Certificate location: /etc/letsencrypt/live/$DOMAIN/"
echo "Renewal: Daily cron job at /etc/cron.daily/certbot-renew"
echo ""

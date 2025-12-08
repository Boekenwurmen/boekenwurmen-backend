#!/bin/bash
# Droplet Setup Script for Boekenwurmen
# Run this script on your DigitalOcean Droplet after initial creation

set -e

echo "🚀 Starting Boekenwurmen Droplet Setup..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

echo -e "${GREEN}Step 1:${NC} Updating system packages..."
apt update && apt upgrade -y

echo -e "${GREEN}Step 2:${NC} Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "Docker already installed"
fi

echo -e "${GREEN}Step 3:${NC} Installing Docker Compose plugin..."
apt install docker-compose-plugin -y

echo -e "${GREEN}Step 4:${NC} Creating deployment directory..."
mkdir -p /opt/boekenwurmen/{nginx/conf.d,nginx/html,backend-data}

echo -e "${GREEN}Step 5:${NC} Setting up nginx configuration..."

# Create nginx.conf
cat > /opt/boekenwurmen/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    include /etc/nginx/conf.d/*.conf;
}
EOF

# Get user input for configuration
echo ""
echo -e "${YELLOW}Configuration:${NC}"
read -p "Enter your GitHub username or organization: " GITHUB_USERNAME
read -p "Enter your Droplet IP address: " DROPLET_IP
read -p "Do you have a domain name? (y/n): " HAS_DOMAIN

if [ "$HAS_DOMAIN" = "y" ] || [ "$HAS_DOMAIN" = "Y" ]; then
    read -p "Enter your domain (e.g., example.com): " DOMAIN_NAME
    SERVER_NAME="$DOMAIN_NAME www.$DOMAIN_NAME"
    PUBLIC_API_URL="http://$DOMAIN_NAME/api"
    ORIGIN="http://$DOMAIN_NAME"
else
    SERVER_NAME="_"
    PUBLIC_API_URL="http://$DROPLET_IP:3012"
    ORIGIN="http://$DROPLET_IP"
fi

# Create app.conf
cat > /opt/boekenwurmen/nginx/conf.d/app.conf << EOF
upstream backend_servers {
    server backend:3012;
}

upstream frontend_servers {
    server frontend:3000;
}

server {
    listen 80;
    server_name $SERVER_NAME;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location /api/ {
        proxy_pass http://backend_servers/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://frontend_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Create docker-compose.yml
echo -e "${GREEN}Step 6:${NC} Creating docker-compose.yml..."
cat > /opt/boekenwurmen/docker-compose.yml << EOF
version: '3.8'

services:
  backend:
    image: ghcr.io/${GITHUB_USERNAME}/boekenwurmen-backend:latest
    container_name: boekenwurmen-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3012
      - DATABASE_URL=file:/app/data/clients.db
    volumes:
      - ./backend-data:/app/data
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3012/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    image: ghcr.io/${GITHUB_USERNAME}/boekenwurmen-frontend:latest
    container_name: boekenwurmen-frontend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PUBLIC_API_URL=${PUBLIC_API_URL}
      - ORIGIN=${ORIGIN}
    depends_on:
      - backend
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: boekenwurmen-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./nginx/html:/var/www/html
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
    depends_on:
      - backend
      - frontend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  certbot-etc:
  certbot-var:
EOF

echo -e "${GREEN}Step 7:${NC} Setting up firewall..."
apt install -y ufw
ufw --force enable
ufw allow 22
ufw allow 80
ufw allow 443
ufw status

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Make your GitHub packages public OR log in to GitHub Container Registry:"
echo "   docker login ghcr.io -u ${GITHUB_USERNAME}"
echo ""
echo "2. Navigate to deployment directory:"
echo "   cd /opt/boekenwurmen"
echo ""
echo "3. Pull and start the containers:"
echo "   docker compose pull"
echo "   docker compose up -d"
echo ""
echo "4. Check status:"
echo "   docker compose ps"
echo "   docker compose logs -f"
echo ""
echo "5. Your app will be available at:"
if [ "$HAS_DOMAIN" = "y" ] || [ "$HAS_DOMAIN" = "Y" ]; then
    echo "   http://${DOMAIN_NAME}"
else
    echo "   http://${DROPLET_IP}"
fi
echo ""
echo "📚 For more details, see DEPLOYMENT.md in the backend repository"

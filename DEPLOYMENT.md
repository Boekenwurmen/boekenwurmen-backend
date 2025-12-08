# Deployment Guide for DigitalOcean Droplet

This guide will help you deploy the Boekenwurmen application (backend + frontend) to a DigitalOcean Droplet using Docker.

## Prerequisites

- A DigitalOcean account
- A domain name (optional, but recommended for HTTPS)
- GitHub repositories for both backend and frontend

## Step 1: Create a DigitalOcean Droplet

1. Log in to DigitalOcean and create a new Droplet
2. Choose these settings:
   - **Image**: Ubuntu 24.04 LTS
   - **Plan**: Basic ($6/month or higher recommended)
   - **CPU**: Regular (2GB RAM minimum)
   - **Datacenter**: Choose closest to your users
   - **Authentication**: SSH keys (recommended) or password
   - **Hostname**: boekenwurmen-app

3. Click "Create Droplet" and note your Droplet's IP address

## Step 2: Initial Server Setup

SSH into your Droplet:

```bash
ssh root@your_droplet_ip
```

Update the system and install Docker:

```bash
# Update packages
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version

# Create a non-root user (optional but recommended)
adduser deployer
usermod -aG docker deployer
usermod -aG sudo deployer

# Switch to the new user
su - deployer
```

## Step 3: Create Deployment Directory

```bash
# Create directory for the application
sudo mkdir -p /opt/boekenwurmen
sudo chown $USER:$USER /opt/boekenwurmen
cd /opt/boekenwurmen

# Create required subdirectories
mkdir -p nginx/conf.d nginx/html backend-data
```

## Step 4: Create Docker Compose Configuration

Create `/opt/boekenwurmen/docker-compose.yml`:

```yaml
version: '3.8'

services:
  # Backend service
  backend:
    image: ghcr.io/YOUR_GITHUB_USERNAME/boekenwurmen-backend:latest
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

  # Frontend service
  frontend:
    image: ghcr.io/YOUR_GITHUB_USERNAME/boekenwurmen-frontend:latest
    container_name: boekenwurmen-frontend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PUBLIC_API_URL=http://your_droplet_ip:3012
      - ORIGIN=http://your_droplet_ip
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

  # Nginx reverse proxy
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
```

**Important**: Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username or organization name.

## Step 5: Configure Nginx

Create `/opt/boekenwurmen/nginx/nginx.conf`:

```nginx
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

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    include /etc/nginx/conf.d/*.conf;
}
```

Create `/opt/boekenwurmen/nginx/conf.d/app.conf`:

```nginx
# Upstream backends
upstream backend_servers {
    server backend:3012;
}

upstream frontend_servers {
    server frontend:3000;
}

# HTTP server (will redirect to HTTPS if SSL is enabled)
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;  # Replace with your domain or use _ for IP access

    # For Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # API routes
    location /api/ {
        proxy_pass http://backend_servers/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Frontend routes
    location / {
        proxy_pass http://frontend_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Note**: If using just the IP address without a domain, replace `server_name your_domain.com www.your_domain.com;` with `server_name _;`

## Step 6: Set Up GitHub Container Registry Access

Your Droplet needs to pull images from GitHub Container Registry:

```bash
# Log in to GitHub Container Registry
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

To create a GitHub Personal Access Token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `read:packages` permission
3. Copy the token and use it in the command above

## Step 7: Configure GitHub Secrets

In both your backend and frontend GitHub repositories, add these secrets:

1. Go to: Settings → Secrets and variables → Actions → New repository secret

Add these secrets:
- `DROPLET_HOST`: Your Droplet's IP address
- `DROPLET_USERNAME`: SSH username (e.g., `deployer` or `root`)
- `DROPLET_SSH_KEY`: Your private SSH key for the Droplet

To get your SSH private key:
```bash
cat ~/.ssh/id_rsa  # On your local machine
```

## Step 8: Make Images Public (Alternative to Token)

To avoid needing a GitHub token on the Droplet:

1. Go to your GitHub repository
2. Navigate to Packages
3. Find your package (boekenwurmen-backend or boekenwurmen-frontend)
4. Click Package settings
5. Scroll to "Danger Zone"
6. Click "Change visibility" → Make public

This allows the Droplet to pull images without authentication.

## Step 9: Initial Deployment

```bash
# Pull the images
cd /opt/boekenwurmen
docker compose pull

# Start the services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f
```

## Step 10: Set Up SSL with Let's Encrypt (Optional)

If you have a domain name:

1. Update your domain's DNS to point to your Droplet's IP
2. Wait for DNS propagation (can take up to 48 hours)
3. Obtain SSL certificate:

```bash
# Stop nginx temporarily
docker compose stop nginx

# Get certificate
docker run --rm \
  -v $(pwd)/nginx/html:/var/www/html \
  -v certbot-etc:/etc/letsencrypt \
  -v certbot-var:/var/lib/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly --standalone \
  --email your-email@example.com \
  --agree-tos --no-eff-email \
  -d yourdomain.com -d www.yourdomain.com

# Start nginx
docker compose start nginx
```

4. Update nginx configuration to use SSL (see SSL section below)

## SSL Nginx Configuration

If you set up SSL, update `/opt/boekenwurmen/nginx/conf.d/app.conf`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your_domain.com www.your_domain.com;

    ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/your_domain.com/chain.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # API routes
    location /api/ {
        proxy_pass http://backend:3012/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend routes
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Automated Deployment

Once GitHub Actions is set up, deployments are automatic:

1. Push code to the `main` branch in either repository
2. GitHub Actions builds a new Docker image
3. Image is pushed to GitHub Container Registry
4. GitHub Actions SSHs into your Droplet
5. Droplet pulls the new image and restarts the container

## Useful Commands

```bash
# View logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend

# Restart a service
docker compose restart backend
docker compose restart frontend
docker compose restart nginx

# Stop all services
docker compose down

# Start all services
docker compose up -d

# Update images and restart
docker compose pull
docker compose up -d

# View resource usage
docker stats

# Clean up old images
docker image prune -a -f
```

## Troubleshooting

### Backend not accessible
```bash
# Check if backend is running
docker compose ps backend

# View backend logs
docker compose logs backend

# Check if database file exists
ls -la backend-data/

# Test backend directly
curl http://localhost:3012/health
```

### Frontend not connecting to backend
- Update `PUBLIC_API_URL` in docker-compose.yml
- Restart frontend: `docker compose restart frontend`

### Nginx errors
```bash
# Check nginx config
docker compose exec nginx nginx -t

# Reload nginx
docker compose exec nginx nginx -s reload

# View nginx logs
docker compose logs nginx
```

### Out of disk space
```bash
# Check disk usage
df -h

# Clean up Docker
docker system prune -a -f
docker volume prune -f
```

## Monitoring

Consider setting up monitoring with:
- DigitalOcean Monitoring (built-in)
- Uptime monitoring (UptimeRobot, etc.)
- Log aggregation (Papertrail, Loggly)

## Backups

Regularly backup your data:

```bash
# Backup SQLite database
cp backend-data/clients.db backup-$(date +%Y%m%d).db

# Or create a backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR
cp /opt/boekenwurmen/backend-data/clients.db $BACKUP_DIR/clients-$(date +%Y%m%d-%H%M%S).db
# Keep only last 7 days of backups
find $BACKUP_DIR -name "clients-*.db" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab for daily backups
crontab -e
# Add: 0 2 * * * /opt/boekenwurmen/backup.sh
```

## Security Checklist

- [ ] Set up firewall (ufw)
- [ ] Disable root SSH login
- [ ] Use SSH keys instead of passwords
- [ ] Keep system updated
- [ ] Set up automatic security updates
- [ ] Enable fail2ban
- [ ] Set up SSL/HTTPS
- [ ] Regular backups
- [ ] Monitor logs for suspicious activity

## Cost Estimate

- **Droplet**: $6-12/month (depending on size)
- **Domain**: ~$12/year (optional)
- **Total**: ~$72-144/year + domain

## Support

For issues:
- Check logs: `docker compose logs`
- Review this guide
- Check GitHub Actions runs for deployment errors

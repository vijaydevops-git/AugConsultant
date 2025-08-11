#!/bin/bash

# SVATech Consultant Tracker - One-Click Deployment Script
# This script automates the complete deployment process

set -e

echo "🚀 Starting SVATech Consultant Tracker deployment..."

# Configuration (update these values)
REPO_URL="YOUR_GIT_REPO_URL"
DOMAIN_NAME=""  # Leave empty for HTTP access via EC2 IP
DB_PASSWORD="your_secure_password"  # Password for local PostgreSQL on EC2
AWS_ACCESS_KEY="your_aws_access_key"
AWS_SECRET_KEY="your_aws_secret_key"
AWS_REGION="your_aws_region"
S3_BUCKET="your-s3-bucket-name"
SES_EMAIL="your-verified-email@domain.com"
RECIPIENT_EMAILS="admin@company.com,manager@company.com"

echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

echo "📱 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "🗄️  Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

echo "⚡ Installing PM2 process manager..."
sudo npm install -g pm2

echo "🌐 Installing Nginx and Certbot..."
sudo apt install -y nginx certbot python3-certbot-nginx

echo "📋 Installing additional tools..."
sudo apt install -y git curl wget unzip

echo "📂 Cloning application repository..."
cd /home/ubuntu
if [ -d "consultant-tracker" ]; then
    rm -rf consultant-tracker
fi
git clone $REPO_URL consultant-tracker
cd consultant-tracker

echo "📦 Installing application dependencies..."
npm install

echo "🗄️  Configuring PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE IF NOT EXISTS consultant_tracker;"
sudo -u postgres psql -c "CREATE USER IF NOT EXISTS tracker_user WITH PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE consultant_tracker TO tracker_user;"

# Configure PostgreSQL for connections
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf
echo "local   consultant_tracker   tracker_user                    md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf

sudo systemctl restart postgresql
sudo systemctl enable postgresql

echo "⚙️  Creating environment configuration..."
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://tracker_user:$DB_PASSWORD@localhost:5432/consultant_tracker

# AWS Configuration
AWS_REGION=$AWS_REGION
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_KEY

# S3 Configuration
S3_BUCKET_NAME=$S3_BUCKET
S3_REGION=$AWS_REGION

# SES Configuration
SES_REGION=$AWS_REGION
SES_SENDER_EMAIL=$SES_EMAIL

# Email Report Configuration
REPORT_RECIPIENT_EMAILS=$RECIPIENT_EMAILS

# Application Configuration
NODE_ENV=production
PORT=5000

# Optional: Replit Auth (uncomment and configure if needed)
# REPLIT_CLIENT_ID=your_replit_client_id
# REPLIT_CLIENT_SECRET=your_replit_client_secret
# REPLIT_REDIRECT_URI=http://your-domain.com/auth/callback
EOF

echo "🗄️  Running database migrations..."
npm run db:push

echo "🏗️  Building application..."
npm run build

echo "🚀 Starting application with PM2..."
pm2 delete consultant-tracker 2>/dev/null || true
pm2 start npm --name "consultant-tracker" -- start
pm2 save

# Setup PM2 to start on boot
pm2 startup ubuntu -u ubuntu --hp /home/ubuntu
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup ubuntu -u ubuntu --hp /home/ubuntu

echo "🌐 Configuring Nginx reverse proxy..."
if [ -n "$DOMAIN_NAME" ]; then
    # Configuration with domain name
    sudo tee /etc/nginx/sites-available/consultant-tracker << NGINX_EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;

    # SSL configuration will be added by Certbot

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Main application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINX_EOF
else
    # Configuration for IP-only access (no HTTPS)
    sudo tee /etc/nginx/sites-available/consultant-tracker << 'NGINX_EOF'
server {
    listen 80;
    server_name _;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Main application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
NGINX_EOF
fi



# Enable site and test Nginx
sudo ln -sf /etc/nginx/sites-available/consultant-tracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart Nginx
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# Setup SSL certificate if domain is provided
if [ -n "$DOMAIN_NAME" ]; then
    echo "🔒 Setting up SSL certificate for $DOMAIN_NAME..."
    echo "⚠️  Make sure your domain $DOMAIN_NAME points to this server's IP address!"
    echo "   You can check with: dig $DOMAIN_NAME"
    echo ""
    read -p "Press Enter when your domain is pointing to this server, or Ctrl+C to skip SSL setup..."
    
    # Get SSL certificate
    sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email $SES_EMAIL --redirect
    
    # Setup automatic renewal
    sudo systemctl enable certbot.timer
    sudo systemctl start certbot.timer
    
    echo "✅ SSL certificate installed successfully!"
    APP_URL="https://$DOMAIN_NAME"
else
    echo "ℹ️  No domain configured - using HTTP only"
    APP_URL="http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
fi

echo "🔥 Configuring firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

echo "📊 Creating backup script..."
sudo tee /usr/local/bin/backup-db.sh << 'BACKUP_EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR

# Create database backup
PGPASSWORD="$DB_PASSWORD" pg_dump -h localhost -U tracker_user consultant_tracker > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Database backup completed: backup_$DATE.sql"
BACKUP_EOF

sudo chmod +x /usr/local/bin/backup-db.sh

# Schedule daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-db.sh") | crontab -

echo "🎯 Creating monitoring script..."
tee /home/ubuntu/monitor.sh << 'MONITOR_EOF'
#!/bin/bash

echo "=== Application Status ==="
pm2 status

echo -e "\n=== Service Status ==="
sudo systemctl status nginx --no-pager -l
sudo systemctl status postgresql --no-pager -l

echo -e "\n=== Disk Usage ==="
df -h

echo -e "\n=== Memory Usage ==="
free -m

echo -e "\n=== Recent Application Logs ==="
pm2 logs consultant-tracker --lines 10 --nostream

echo -e "\n=== Application URL ==="
echo "http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
MONITOR_EOF

chmod +x /home/ubuntu/monitor.sh

echo "✅ Deployment completed successfully!"
echo ""
echo "🎯 Application Details:"
echo "   URL: $APP_URL"
echo "   Database: PostgreSQL running on localhost:5432"
echo "   Files stored in: S3 bucket '$S3_BUCKET'"
echo "   Email reports from: $SES_EMAIL"
echo ""
echo "📊 Management Commands:"
echo "   Monitor: ./monitor.sh"
echo "   Logs: pm2 logs consultant-tracker"
echo "   Restart: pm2 restart consultant-tracker"
echo "   Stop: pm2 stop consultant-tracker"
echo "   Backup: sudo /usr/local/bin/backup-db.sh"
echo ""
echo "📅 Automated Features:"
echo "   ✅ Daily email reports at 7:00 PM EST"
echo "   ✅ Weekly email reports every Friday at 7:00 PM EST"
echo "   ✅ Monthly email reports on last day of month at 7:00 PM EST"
echo "   ✅ Daily database backups at 2:00 AM"
echo ""
echo "🔧 Next Steps:"
echo "1. Verify your S3 bucket '$S3_BUCKET' exists and is accessible"
echo "2. Verify your SES email '$SES_EMAIL' is verified in AWS SES console"
echo "3. Test the application by visiting the URL above"
echo "4. Check logs with: pm2 logs consultant-tracker"
echo ""
echo "🚀 Your SVATech Consultant Tracker is now live!"
MONITOR_EOF
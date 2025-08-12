#!/bin/bash

# SVATech Consultant Tracker - EC2 Deployment Script
# This script automates the complete deployment on EC2

set -e

echo "🚀 Starting SVATech Consultant Tracker EC2 Deployment..."

# Variables
DB_NAME="consultant_tracker"
DB_USER="tracker_user"
DB_PASSWORD="MonDad@2022!"
APP_DIR="/home/ubuntu/AugConsultant"

# Update system
echo "📦 Updating system packages..."
sudo apt update
sudo apt install -y curl git nginx postgresql postgresql-contrib

# Install Node.js 20
echo "📦 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Setup PostgreSQL database
echo "🗄️  Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" || echo "Database already exists"
sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';" || echo "User already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
sudo -u postgres psql -c "ALTER USER ${DB_USER} CREATEDB;"

# Configure PostgreSQL for connections
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
echo "host    all             all             127.0.0.1/32            md5" | sudo tee -a /etc/postgresql/*/main/pg_hba.conf
sudo systemctl restart postgresql

# Navigate to application directory
cd $APP_DIR

# Fix ownership and permissions
echo "🔧 Fixing permissions..."
sudo chown -R ubuntu:ubuntu $APP_DIR
chmod -R 755 $APP_DIR

# Clean any existing build artifacts
echo "🧹 Cleaning build directory..."
rm -rf dist node_modules package-lock.json

# Install dependencies
echo "📦 Installing application dependencies..."
npm install

# Set up environment variables
echo "⚙️  Creating environment configuration..."
cat > .env << EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}
AWS_REGION=us-east-1
S3_BUCKET_NAME=consultant-tracker-frontend-app
S3_REGION=us-east-1
SES_REGION=us-east-1
SES_SENDER_EMAIL=sre.aibot@gmail.com
REPORT_RECIPIENT_EMAILS=sre.aibot@gmail.com
NODE_ENV=production
PORT=5000
SESSION_SECRET=ec2-session-secret-key-$(date +%s)
EOF

# Run database migrations
echo "🗄️  Running database setup..."
npm run db:push || echo "Database schema updated"

# Build the application
echo "🔨 Building application..."
npm run build

# Create PM2 ecosystem file
echo "⚙️  Creating PM2 configuration..."
cat > ecosystem.config.json << EOF
{
  "apps": [{
    "name": "consultant-tracker",
    "script": "dist/index.js",
    "instances": 1,
    "exec_mode": "cluster",
    "env": {
      "NODE_ENV": "production",
      "PORT": "5000"
    },
    "env_file": ".env",
    "log_file": "/var/log/pm2/consultant-tracker.log",
    "out_file": "/var/log/pm2/consultant-tracker.out.log",
    "error_file": "/var/log/pm2/consultant-tracker.error.log",
    "restart_delay": 1000,
    "max_restarts": 10
  }]
}
EOF

# Setup log directory
sudo mkdir -p /var/log/pm2
sudo chown ubuntu:ubuntu /var/log/pm2

# Configure Nginx
echo "🌐 Configuring Nginx..."
sudo tee /etc/nginx/sites-available/consultant-tracker << EOF
server {
    listen 80;
    server_name _;

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
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/consultant-tracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Start the application with PM2
echo "🚀 Starting application..."
pm2 delete consultant-tracker 2>/dev/null || true
pm2 start ecosystem.config.json
pm2 save
pm2 startup

# Display status
echo "✅ Deployment completed!"
echo ""
echo "📊 Application Status:"
pm2 status
echo ""
echo "🌐 Your application is available at:"
echo "   http://$(curl -s ifconfig.me)"
echo ""
echo "📋 Useful commands:"
echo "   pm2 logs consultant-tracker  # View logs"
echo "   pm2 restart consultant-tracker  # Restart app"
echo "   pm2 status  # Check status"
echo ""
echo "🗄️  Database connection:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: ${DB_NAME}"
echo "   User: ${DB_USER}"

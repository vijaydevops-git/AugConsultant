#!/bin/bash

# Update system
yum update -y

# Install Node.js 20
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
yum install -y nodejs

# Install Git
yum install -y git

# Install PM2 globally
npm install -g pm2

# Install PostgreSQL server and client
amazon-linux-extras install postgresql13
yum install -y postgresql-server postgresql-contrib

# Install AWS CLI (if not already installed)
yum install -y awscli

# Get instance metadata
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
AVAILABILITY_ZONE=$(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)

# Attach EBS volume to instance
aws ec2 attach-volume --volume-id ${ebs_volume_id} --instance-id $INSTANCE_ID --device /dev/xvdf --region ${aws_region}

# Wait for volume to be attached
while [ ! -e /dev/xvdf ]; do
  echo "Waiting for EBS volume to be attached..."
  sleep 5
done

# Check if volume has a filesystem, if not create one
if ! file -s /dev/xvdf | grep -q filesystem; then
  echo "Creating filesystem on EBS volume..."
  mkfs -t ext4 /dev/xvdf
fi

# Create mount point and mount the volume
mkdir -p /var/lib/pgsql
mount /dev/xvdf /var/lib/pgsql

# Add to fstab for persistent mounting
echo "/dev/xvdf /var/lib/pgsql ext4 defaults,nofail 0 2" >> /etc/fstab

# Set proper ownership for PostgreSQL
chown -R postgres:postgres /var/lib/pgsql

# Initialize PostgreSQL database (if not already initialized)
if [ ! -f /var/lib/pgsql/data/postgresql.conf ]; then
  echo "Initializing PostgreSQL database..."
  sudo -u postgres /usr/bin/postgresql-setup initdb
fi

# Configure PostgreSQL
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '${db_password}';"

# Update PostgreSQL configuration files
sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /var/lib/pgsql/data/postgresql.conf
sed -i "s/#port = 5432/port = 5432/" /var/lib/pgsql/data/postgresql.conf

# Configure pg_hba.conf for local connections
echo "local   all             postgres                                md5" > /var/lib/pgsql/data/pg_hba.conf
echo "local   all             all                                     md5" >> /var/lib/pgsql/data/pg_hba.conf
echo "host    all             all             127.0.0.1/32            md5" >> /var/lib/pgsql/data/pg_hba.conf
echo "host    all             all             ::1/128                 md5" >> /var/lib/pgsql/data/pg_hba.conf

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Create application database
sudo -u postgres createdb consultant_tracker

# Create application directory
mkdir -p /opt/consultant-tracker
cd /opt/consultant-tracker

# Clone application code (replace with your actual repository)
# For now, we'll create a placeholder - you'll need to update this with your actual repo
git clone https://github.com/your-repo/consultant-tracker.git .
# If you don't have a git repo yet, you can upload the code manually

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=5000

# Database Configuration (Local PostgreSQL)
DATABASE_URL=postgresql://postgres:${db_password}@localhost:5432/consultant_tracker

# AWS Configuration
AWS_REGION=${aws_region}
AWS_S3_BUCKET=${s3_bucket}

# SES Configuration  
SES_SENDER_EMAIL=${ses_sender}

# Email Report Configuration
REPORT_RECIPIENT_EMAILS=admin@yourdomain.com,manager@yourdomain.com

# Session Configuration
SESSION_SECRET=$(openssl rand -base64 32)

# Replit Auth (you'll need to configure this in Replit's auth dashboard)
REPLIT_CLIENT_ID=your_replit_client_id
REPLIT_CLIENT_SECRET=your_replit_client_secret
REPLIT_REDIRECT_URI=http://your-domain.com/auth/callback
EOF

# Run database migrations
npm run db:push

# Build the application
npm run build

# Create PM2 ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'consultant-tracker',
      script: 'server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/consultant-tracker-error.log',
      out_file: '/var/log/consultant-tracker-out.log',
      log_file: '/var/log/consultant-tracker.log',
      time: true
    }
  ]
};
EOF

# Start application with PM2
pm2 start ecosystem.config.js
pm2 startup
pm2 save

# Install and configure nginx as reverse proxy
yum install -y nginx

cat > /etc/nginx/conf.d/consultant-tracker.conf << EOF
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

# Start and enable nginx
systemctl start nginx
systemctl enable nginx

# Create log rotation
cat > /etc/logrotate.d/consultant-tracker << EOF
/var/log/consultant-tracker*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 644 root root
    postrotate
        pm2 reload consultant-tracker
    endscript
}
EOF

# Set up CloudWatch agent (optional)
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Create basic CloudWatch config
mkdir -p /opt/aws/amazon-cloudwatch-agent/etc
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/consultant-tracker.log",
                        "log_group_name": "/aws/ec2/consultant-tracker",
                        "log_stream_name": "{instance_id}/application"
                    },
                    {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "/aws/ec2/consultant-tracker",
                        "log_stream_name": "{instance_id}/nginx-access"
                    }
                ]
            }
        }
    }
}
EOF

echo "Application setup completed successfully!"
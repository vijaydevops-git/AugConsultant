# AWS Deployment Guide - SVATech Consultant Tracker

## Prerequisites

Before starting, ensure you have:
- AWS Account with IAM user credentials
- EC2 instance running (Ubuntu 20.04+ recommended)
- Git installed on your EC2 instance
- Your repository URL ready

## Step 1: Initial EC2 Setup

### 1.1 Connect to your EC2 instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 1.2 Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install required tools
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 14
sudo apt install -y postgresql postgresql-contrib

# Install Terraform
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform

# Install Git (if not already installed)
sudo apt install -y git

# Install PM2 for process management
sudo npm install -g pm2
```

## Step 2: Database Setup

### 2.1 Configure PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user (run these commands in PostgreSQL prompt)
CREATE DATABASE consultant_tracker;
CREATE USER tracker_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE consultant_tracker TO tracker_user;
\q
```

### 2.2 Configure PostgreSQL for external connections
```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Find and uncomment/modify this line:
listen_addresses = 'localhost'

# Edit pg_hba.conf for authentication
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add this line for local connections:
local   consultant_tracker   tracker_user                    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

## Step 3: Clone and Setup Application

### 3.1 Clone your repository
```bash
cd /home/ubuntu
git clone YOUR_REPOSITORY_URL consultant-tracker
cd consultant-tracker
```

### 3.2 Install application dependencies
```bash
npm install
```

### 3.3 Set up environment variables
```bash
# Create environment file
cp .env.example .env
nano .env
```

### 3.4 Configure environment variables in .env file:
```bash
# Database Configuration
DATABASE_URL=postgresql://tracker_user:your_secure_password@localhost:5432/consultant_tracker

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# S3 Configuration
S3_BUCKET_NAME=tracker-bucket
S3_REGION=us-east-1

# SES Configuration
SES_REGION=us-east-1
SES_SENDER_EMAIL=your-verified-email@domain.com

# Email Report Configuration
REPORT_RECIPIENT_EMAILS=admin@company.com,manager@company.com

# Replit Auth (if using)
REPLIT_CLIENT_ID=your_replit_client_id
REPLIT_CLIENT_SECRET=your_replit_client_secret
REPLIT_REDIRECT_URI=http://your-domain.com/auth/callback

# Application Configuration
NODE_ENV=production
PORT=3000
```

## Step 4: AWS Services Setup

### 4.1 Configure AWS CLI (if needed)
```bash
# Install AWS CLI if not already installed
sudo apt install -y awscli

# Configure AWS credentials
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (e.g., us-east-1)
# Enter default output format (json)
```

### 4.2 Create S3 Bucket
```bash
# Create S3 bucket for file storage
aws s3 mb s3://tracker-bucket --region us-east-1

# Set bucket policy for application access (optional - Terraform will handle this)
```

### 4.3 Verify SES Email
- Go to AWS SES Console
- Verify your sender email address
- Note the verified email for your .env file

## Step 5: Terraform Infrastructure Setup

### 5.1 Navigate to terraform directory
```bash
cd terraform
```

### 5.2 Create terraform.tfvars file
```bash
cp terraform.tfvars.example terraform.tfvars
nano terraform.tfvars
```

### 5.3 Configure terraform.tfvars:
```hcl
# AWS Configuration
aws_region = "us-east-1"
availability_zones = ["us-east-1a", "us-east-1b"]

# VPC Configuration
vpc_cidr = "10.0.0.0/16"
public_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnet_cidrs = ["10.0.3.0/24", "10.0.4.0/24"]

# Application Configuration
app_name = "consultant-tracker"
environment = "production"
instance_type = "t3.medium"
min_size = 1
max_size = 3
desired_capacity = 2

# S3 Configuration
s3_bucket_name = "tracker-bucket"

# Database Configuration (Note: This creates RDS, but you're using EC2 PostgreSQL)
db_name = "consultant_tracker"
db_username = "tracker_user"
db_password = "your_secure_password"

# Domain Configuration (optional)
domain_name = ""  # Leave empty if not using custom domain
certificate_arn = ""  # Leave empty if not using SSL certificate

# SES Configuration
ses_sender_email = "your-verified-email@domain.com"
```

### 5.4 Initialize and apply Terraform
```bash
# Initialize Terraform
terraform init

# Review the planned changes
terraform plan

# Apply the infrastructure (this will create AWS resources)
terraform apply
```

**Important**: Since you're running PostgreSQL on EC2 instead of RDS, you may want to modify the Terraform configuration to skip RDS creation or comment out the RDS resources.

## Step 6: Database Migration and Seeding

### 6.1 Run database migrations
```bash
cd /home/ubuntu/consultant-tracker
npm run db:push
```

### 6.2 Seed initial data (optional)
```bash
npm run seed
```

## Step 7: Application Deployment

### 7.1 Build the application
```bash
# Build frontend and backend
npm run build
```

### 7.2 Start application with PM2
```bash
# Start the application
pm2 start npm --name "consultant-tracker" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

### 7.3 Configure reverse proxy (Nginx)
```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/consultant-tracker
```

### 7.4 Nginx configuration file:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 7.5 Enable Nginx site
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/consultant-tracker /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 8: Security Configuration

### 8.1 Configure firewall
```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Check firewall status
sudo ufw status
```

### 8.2 SSL Certificate (optional, recommended for production)
```bash
# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com
```

## Step 9: Verification and Testing

### 9.1 Check application status
```bash
# Check PM2 processes
pm2 status

# Check application logs
pm2 logs consultant-tracker

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql
```

### 9.2 Test application access
- Visit your EC2 public IP or domain in a browser
- Verify the application loads correctly
- Test login functionality
- Check database connectivity

### 9.3 Test email functionality
- Trigger a test email report from the admin panel
- Verify SES is sending emails correctly

## Step 10: Monitoring and Maintenance

### 10.1 Setup log rotation
```bash
# Configure PM2 log rotation
pm2 install pm2-logrotate
```

### 10.2 Setup automated backups
```bash
# Create backup script
sudo nano /usr/local/bin/backup-db.sh
```

### 10.3 Backup script content:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR

pg_dump -h localhost -U tracker_user consultant_tracker > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

### 10.4 Make backup script executable and schedule
```bash
chmod +x /usr/local/bin/backup-db.sh

# Add to crontab for daily backups
crontab -e
# Add this line: 0 2 * * * /usr/local/bin/backup-db.sh
```

## Troubleshooting

### Common Issues:

1. **Port 3000 not accessible**: Check firewall settings and Nginx configuration
2. **Database connection issues**: Verify PostgreSQL is running and credentials are correct
3. **SES email not working**: Ensure email is verified in SES console and region is correct
4. **S3 access issues**: Check AWS credentials and bucket permissions

### Useful Commands:
```bash
# Check running processes
sudo netstat -tlnp

# Check application logs
tail -f /var/log/nginx/error.log
pm2 logs consultant-tracker

# Restart services
sudo systemctl restart nginx
pm2 restart consultant-tracker

# Check disk usage
df -h

# Check memory usage
free -m
```

## Post-Deployment Checklist

- [ ] Application is accessible via web browser
- [ ] Database is connected and seeded
- [ ] Email notifications are working
- [ ] File uploads to S3 are working
- [ ] SSL certificate is installed (if applicable)
- [ ] Backups are configured
- [ ] Monitoring is set up
- [ ] Firewall is configured
- [ ] PM2 is set to start on boot

## Support

If you encounter issues during deployment:
1. Check the application logs: `pm2 logs consultant-tracker`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify all environment variables are set correctly
4. Ensure all AWS services are properly configured
5. Check that all required ports are open in security groups

For additional support, refer to the main project documentation in `replit.md` and `DEPLOYMENT_CHECKLIST.md`.
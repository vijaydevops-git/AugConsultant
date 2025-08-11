# Manual Infrastructure Configuration Guide

Since you're handling infrastructure provisioning manually, here are the exact files and locations where you need to update your AWS resource details:

## 1. S3 Bucket Configuration

### File: `terraform/main.tf`
**Lines 233-234:**
```hcl
Resource = [
  "arn:aws:s3:::your-actual-bucket-name",
  "arn:aws:s3:::your-actual-bucket-name/*"
]
```

### File: `terraform/user-data.sh`
**Line 100:**
```bash
S3_BUCKET_NAME=your-actual-bucket-name
```

**Line 109:**
```bash
S3_REGION=your-bucket-region
```

## 2. Environment Variables (.env file)

Create/update `.env` file on your EC2 instance:

```bash
# Database Configuration
DATABASE_URL=postgresql://tracker_user:your_db_password@localhost:5432/consultant_tracker

# AWS Configuration
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# S3 Configuration
S3_BUCKET_NAME=your-actual-bucket-name
S3_REGION=your-bucket-region

# SES Configuration
SES_REGION=your-ses-region
SES_SENDER_EMAIL=your-verified-email@domain.com

# Email Report Configuration
REPORT_RECIPIENT_EMAILS=admin@company.com,manager@company.com

# Application Configuration
NODE_ENV=production
PORT=5000

# Replit Auth (optional)
REPLIT_CLIENT_ID=your_replit_client_id
REPLIT_CLIENT_SECRET=your_replit_client_secret
REPLIT_REDIRECT_URI=http://your-domain.com/auth/callback
```

## 3. Terraform Variables (if using any Terraform)

### File: `terraform/terraform.tfvars`
Update these values:

```hcl
# AWS Configuration
aws_region = "your-aws-region"
availability_zones = ["your-region-a", "your-region-b"]

# S3 Configuration
s3_bucket_name = "your-actual-bucket-name"

# SES Configuration
ses_sender_email = "your-verified-email@domain.com"

# Database Configuration
db_name = "consultant_tracker"
db_username = "tracker_user"
db_password = "your_secure_password"

# Email Configuration
report_recipient_emails = "admin@company.com,manager@company.com"

# Git Repository (for deployment)
git_repo_url = "https://github.com/your-username/your-repo.git"
git_branch = "main"

# AWS Credentials for application
aws_access_key_id = "your_aws_access_key"
aws_secret_access_key = "your_aws_secret_key"
```

## 4. User Data Script Configuration

### File: `terraform/user-data.sh`
Update these environment variables:

**Lines to modify:**
- Line 100: `S3_BUCKET_NAME=your-actual-bucket-name`
- Line 101: `S3_REGION=your-bucket-region`
- Line 102: `SES_SENDER_EMAIL=your-verified-email@domain.com`
- Line 103: `REPORT_RECIPIENT_EMAILS=admin@company.com,manager@company.com`
- Line 106: `AWS_ACCESS_KEY_ID=your_aws_access_key`
- Line 107: `AWS_SECRET_ACCESS_KEY=your_aws_secret_key`

## 5. One-Click Deployment Script

### File: `deploy.sh` (create this)
```bash
#!/bin/bash

# Automated deployment script
set -e

echo "Starting automated deployment..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Clone your repository
cd /home/ubuntu
git clone YOUR_REPO_URL consultant-tracker
cd consultant-tracker

# Install dependencies
npm install

# Set up PostgreSQL
sudo -u postgres psql -c "CREATE DATABASE consultant_tracker;"
sudo -u postgres psql -c "CREATE USER tracker_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE consultant_tracker TO tracker_user;"

# Configure environment
cat > .env << EOF
DATABASE_URL=postgresql://tracker_user:your_password@localhost:5432/consultant_tracker
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your-bucket-name
S3_REGION=your-region
SES_REGION=your-region
SES_SENDER_EMAIL=your-email@domain.com
REPORT_RECIPIENT_EMAILS=admin@company.com
NODE_ENV=production
PORT=5000
EOF

# Run database migrations
npm run db:push

# Build application
npm run build

# Start with PM2
pm2 start npm --name "consultant-tracker" -- start
pm2 save
pm2 startup

# Configure Nginx
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

sudo ln -s /etc/nginx/sites-available/consultant-tracker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "Deployment completed! Access your application via your EC2 public IP"
```

## Quick Setup Checklist

1. **Update S3 bucket name in:**
   - `terraform/main.tf` (lines 233-234)
   - `terraform/user-data.sh` (line 100)
   - `.env` file

2. **Update AWS credentials in:**
   - `.env` file
   - `terraform/terraform.tfvars`

3. **Update SES email in:**
   - `.env` file
   - `terraform/terraform.tfvars`
   - `terraform/user-data.sh` (line 102)

4. **Update recipient emails in:**
   - `.env` file
   - `terraform/terraform.tfvars`

5. **Update database password in:**
   - `.env` file
   - `terraform/terraform.tfvars`

## Command to Run After Updates

```bash
# Make deployment script executable
chmod +x deploy.sh

# Run deployment
sudo ./deploy.sh
```

## File Locations Summary

- **S3 Bucket**: `terraform/main.tf:233-234`, `terraform/user-data.sh:100`, `.env`
- **AWS Credentials**: `.env`, `terraform/terraform.tfvars`
- **SES Email**: `.env`, `terraform/terraform.tfvars`, `terraform/user-data.sh:102`
- **Database Password**: `.env`, `terraform/terraform.tfvars`
- **Recipients**: `.env`, `terraform/terraform.tfvars`

This approach gives you full control while automating the application deployment!
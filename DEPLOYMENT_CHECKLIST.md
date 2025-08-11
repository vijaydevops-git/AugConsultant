# Deployment Checklist - SVATech Consultant Tracker

## Pre-Deployment Requirements

### ✅ AWS Infrastructure (Manual Setup)
- [ ] EC2 instance running (Ubuntu 22.04 recommended)
- [ ] S3 bucket created and accessible
- [ ] SES email address verified
- [ ] AWS credentials (Access Key + Secret Key) ready
- [ ] EBS volume for database storage (handled by script)

### ✅ Repository Setup
- [ ] Code pushed to Git repository
- [ ] Repository URL ready

## Configuration Updates Required

### 📝 Update deploy.sh Variables (Lines 14-21)

```bash
REPO_URL="https://github.com/your-username/your-repo.git"
DOMAIN_NAME=""  # Leave empty for HTTP access
DB_PASSWORD="your_secure_password"
AWS_ACCESS_KEY="your_aws_access_key"
AWS_SECRET_KEY="your_aws_secret_key"
AWS_REGION="us-east-1"
S3_BUCKET="your-existing-bucket-name"
SES_EMAIL="your-verified-email@domain.com"
RECIPIENT_EMAILS="admin@company.com,manager@company.com"
```

## Deployment Steps

### 1. Connect to EC2
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### 2. Clone Repository
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo-name
```

### 3. Update Configuration
```bash
nano deploy.sh
# Update the 8 variables above
```

### 4. Run Deployment
```bash
chmod +x deploy.sh
sudo ./deploy.sh
```

## What the Script Does Automatically

### 🛠️ System Setup
- ✅ Updates Ubuntu packages
- ✅ Installs Node.js 20
- ✅ Installs PostgreSQL 14
- ✅ Installs PM2 process manager
- ✅ Installs Nginx web server

### 🗄️ Database Configuration
- ✅ Creates `consultant_tracker` database
- ✅ Creates `tracker_user` with permissions
- ✅ Configures PostgreSQL for local connections
- ✅ Runs database migrations (`npm run db:push`)

### 🚀 Application Deployment
- ✅ Installs application dependencies
- ✅ Builds production version
- ✅ Starts with PM2 process manager
- ✅ Configures auto-start on boot

### 🌐 Web Server Setup
- ✅ Configures Nginx reverse proxy
- ✅ Sets up HTTP access on port 80
- ✅ Adds security headers

### 🔒 Security Configuration
- ✅ Enables UFW firewall
- ✅ Opens SSH (22), HTTP (80) ports
- ✅ Blocks unnecessary ports

### 📧 Email System
- ✅ Configures AWS SES integration
- ✅ Sets up automated reports:
  - Daily: 7:00 PM EST
  - Weekly: Friday 7:00 PM EST
  - Monthly: Last day 7:00 PM EST

### 💾 Backup System
- ✅ Creates daily database backup script
- ✅ Schedules backups at 2:00 AM daily
- ✅ Retains 7 days of backups

## Post-Deployment Verification

### ✅ Application Access
- [ ] Visit: `http://your-ec2-public-ip`
- [ ] Application loads successfully
- [ ] Login functionality works

### ✅ System Health
```bash
# Check application status
pm2 status

# Check system services
sudo systemctl status nginx
sudo systemctl status postgresql

# View application logs
pm2 logs consultant-tracker

# Run health monitor
./monitor.sh
```

### ✅ Email Testing
- [ ] Test email reports from admin panel
- [ ] Verify SES sends emails successfully
- [ ] Check email formatting and content

### ✅ Database Verification
- [ ] Submissions save correctly
- [ ] Consultant data persists
- [ ] Interview scheduling works

### ✅ File Upload Testing
- [ ] Resume uploads work
- [ ] Files save to S3 bucket
- [ ] Download functionality works

## Troubleshooting

### Common Issues

**Application not accessible:**
```bash
# Check if services are running
pm2 status
sudo systemctl status nginx

# Check firewall
sudo ufw status

# View error logs
pm2 logs consultant-tracker
sudo tail -f /var/log/nginx/error.log
```

**Database connection issues:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -c "SELECT version();"

# Check database exists
sudo -u postgres psql -l | grep consultant_tracker
```

**Email not working:**
- Verify SES email is verified in AWS console
- Check AWS credentials are correct
- Test with AWS CLI: `aws ses get-send-quota`

**S3 access issues:**
- Verify bucket exists and is accessible
- Check AWS credentials have S3 permissions
- Test with AWS CLI: `aws s3 ls s3://your-bucket-name`

### Useful Commands

```bash
# Restart application
pm2 restart consultant-tracker

# Restart web server
sudo systemctl restart nginx

# Manual database backup
sudo /usr/local/bin/backup-db.sh

# Check disk space
df -h

# Check memory usage
free -m

# View system logs
journalctl -f
```

## Expected Final State

### ✅ Application URL
**Access:** `http://your-ec2-public-ip`

### ✅ Automated Features
- Daily/weekly/monthly email reports
- Automatic database backups
- Process monitoring with PM2
- Auto-restart on server reboot

### ✅ File Storage
- Resumes stored in S3 bucket
- Database on local EBS volume
- Backups in `/home/ubuntu/backups/`

### ✅ Security
- Firewall configured
- Security headers enabled
- Non-root user execution

The deployment provides a complete, production-ready consultant tracking system accessible via your EC2 public IP address.
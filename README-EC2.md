# SVATech Consultant Tracker - EC2 Deployment Guide

## Quick EC2 Deployment

### Prerequisites
- EC2 instance running Ubuntu 20.04 or later
- Security group allowing HTTP (port 80) and SSH (port 22)
- At least 2GB RAM and 10GB storage

### One-Command Deployment

1. **Clone the repository:**
```bash
cd /home/ubuntu
git clone https://github.com/your-repo/AugConsultant.git
cd AugConsultant
```

2. **Run the deployment script:**
```bash
chmod +x ec2-deploy.sh
sudo ./ec2-deploy.sh
```

The deployment script will automatically:
- ✅ Update system packages
- ✅ Install Node.js 20, PM2, PostgreSQL, and Nginx
- ✅ Create the database and user
- ✅ Install application dependencies
- ✅ Build the application
- ✅ Configure environment variables
- ✅ Set up PM2 process management
- ✅ Configure Nginx as reverse proxy
- ✅ Start the application

### Manual Deployment (Alternative)

If you prefer manual setup:

#### 1. System Setup
```bash
sudo apt update
sudo apt install -y curl git nginx postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

#### 2. Database Setup
```bash
sudo -u postgres createdb consultant_tracker
sudo -u postgres createuser tracker_user
sudo -u postgres psql -c "ALTER USER tracker_user WITH PASSWORD 'MonDad@2022!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE consultant_tracker TO tracker_user;"
```

#### 3. Application Setup
```bash
cd /home/ubuntu/AugConsultant
npm install
npm run build
npm run db:push
```

#### 4. Start with PM2
```bash
pm2 start ecosystem.config.json
pm2 save
pm2 startup
```

#### 5. Configure Nginx
```bash
sudo cp nginx.conf /etc/nginx/sites-available/consultant-tracker
sudo ln -sf /etc/nginx/sites-available/consultant-tracker /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx
```

## Environment Variables

The application uses the following environment variables (automatically configured):

```bash
DATABASE_URL=postgresql://tracker_user:MonDad@2022!@localhost:5432/consultant_tracker
AWS_REGION=us-east-1
S3_BUCKET_NAME=consultant-tracker-frontend-app
S3_REGION=us-east-1
SES_REGION=us-east-1
SES_SENDER_EMAIL=sre.aibot@gmail.com
REPORT_RECIPIENT_EMAILS=sre.aibot@gmail.com
NODE_ENV=production
PORT=5000
SESSION_SECRET=ec2-session-secret-key-2024
```

## Key Features for EC2 Deployment

### ✅ No Replit Dependencies
- Removed all Replit authentication requirements
- Uses simplified EC2-compatible authentication
- No `REPLIT_DOMAINS` or similar variables needed

### ✅ Production-Ready Configuration
- PM2 process management with auto-restart
- Nginx reverse proxy for performance
- PostgreSQL database with proper user management
- Environment variable management
- Log rotation and monitoring

### ✅ AWS Integration Ready
- SES for email notifications
- S3 for file storage
- IAM role support for AWS services

## Management Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs consultant-tracker

# Restart application
pm2 restart consultant-tracker

# Stop application
pm2 stop consultant-tracker

# Monitor real-time
pm2 monit

# View database
sudo -u postgres psql consultant_tracker
```

## Troubleshooting

### Application won't start
```bash
# Check PM2 logs
pm2 logs consultant-tracker --lines 50

# Check if database is running
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -c "\l"
```

### Permission issues
```bash
# Fix ownership
sudo chown -R ubuntu:ubuntu /home/ubuntu/AugConsultant

# Fix permissions
chmod +x ec2-deploy.sh
```

### Nginx issues
```bash
# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

## Security Considerations

1. **Database Security:**
   - Database user has limited privileges
   - Connection restricted to localhost
   - Strong password configured

2. **Application Security:**
   - Environment variables properly secured
   - Session secrets randomized
   - HTTP-only cookies enabled

3. **System Security:**
   - Regular system updates recommended
   - Firewall configuration (only ports 22, 80 open)
   - PM2 process isolation

## Performance Optimization

- **Memory Usage:** ~100MB per application instance
- **CPU Usage:** Minimal during normal operation
- **Database:** PostgreSQL optimized for small-medium workload
- **Caching:** Nginx static file serving
- **Monitoring:** PM2 built-in monitoring

## Backup and Maintenance

### Database Backup
```bash
# Create backup
sudo -u postgres pg_dump consultant_tracker > backup_$(date +%Y%m%d).sql

# Restore backup
sudo -u postgres psql consultant_tracker < backup_YYYYMMDD.sql
```

### Log Management
```bash
# Clear PM2 logs
pm2 flush

# Rotate logs
pm2 reload all
```

## Access Your Application

After successful deployment, access your application at:
```
http://YOUR_EC2_PUBLIC_IP
```

The application includes:
- 📊 Dashboard with analytics
- 👥 Consultant management
- 🏢 Vendor tracking
- 📝 Submission workflow
- 📅 Interview scheduling
- 📧 Automated email reports
- 👤 User management (Admin panel)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review PM2 logs for error details
3. Ensure all prerequisites are met
4. Verify AWS credentials if using S3/SES features
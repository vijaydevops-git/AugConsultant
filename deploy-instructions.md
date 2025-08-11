# AWS Deployment Instructions for SVATech Consultant Tracker

## Architecture Overview

This deployment uses:
- **EC2 instances** with Auto Scaling for application hosting
- **PostgreSQL** installed directly on EC2 with dedicated EBS volumes for data persistence
- **S3 bucket** "tracker-bucket" for resume and document storage
- **AWS SES** for email notifications and reports
- **Application Load Balancer** for high availability

## Prerequisites

1. **AWS Account Setup**
   - AWS account with appropriate permissions
   - EC2 instance created (as mentioned)
   - S3 bucket "tracker-bucket" created (as mentioned)
   - SES configured with verified sender email

2. **Local Tools Required**
   - Terraform installed
   - AWS CLI configured with credentials
   - Git installed

## Step 1: Prepare Your EC2 Instance

1. SSH into your existing EC2 instance:
   ```bash
   ssh -i your-key.pem ec2-user@your-ec2-ip
   ```

2. Install Terraform on EC2:
   ```bash
   sudo yum update -y
   sudo yum install -y yum-utils
   sudo yum-config-manager --add-repo https://rpm.releases.hashicorp.com/AmazonLinux/hashicorp.repo
   sudo yum -y install terraform
   ```

3. Install AWS CLI (if not already installed):
   ```bash
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

4. Configure AWS credentials:
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Enter your default region (e.g., us-east-1)
   # Enter output format (json)
   ```

## Step 2: Deploy Infrastructure

1. Create a deployment directory:
   ```bash
   mkdir ~/consultant-tracker-deploy
   cd ~/consultant-tracker-deploy
   ```

2. Copy the Terraform files (you'll need to upload these to your EC2):
   ```bash
   # Copy main.tf, user-data.sh, and terraform.tfvars.example
   # You can use scp from your local machine or create them directly
   ```

3. Create your terraform.tfvars file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   nano terraform.tfvars
   ```

   Update the values:
   ```hcl
   aws_region = "us-east-1"
   app_name = "consultant-tracker"
   environment = "prod"
   db_password = "YourSecurePassword123!"
   ses_sender_email = "your-verified-email@yourdomain.com"
   ```

4. Initialize and apply Terraform:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

   Type "yes" when prompted to confirm.

## Step 3: Update Application Code

1. **Update the user-data.sh script** with your actual Git repository:
   - Replace the placeholder git clone command with your actual repository
   - Or manually upload your application code

2. **Configure Replit Auth** (if using):
   - Go to Replit's auth dashboard
   - Create a new application
   - Update the environment variables in the user-data.sh script

## Step 4: Upload Application Code

If you don't have a Git repository set up yet, you can manually upload the code:

1. Create a compressed archive of your application:
   ```bash
   # On your local machine
   tar -czf consultant-tracker.tar.gz /path/to/your/app
   ```

2. Upload to your EC2 instance:
   ```bash
   scp -i your-key.pem consultant-tracker.tar.gz ec2-user@your-ec2-ip:~/
   ```

3. Extract and set up on the target instances:
   ```bash
   # This will be handled automatically by the Auto Scaling Group
   # Or you can manually extract on your current instance for testing
   ```

## Step 5: Configure SES

1. **Verify your sender email** in AWS SES:
   - Go to AWS SES Console
   - Navigate to "Verified identities"
   - Add and verify your sender email address

2. **Move out of SES sandbox** (for production):
   - Submit a request to move out of the SES sandbox
   - This allows sending to any email address, not just verified ones

## Step 6: Post-Deployment Configuration

1. **Update DNS** (if using a custom domain):
   - Point your domain to the Load Balancer DNS name (output from Terraform)

2. **SSL Certificate** (recommended for production):
   - Use AWS Certificate Manager to create an SSL certificate
   - Update the Load Balancer listener to use HTTPS

3. **Monitoring**:
   - CloudWatch logs are automatically configured
   - Set up CloudWatch alarms for monitoring

## Step 7: Environment Variables

The application will use these environment variables (automatically set by user-data.sh):

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/consultant_tracker
AWS_REGION=us-east-1
AWS_S3_BUCKET=tracker-bucket
SES_SENDER_EMAIL=your-verified-email@yourdomain.com
SESSION_SECRET=auto-generated-secret
```

## Important Notes

1. **Security**:
   - PostgreSQL runs locally on EC2 instances with encrypted EBS volumes
   - Security groups restrict access appropriately
   - Use strong passwords for the database
   - Database data is stored on dedicated EBS volumes for persistence

2. **Scaling**:
   - Auto Scaling Group is configured to run 2 instances by default
   - Can scale up to 3 instances based on demand
   - Load Balancer distributes traffic across instances

3. **Backups**:
   - EBS volume snapshots can be scheduled for database backups
   - Consider setting up S3 bucket versioning for uploaded files
   - PostgreSQL can be configured with point-in-time recovery if needed

4. **Costs**:
   - This setup uses t3.medium for EC2 instances with 50GB EBS volumes
   - No RDS costs since PostgreSQL runs on EC2
   - Adjust instance types and EBS volume sizes based on your needs

## Terraform Outputs

After deployment, Terraform will output:
- Load Balancer DNS name (your application URL)
- EBS volume ID for PostgreSQL data
- S3 bucket name

## Troubleshooting

1. **Check application logs**:
   ```bash
   # SSH to any EC2 instance
   sudo tail -f /var/log/consultant-tracker.log
   ```

2. **Check PM2 status**:
   ```bash
   pm2 status
   pm2 logs
   ```

3. **Check nginx status**:
   ```bash
   sudo systemctl status nginx
   sudo tail -f /var/log/nginx/error.log
   ```

4. **Database connectivity**:
   ```bash
   # SSH to EC2 instance first, then:
   sudo -u postgres psql -d consultant_tracker
   ```

## Cleanup

To destroy all resources:
```bash
terraform destroy
```

**Warning**: This will delete all data. Make sure to backup important data before destroying.
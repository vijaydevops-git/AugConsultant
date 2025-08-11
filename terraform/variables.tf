variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.3.0/24", "10.0.4.0/24"]
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "consultant-tracker"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "production"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "min_size" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum number of instances"
  type        = number
  default     = 3
}

variable "desired_capacity" {
  description = "Desired number of instances"
  type        = number
  default     = 1
}

variable "s3_bucket_name" {
  description = "S3 bucket name for file storage"
  type        = string
  default     = "tracker-bucket"
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "consultant_tracker"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "tracker_user"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "SSL certificate ARN"
  type        = string
  default     = ""
}

variable "ses_sender_email" {
  description = "SES verified sender email"
  type        = string
}

variable "report_recipient_emails" {
  description = "Email addresses to receive reports"
  type        = string
  default     = ""
}

variable "git_repo_url" {
  description = "Git repository URL"
  type        = string
}

variable "git_branch" {
  description = "Git branch to deploy"
  type        = string
  default     = "main"
}

variable "aws_access_key_id" {
  description = "AWS Access Key ID for the application"
  type        = string
  sensitive   = true
}

variable "aws_secret_access_key" {
  description = "AWS Secret Access Key for the application"
  type        = string
  sensitive   = true
}

variable "replit_client_id" {
  description = "Replit OAuth Client ID"
  type        = string
  default     = ""
}

variable "replit_client_secret" {
  description = "Replit OAuth Client Secret"
  type        = string
  default     = ""
  sensitive   = true
}
# Terraform configuration for SVATech Consultant Tracker AWS deployment
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "consultant-tracker"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = ""
}

variable "db_password" {
  description = "PostgreSQL database password for local installation"
  type        = string
  sensitive   = true
}

variable "ses_sender_email" {
  description = "Verified SES sender email"
  type        = string
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.app_name}-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.app_name}-igw"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.app_name}-public-${count.index + 1}"
    Environment = var.environment
  }
}

# No private subnets needed since we're not using RDS

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "${var.app_name}-public-rt"
    Environment = var.environment
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Group for EC2
resource "aws_security_group" "ec2" {
  name        = "${var.app_name}-ec2-sg"
  description = "Security group for EC2 instances"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Application"
    from_port   = 5000
    to_port     = 5000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.app_name}-ec2-sg"
    Environment = var.environment
  }
}

# EBS Volume for PostgreSQL data
resource "aws_ebs_volume" "postgres_data" {
  availability_zone = data.aws_availability_zones.available.names[0]
  size              = 50
  type              = "gp3"
  encrypted         = true

  tags = {
    Name = "${var.app_name}-postgres-data"
    Environment = var.environment
  }
}

# IAM Role for EC2
resource "aws_iam_role" "ec2_role" {
  name = "${var.app_name}-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.app_name}-ec2-role"
    Environment = var.environment
  }
}

# IAM Policy for S3 and SES access
resource "aws_iam_policy" "ec2_policy" {
  name        = "${var.app_name}-ec2-policy"
  description = "Policy for EC2 to access S3 and SES"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::tracker-bucket",
          "arn:aws:s3:::tracker-bucket/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "ec2:AttachVolume",
          "ec2:DetachVolume",
          "ec2:DescribeVolumes",
          "ec2:DescribeInstances"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:GetSendQuota",
          "ses:GetSendStatistics"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.app_name}-ec2-policy"
    Environment = var.environment
  }
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

# Instance Profile
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.app_name}-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = {
    Name = "${var.app_name}-ec2-profile"
    Environment = var.environment
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.app_name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.ec2.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "${var.app_name}-alb"
    Environment = var.environment
  }
}

# Target Group
resource "aws_lb_target_group" "app" {
  name     = "${var.app_name}-tg"
  port     = 5000
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = {
    Name = "${var.app_name}-tg"
    Environment = var.environment
  }
}

# Load Balancer Listener
resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }

  tags = {
    Name = "${var.app_name}-listener"
    Environment = var.environment
  }
}

# Launch Template
resource "aws_launch_template" "app" {
  name_prefix   = "${var.app_name}-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.medium"
  
  vpc_security_group_ids = [aws_security_group.ec2.id]
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  user_data = base64encode(templatefile("${path.module}/user-data.sh", {
    db_password      = var.db_password
    aws_region       = var.aws_region
    s3_bucket        = "tracker-bucket"
    ses_sender       = var.ses_sender_email
    ebs_volume_id    = aws_ebs_volume.postgres_data.id
    availability_zone = data.aws_availability_zones.available.names[0]
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.app_name}-instance"
      Environment = var.environment
    }
  }

  tags = {
    Name = "${var.app_name}-launch-template"
    Environment = var.environment
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name                = "${var.app_name}-asg"
  vpc_zone_identifier = aws_subnet.public[*].id
  target_group_arns   = [aws_lb_target_group.app.arn]
  health_check_type   = "ELB"
  health_check_grace_period = 300

  min_size         = 1
  max_size         = 3
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "${var.app_name}-asg"
    propagate_at_launch = false
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# Outputs
output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "ebs_volume_id" {
  description = "EBS volume ID for PostgreSQL data"
  value       = aws_ebs_volume.postgres_data.id
}

output "s3_bucket_name" {
  description = "S3 bucket name"
  value       = "tracker-bucket"
}

output "application_url" {
  description = "Application URL"
  value       = "http://${aws_lb.main.dns_name}"
}
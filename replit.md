# SVATech Systems LLC - Consultant Tracker

## Overview

This is a full-stack web application for recruiting companies to manage consultant tracking, vendor partnerships, and submission workflows. Built for SVATech Systems LLC, it provides comprehensive tools for recruiters and administrators to track consultant submissions, schedule interviews, and monitor performance metrics through an intuitive dashboard interface.

The application handles the complete recruitment lifecycle from consultant registration through final placement, with robust role-based access control and real-time analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**August 11, 2025** - Complete EC2 deployment ready with authentication fixes:
- Created EC2-specific authentication system (server/ec2Auth.ts) to replace Replit dependencies
- Updated routes.ts to use EC2 authentication instead of Replit auth
- Built comprehensive EC2 deployment automation script (ec2-deploy.sh)
- Created production-ready PM2 ecosystem configuration (ecosystem.config.json)
- Added Nginx reverse proxy configuration (nginx.conf) with security headers and caching
- Fixed authentication session handling for proper user context in EC2 environment
- Eliminated all REPLIT_DOMAINS and Replit-specific environment variable requirements
- Created detailed README-EC2.md with complete deployment and troubleshooting guide
- Application now fully ready for EC2 deployment with one-command setup

**August 10, 2025** - AWS deployment ready with SES email integration:
- Migrated email service from SendGrid to AWS SES for better AWS ecosystem integration
- Created comprehensive Terraform infrastructure code for automated AWS deployment
- Built complete deployment infrastructure including VPC, RDS, Auto Scaling, Load Balancer
- Added IAM roles and policies for secure S3 and SES access
- Created user-data script for automated EC2 instance configuration
- Configured environment variables for AWS credentials and region settings
- Updated admin panel to reflect AWS SES configuration status
- Provided detailed deployment instructions for EC2-based setup

**August 10, 2025** - Updated email notification schedule per user requirements:
- Daily Reports: 7:00 PM EST every day
- Weekly Reports: 7:00 PM EST every Friday (changed from Monday)
- Monthly Reports: 7:00 PM EST on the last day of each month (changed from 1st)
- Email reports now include exact user-requested columns: Date, Consultant Name, Position, Client, End Client, Vendor, Status, Submitted By
- Added Client and End Client fields to submission form and database schema

**August 9, 2025** - Implemented automated email reporting system and admin user management:
- Created comprehensive email reporting service for daily, weekly, and monthly submission reports
- Built detailed HTML email templates with submission analytics, recruiter performance metrics, and visual charts
- Added admin panel for complete user management (create, edit, delete recruiter accounts)
- Implemented role-based access control with admin-only functionality in sidebar navigation
- Created email report preview system allowing admins to preview reports before sending
- Added API endpoints for user management and email reporting with proper admin authorization
- Enhanced database schema with user management fields (username, password, role, temporary password tracking)

**August 6, 2025** - Enhanced submission tracking with timestamp functionality and comprehensive interview management:
- Redesigned submissions list from table to card-based layout for better readability
- Added expandable rows to display notes and vendor feedback with visual icons
- Implemented forced cache refresh to ensure immediate display of updated data
- Added timestamp tracking for notes and vendor feedback updates
- Database stores exact timestamps when notes or vendor feedback are modified
- Display shows complete date and time (e.g., "Aug 6, 2025 9:47 PM") for each update
- Timestamps only update when content actually changes, preserving edit history
- Users can now track when each piece of feedback was last modified
- Fixed submission card layout alignment issues with optimized CSS Grid (3-3-2-1-3 column layout)
- Resolved action button cutoff problems by reducing button heights and improving spacing
- Enhanced responsive design with compact buttons and proper text wrapping prevention

**Interview Management Enhancements**:
- Added comprehensive interview editing modal with full CRUD capabilities
- Interview status management (scheduled, completed, cancelled, rescheduled)
- Interview outcome tracking (hired, rejected, pass, fail, pending)
- Rating system (1-5 stars) for interview performance evaluation
- Feedback collection and next steps planning with follow-up date scheduling
- Automatic submission status updates when interviews result in hiring or rejection
- Enhanced interview cards display status, outcome, and rating badges
- Direct navigation from interviews to related consultant submissions
- URL parameter support for filtered submission views when navigating from interviews

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, professional UI
- **State Management**: React Context API with TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds
- **Form Handling**: React Hook Form with Zod validation for robust form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect for secure user management
- **Session Management**: Express sessions with PostgreSQL session store
- **File Handling**: Multer with Google Cloud Storage integration for resume/document uploads
- **API Design**: RESTful endpoints with comprehensive error handling and request logging

### Database Design
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle migrations for version-controlled database changes
- **Key Entities**:
  - Users with role-based access (admin/recruiter)
  - Consultants with skills, experience, and status tracking
  - Vendors with partnership metrics
  - Submissions linking consultants to vendor opportunities
  - Interviews with scheduling and feedback tracking
  - Sessions for authentication state persistence

### Security & Authentication
- **Authentication Provider**: Replit Auth with JWT tokens
- **Session Security**: HTTP-only cookies with secure flags
- **Role-Based Access**: Admin and recruiter roles with different permissions
  - Admins: Full access including consultant create/edit/delete operations, user management, email reporting
  - Recruiters: Can edit consultants but cannot create or delete them, no admin panel access
- **File Upload Security**: Type validation and size limits for document uploads
- **CORS**: Configured for secure cross-origin requests

### File Storage & Media
- **Cloud Storage**: Google Cloud Storage for resume and document management
- **Upload Processing**: Multer middleware with file type validation
- **Supported Formats**: PDF, DOC, DOCX files up to 5MB

### Dashboard & Analytics
- **Real-time Metrics**: Weekly activity tracking with visual charts
- **Performance Analytics**: Consultant success rates and submission tracking
- **Interactive Filters**: Time-based filtering (weekly/monthly/yearly)
- **Quick Actions**: Direct navigation to filtered views from dashboard stats

## External Dependencies

### Database Services
- **PostgreSQL**: Production database installed on EC2 with EBS storage
- **Neon Database**: Development/staging serverless PostgreSQL hosting
- **Database URL**: Environment variable for secure connection management
- **EBS Volumes**: Encrypted storage for database persistence and backups

### AWS Services
- **EC2**: Application hosting with Auto Scaling Groups
- **EBS**: Encrypted volumes for PostgreSQL data persistence
- **PostgreSQL**: Database installed directly on EC2 instances
- **S3**: File storage for resumes and documents (bucket: tracker-bucket)
- **SES**: Email delivery service for automated reports
- **ALB**: Application Load Balancer for high availability
- **IAM**: Role-based access control for AWS services

### Authentication Services
- **Replit Auth**: OpenID Connect provider for user authentication
- **Session Store**: PostgreSQL-backed session persistence

### Cloud Storage
- **Google Cloud Storage**: Document and resume file storage
- **Configuration**: Service account credentials for secure access

### Email Services
- **AWS SES**: Automated email reporting system for submission analytics
- **Report Types**: Daily, weekly, and monthly submission reports with detailed metrics
- **Template System**: Professional HTML email templates with charts and analytics
- **Integration**: Native AWS SDK integration for seamless cloud deployment

### UI Component Libraries
- **Radix UI**: Accessible component primitives for complex UI elements
- **Lucide React**: Consistent icon library for visual elements
- **date-fns**: Date manipulation and formatting utilities

### Development Tools
- **TypeScript**: Static type checking across frontend and backend
- **ESBuild**: Fast bundling for production server builds
- **Drizzle Kit**: Database migration and schema management tools
- **Vite Plugins**: Development enhancements including error overlays and cartographer integration

### Form & Validation
- **React Hook Form**: Performant form state management
- **Zod**: Runtime type validation and schema definition
- **Hookform Resolvers**: Integration between form library and validation schemas
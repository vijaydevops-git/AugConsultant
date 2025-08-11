import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { DatabaseStorage } from './storage';

// Initialize AWS SES (will be configured when AWS credentials are available)
let sesClient: SESClient | null = null;

if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION) {
  sesClient = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

export interface EmailReportConfig {
  recipientEmails: string[];
  senderEmail: string;
  reportType: 'daily' | 'weekly' | 'monthly';
}

export interface SubmissionReportData {
  submissionDate: Date;
  consultantName: string;
  positionTitle: string;
  clientName: string;
  endClientName: string;
  vendorName: string;
  status: string;
  submittedBy: string;
}

export class EmailReportService {
  private storage: DatabaseStorage;

  constructor(storage: DatabaseStorage) {
    this.storage = storage;
  }

  // Get submission data for reporting
  async getSubmissionsForPeriod(reportType: 'daily' | 'weekly' | 'monthly'): Promise<SubmissionReportData[]> {
    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date;

    switch (reportType) {
      case 'daily':
        dateFrom = startOfDay(subDays(now, 1)); // Yesterday
        dateTo = endOfDay(subDays(now, 1));
        break;
      case 'weekly':
        dateFrom = startOfWeek(subDays(now, 7)); // Last week
        dateTo = endOfWeek(subDays(now, 7));
        break;
      case 'monthly':
        dateFrom = startOfMonth(subDays(now, 30)); // Last month
        dateTo = endOfMonth(subDays(now, 30));
        break;
    }

    const submissions = await this.storage.getSubmissions({
      dateFrom,
      dateTo
    });

    return submissions.map(submission => ({
      submissionDate: submission.submissionDate,
      consultantName: `${submission.consultant.firstName} ${submission.consultant.lastName}`,
      positionTitle: submission.positionTitle,
      clientName: submission.clientName || 'N/A',
      endClientName: submission.endClientName || 'N/A',
      vendorName: submission.vendor.name,
      status: submission.status,
      submittedBy: `${submission.recruiter.firstName} ${submission.recruiter.lastName}`
    }));
  }

  // Generate HTML email content
  generateEmailHtml(data: SubmissionReportData[], reportType: 'daily' | 'weekly' | 'monthly'): string {
    const reportTitle = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Submission Report`;
    const reportDate = format(new Date(), 'MMMM dd, yyyy');

    const submissionRows = data.map(submission => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">${format(submission.submissionDate, 'MMM dd, yyyy')}</td>
        <td style="padding: 12px; text-align: left;">${submission.consultantName}</td>
        <td style="padding: 12px; text-align: left;">${submission.positionTitle}</td>
        <td style="padding: 12px; text-align: left;">${submission.clientName}</td>
        <td style="padding: 12px; text-align: left;">${submission.endClientName}</td>
        <td style="padding: 12px; text-align: left;">${submission.vendorName}</td>
        <td style="padding: 12px; text-align: left;">
          <span style="background-color: ${this.getStatusColor(submission.status)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
            ${submission.status.replace('_', ' ').toUpperCase()}
          </span>
        </td>
        <td style="padding: 12px; text-align: left;">${submission.submittedBy}</td>
      </tr>
    `).join('');

    const summaryByRecruiter = this.generateRecruiterSummary(data);

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${reportTitle}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 300;">${reportTitle}</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Generated on ${reportDate}</p>
      </div>

      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <h2 style="color: #1e293b; margin-top: 0;">Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #3b82f6;">${data.length}</div>
            <div style="color: #64748b; font-size: 14px;">Total Submissions</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">${new Set(data.map(d => d.consultantName)).size}</div>
            <div style="color: #64748b; font-size: 14px;">Unique Consultants</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${new Set(data.map(d => d.vendorName)).size}</div>
            <div style="color: #64748b; font-size: 14px;">Vendors Engaged</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${new Set(data.map(d => d.submittedBy)).size}</div>
            <div style="color: #64748b; font-size: 14px;">Active Recruiters</div>
          </div>
        </div>
      </div>

      ${summaryByRecruiter}

      <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <h2 style="color: #1e293b; margin: 0; padding: 20px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;">Detailed Submissions</h2>
        
        ${data.length > 0 ? `
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8fafc; color: #475569;">
                <th style="padding: 15px; text-align: left; font-weight: 600;">Date</th>
                <th style="padding: 15px; text-align: left; font-weight: 600;">Consultant Name</th>
                <th style="padding: 15px; text-align: left; font-weight: 600;">Position</th>
                <th style="padding: 15px; text-align: left; font-weight: 600;">Client</th>
                <th style="padding: 15px; text-align: left; font-weight: 600;">End Client</th>
                <th style="padding: 15px; text-align: left; font-weight: 600;">Vendor</th>
                <th style="padding: 15px; text-align: left; font-weight: 600;">Status</th>
                <th style="padding: 15px; text-align: left; font-weight: 600;">Submitted By</th>
              </tr>
            </thead>
            <tbody>
              ${submissionRows}
            </tbody>
          </table>
        </div>
        ` : `
        <div style="padding: 40px; text-align: center; color: #64748b;">
          <p style="font-size: 16px;">No submissions found for this ${reportType} period.</p>
        </div>
        `}
      </div>

      <div style="margin-top: 30px; padding: 20px; background: #f1f5f9; border-radius: 8px; text-align: center; color: #64748b; font-size: 14px;">
        <p>This report was automatically generated by SVATech Systems LLC Consultant Tracker.</p>
        <p>For questions or support, please contact your system administrator.</p>
      </div>
    </body>
    </html>
    `;
  }

  // Generate recruiter summary section
  private generateRecruiterSummary(data: SubmissionReportData[]): string {
    const recruiterStats = data.reduce((acc, submission) => {
      const key = submission.submittedBy;
      if (!acc[key]) {
        acc[key] = {
          name: submission.submittedBy,
          count: 0,
          consultants: new Set(),
          vendors: new Set()
        };
      }
      acc[key].count++;
      acc[key].consultants.add(submission.consultantName);
      acc[key].vendors.add(submission.vendorName);
      return acc;
    }, {} as Record<string, any>);

    const recruiterRows = Object.values(recruiterStats).map((stats: any) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">
          <div style="font-weight: 600;">${stats.name}</div>
        </td>
        <td style="padding: 12px; text-align: center; font-weight: 600; color: #3b82f6;">${stats.count}</td>
        <td style="padding: 12px; text-align: center;">${stats.consultants.size}</td>
        <td style="padding: 12px; text-align: center;">${stats.vendors.size}</td>
      </tr>
    `).join('');

    return `
    <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 30px;">
      <h2 style="color: #1e293b; margin: 0; padding: 20px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0;">Recruiter Performance</h2>
      
      ${Object.keys(recruiterStats).length > 0 ? `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f8fafc; color: #475569;">
              <th style="padding: 15px; text-align: left; font-weight: 600;">Recruiter</th>
              <th style="padding: 15px; text-align: center; font-weight: 600;">Submissions</th>
              <th style="padding: 15px; text-align: center; font-weight: 600;">Consultants</th>
              <th style="padding: 15px; text-align: center; font-weight: 600;">Vendors</th>
            </tr>
          </thead>
          <tbody>
            ${recruiterRows}
          </tbody>
        </table>
      </div>
      ` : `
      <div style="padding: 40px; text-align: center; color: #64748b;">
        <p>No recruiter activity found for this period.</p>
      </div>
      `}
    </div>
    `;
  }

  // Get status color for badges
  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'submitted': '#3b82f6',
      'under_review': '#f59e0b',
      'interview_scheduled': '#8b5cf6',
      'hired': '#10b981',
      'rejected': '#ef4444'
    };
    return colors[status] || '#6b7280';
  }

  // Send email report
  async sendReport(config: EmailReportConfig): Promise<boolean> {
    if (!sesClient) {
      console.log('AWS SES not configured - email report generated but not sent');
      return false;
    }

    try {
      const data = await this.getSubmissionsForPeriod(config.reportType);
      const htmlContent = this.generateEmailHtml(data, config.reportType);
      const reportTitle = `${config.reportType.charAt(0).toUpperCase() + config.reportType.slice(1)} Submission Report`;

      const command = new SendEmailCommand({
        Source: config.senderEmail,
        Destination: {
          ToAddresses: config.recipientEmails,
        },
        Message: {
          Subject: {
            Data: `${reportTitle} - ${format(new Date(), 'MMMM dd, yyyy')}`,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlContent,
              Charset: 'UTF-8',
            },
          },
        },
      });

      await sesClient.send(command);
      console.log(`${config.reportType} report sent successfully to ${config.recipientEmails.join(', ')}`);
      return true;
    } catch (error) {
      console.error(`Failed to send ${config.reportType} report:`, error);
      return false;
    }
  }

  // Generate report without sending (for testing/preview)
  async generateReportPreview(reportType: 'daily' | 'weekly' | 'monthly'): Promise<string> {
    const data = await this.getSubmissionsForPeriod(reportType);
    return this.generateEmailHtml(data, reportType);
  }
}
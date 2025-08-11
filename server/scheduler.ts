import cron from 'node-cron';
import { EmailReportService } from './emailService';
import { DatabaseStorage } from './storage';

export class ReportScheduler {
  private emailReportService: EmailReportService;
  private isProduction: boolean;

  constructor(storage: DatabaseStorage) {
    this.emailReportService = new EmailReportService(storage);
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  startSchedulers() {
    if (!this.isProduction) {
      console.log('Scheduler disabled in non-production environment');
      return;
    }

    // Daily reports - 7:00 PM every day
    cron.schedule('0 19 * * *', async () => {
      console.log('Running daily email report...');
      await this.sendScheduledReport('daily');
    }, {
      timezone: 'America/New_York'
    });

    // Weekly reports - 7:00 PM every Friday
    cron.schedule('0 19 * * 5', async () => {
      console.log('Running weekly email report...');
      await this.sendScheduledReport('weekly');
    }, {
      timezone: 'America/New_York'
    });

    // Monthly reports - 7:00 PM on the last day of each month (28-31)
    cron.schedule('0 19 28-31 * *', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      
      // Check if tomorrow is the first day of next month (meaning today is last day)
      if (tomorrow.getDate() === 1) {
        console.log('Running monthly email report...');
        await this.sendScheduledReport('monthly');
      }
    }, {
      timezone: 'America/New_York'
    });

    console.log('Report schedulers started successfully');
  }

  private async sendScheduledReport(reportType: 'daily' | 'weekly' | 'monthly') {
    try {
      const senderEmail = process.env.SES_SENDER_EMAIL;
      const recipientEmails = process.env.REPORT_RECIPIENT_EMAILS?.split(',') || [];

      if (!senderEmail) {
        console.error('SES_SENDER_EMAIL not configured');
        return;
      }

      if (recipientEmails.length === 0) {
        console.error('REPORT_RECIPIENT_EMAILS not configured');
        return;
      }

      const success = await this.emailReportService.sendReport({
        reportType,
        recipientEmails: recipientEmails.map(email => email.trim()),
        senderEmail
      });

      if (success) {
        console.log(`${reportType} report sent successfully to ${recipientEmails.join(', ')}`);
      } else {
        console.error(`Failed to send ${reportType} report`);
      }
    } catch (error) {
      console.error(`Error sending scheduled ${reportType} report:`, error);
    }
  }

  // Method to manually trigger reports (for testing)
  async triggerReport(reportType: 'daily' | 'weekly' | 'monthly') {
    console.log(`Manually triggering ${reportType} report...`);
    await this.sendScheduledReport(reportType);
  }
}
import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertConsultantSchema, insertVendorSchema, insertSubmissionSchema, insertInterviewSchema, insertUserSchema } from "@shared/schema";
import { EmailReportService } from "./emailService";
import multer from "multer";
import path from "path";

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Test login routes (for development only)
  app.post('/api/test-login', async (req, res) => {
    const { userType } = req.body;
    
    let userId: string;
    if (userType === 'admin') {
      userId = 'admin-test-123';
    } else if (userType === 'recruiter') {
      userId = 'recruiter-test-456';
    } else {
      return res.status(400).json({ message: 'Invalid user type' });
    }
    
    try {
      const user = await storage.getUser(userId);
      
      // Set session manually for testing
      (req as any).session.userId = userId;
      
      // Save the session
      (req as any).session.save((err: any) => {
        if (err) {
          console.error('Session save error:', err);
          return res.status(500).json({ message: 'Failed to save session' });
        }
        console.log(`Test login successful: ${userId}, session ID: ${(req as any).session.id}`);
        res.json({ message: 'Test login successful', user });
      });
    } catch (error) {
      console.error("Test login error:", error);
      res.status(500).json({ message: "Test login failed" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { timeframe, week, month, year } = req.query;
      
      let dateFrom: Date | undefined;
      let dateTo: Date | undefined;
      
      if (timeframe === 'weekly' && week && month && year) {
        const weekNum = parseInt(week as string);
        const monthNum = parseInt(month as string);
        const yearNum = parseInt(year as string);
        
        const firstDayOfMonth = new Date(yearNum, monthNum - 1, 1);
        const firstDayOfWeek = new Date(firstDayOfMonth);
        firstDayOfWeek.setDate(firstDayOfWeek.getDate() + (weekNum - 1) * 7);
        
        dateFrom = firstDayOfWeek;
        dateTo = new Date(firstDayOfWeek);
        dateTo.setDate(dateTo.getDate() + 6);
      } else if (timeframe === 'monthly' && month && year) {
        const monthNum = parseInt(month as string);
        const yearNum = parseInt(year as string);
        
        dateFrom = new Date(yearNum, monthNum - 1, 1);
        dateTo = new Date(yearNum, monthNum, 0);
      } else if (timeframe === 'yearly' && year) {
        const yearNum = parseInt(year as string);
        
        dateFrom = new Date(yearNum, 0, 1);
        dateTo = new Date(yearNum, 11, 31);
      } else {
        // Default to current week
        const now = new Date();
        const dayOfWeek = now.getDay();
        dateFrom = new Date(now);
        dateFrom.setDate(now.getDate() - dayOfWeek);
        dateTo = new Date(now);
        dateTo.setDate(now.getDate() + (6 - dayOfWeek));
      }
      
      const stats = await storage.getDashboardStats({
        userId: user?.role === 'recruiter' ? userId : undefined,
        userRole: user?.role,
        dateFrom,
        dateTo,
      });
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/activity', isAuthenticated, async (req: any, res) => {
    try {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      const endOfWeek = new Date(now);
      endOfWeek.setDate(now.getDate() + (6 - dayOfWeek));
      
      const activity = await storage.getWeeklyActivity(startOfWeek, endOfWeek);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching weekly activity:", error);
      res.status(500).json({ message: "Failed to fetch weekly activity" });
    }
  });

  // Advanced Analytics Routes
  app.get('/api/analytics/consultants', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { timeframe, consultantId, dateFrom, dateTo } = req.query;
      
      const analytics = await storage.getConsultantAnalytics({
        userId: user?.role === 'recruiter' ? userId : undefined,
        userRole: user?.role,
        consultantId: consultantId as string,
        timeframe: timeframe as 'daily' | 'weekly' | 'monthly',
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      });
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching consultant analytics:", error);
      res.status(500).json({ message: "Failed to fetch consultant analytics" });
    }
  });

  app.get('/api/analytics/recruiters', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { timeframe, dateFrom, dateTo } = req.query;
      
      const analytics = await storage.getRecruiterPerformance({
        userId: user?.role === 'recruiter' ? userId : undefined,
        userRole: user?.role,
        timeframe: timeframe as 'daily' | 'weekly' | 'monthly',
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      });
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching recruiter analytics:", error);
      res.status(500).json({ message: "Failed to fetch recruiter analytics" });
    }
  });

  app.get('/api/analytics/submissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { timeframe, dateFrom, dateTo } = req.query;
      
      const analytics = await storage.getSubmissionAnalytics({
        userId: user?.role === 'recruiter' ? userId : undefined,
        userRole: user?.role,
        timeframe: timeframe as 'daily' | 'weekly' | 'monthly',
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      });
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching submission analytics:", error);
      res.status(500).json({ message: "Failed to fetch submission analytics" });
    }
  });

  app.get('/api/dashboard/recent-submissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const submissions = await storage.getSubmissions({
        userId: user?.role === 'recruiter' ? userId : undefined,
        userRole: user?.role,
      });
      
      res.json(submissions.slice(0, 4));
    } catch (error) {
      console.error("Error fetching recent submissions:", error);
      res.status(500).json({ message: "Failed to fetch recent submissions" });
    }
  });

  app.get('/api/dashboard/follow-up-reminders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { overdue } = req.query;
      
      const reminders = await storage.getFollowUpReminders({
        userId: user?.role === 'recruiter' ? userId : undefined,
        userRole: user?.role,
        overdue: overdue === 'true',
      });
      
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching follow-up reminders:", error);
      res.status(500).json({ message: "Failed to fetch follow-up reminders" });
    }
  });

  app.get('/api/dashboard/upcoming-interviews', isAuthenticated, async (req: any, res) => {
    try {
      const now = new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      
      const interviews = await storage.getInterviews({
        upcoming: true,
        dateFrom: now,
        dateTo: nextWeek,
      });
      
      res.json(interviews.slice(0, 5));
    } catch (error) {
      console.error("Error fetching upcoming interviews:", error);
      res.status(500).json({ message: "Failed to fetch upcoming interviews" });
    }
  });

  // Consultant routes
  app.get('/api/consultants', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { search, status } = req.query;
      const consultants = await storage.getConsultants({
        search: search as string,
        status: status as string,
        userId: user?.role === 'recruiter' ? userId : undefined,
        userRole: user?.role,
      });
      res.json(consultants);
    } catch (error) {
      console.error("Error fetching consultants:", error);
      res.status(500).json({ message: "Failed to fetch consultants" });
    }
  });

  app.get('/api/consultants/:id', isAuthenticated, async (req: any, res) => {
    try {
      const consultant = await storage.getConsultant(req.params.id);
      if (!consultant) {
        return res.status(404).json({ message: "Consultant not found" });
      }
      res.json(consultant);
    } catch (error) {
      console.error("Error fetching consultant:", error);
      res.status(500).json({ message: "Failed to fetch consultant" });
    }
  });

  app.post('/api/consultants', isAuthenticated, upload.single('resume'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create consultants" });
      }
      
      const consultantData = {
        ...req.body,
        skills: Array.isArray(req.body.skills) ? req.body.skills : JSON.parse(req.body.skills || '[]'),
        resumeUrl: req.file ? `/uploads/${req.file.filename}` : undefined,
        resumeFileName: req.file ? req.file.originalname : undefined,
        createdBy: userId,
      };
      
      const result = insertConsultantSchema.safeParse(consultantData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid consultant data", errors: result.error.errors });
      }
      
      const consultant = await storage.createConsultant(result.data);
      res.status(201).json(consultant);
    } catch (error) {
      console.error("Error creating consultant:", error);
      res.status(500).json({ message: "Failed to create consultant" });
    }
  });

  app.put('/api/consultants/:id', isAuthenticated, upload.single('resume'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || (user.role !== 'admin' && user.role !== 'recruiter')) {
        return res.status(403).json({ message: "Only admins and recruiters can edit consultants" });
      }
      
      const updateData: any = { ...req.body };
      
      if (req.body.skills) {
        updateData.skills = Array.isArray(req.body.skills) ? req.body.skills : JSON.parse(req.body.skills);
      }
      
      if (req.file) {
        updateData.resumeUrl = `/uploads/${req.file.filename}`;
        updateData.resumeFileName = req.file.originalname;
      }
      
      const consultant = await storage.updateConsultant(req.params.id, updateData);
      res.json(consultant);
    } catch (error) {
      console.error("Error updating consultant:", error);
      res.status(500).json({ message: "Failed to update consultant" });
    }
  });

  app.delete('/api/consultants/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can delete consultants" });
      }
      
      await storage.deleteConsultant(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting consultant:", error);
      res.status(500).json({ message: "Failed to delete consultant" });
    }
  });

  // Vendor routes
  app.get('/api/vendors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { search, status } = req.query;
      const vendors = await storage.getVendors({
        search: search as string,
        status: status as string,
        userId: user?.role === 'recruiter' ? userId : undefined,
        userRole: user?.role,
      });
      res.json(vendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });

  app.get('/api/vendors/:id', isAuthenticated, async (req: any, res) => {
    try {
      const vendor = await storage.getVendor(req.params.id);
      if (!vendor) {
        return res.status(404).json({ message: "Vendor not found" });
      }
      res.json(vendor);
    } catch (error) {
      console.error("Error fetching vendor:", error);
      res.status(500).json({ message: "Failed to fetch vendor" });
    }
  });

  app.post('/api/vendors', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const vendorData = {
        ...req.body,
        specialties: Array.isArray(req.body.specialties) ? req.body.specialties : JSON.parse(req.body.specialties || '[]'),
        recruiterId: req.body.recruiterId || userId, // Allow admin to assign to any recruiter, recruiter assigns to self
        createdBy: userId,
      };
      
      const result = insertVendorSchema.safeParse(vendorData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid vendor data", errors: result.error.errors });
      }
      
      const vendor = await storage.createVendor(result.data);
      res.status(201).json(vendor);
    } catch (error) {
      console.error("Error creating vendor:", error);
      res.status(500).json({ message: "Failed to create vendor" });
    }
  });

  app.put('/api/vendors/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updateData = {
        ...req.body,
        specialties: Array.isArray(req.body.specialties) ? req.body.specialties : JSON.parse(req.body.specialties || '[]'),
      };
      
      const vendor = await storage.updateVendor(req.params.id, updateData);
      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });

  app.delete('/api/vendors/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteVendor(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      res.status(500).json({ message: "Failed to delete vendor" });
    }
  });

  // Submission routes
  app.get('/api/submissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { status, timeframe, week, month, year } = req.query;
      
      let dateFrom: Date | undefined;
      let dateTo: Date | undefined;
      
      if (timeframe === 'weekly' && week && month && year) {
        const weekNum = parseInt(week as string);
        const monthNum = parseInt(month as string);
        const yearNum = parseInt(year as string);
        
        const firstDayOfMonth = new Date(yearNum, monthNum - 1, 1);
        const firstDayOfWeek = new Date(firstDayOfMonth);
        firstDayOfWeek.setDate(firstDayOfWeek.getDate() + (weekNum - 1) * 7);
        
        dateFrom = firstDayOfWeek;
        dateTo = new Date(firstDayOfWeek);
        dateTo.setDate(dateTo.getDate() + 6);
      } else if (timeframe === 'monthly' && month && year) {
        const monthNum = parseInt(month as string);
        const yearNum = parseInt(year as string);
        
        dateFrom = new Date(yearNum, monthNum - 1, 1);
        dateTo = new Date(yearNum, monthNum, 0);
      } else if (timeframe === 'yearly' && year) {
        const yearNum = parseInt(year as string);
        
        dateFrom = new Date(yearNum, 0, 1);
        dateTo = new Date(yearNum, 11, 31);
      }
      
      const submissions = await storage.getSubmissions({
        status: status as string,
        userId: user?.role === 'recruiter' ? userId : undefined,
        userRole: user?.role,
        dateFrom,
        dateTo,
      });
      
      res.json(submissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.get('/api/submissions/:id', isAuthenticated, async (req: any, res) => {
    try {
      const submission = await storage.getSubmission(req.params.id);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      res.json(submission);
    } catch (error) {
      console.error("Error fetching submission:", error);
      res.status(500).json({ message: "Failed to fetch submission" });
    }
  });

  app.post('/api/submissions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const now = new Date();
      const submissionData = {
        ...req.body,
        submissionDate: new Date(req.body.submissionDate),
        lastVendorContact: req.body.lastVendorContact ? new Date(req.body.lastVendorContact) : null,
        nextFollowUpDate: req.body.nextFollowUpDate ? new Date(req.body.nextFollowUpDate) : null,
        // Set timestamps if notes or vendor feedback are provided during creation
        notesUpdatedAt: req.body.notes ? now : null,
        vendorFeedbackUpdatedAt: req.body.vendorFeedback ? now : null,
        createdBy: userId,
      };
      
      const result = insertSubmissionSchema.safeParse(submissionData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid submission data", errors: result.error.errors });
      }
      
      const submission = await storage.createSubmission(result.data);
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error creating submission:", error);
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.put('/api/submissions/:id', isAuthenticated, async (req: any, res) => {
    try {
      // Get the current submission to compare fields
      const currentSubmission = await storage.getSubmissionById(req.params.id);
      if (!currentSubmission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      const now = new Date();
      
      // Check if this is a status-only update
      const isStatusUpdate = Object.keys(req.body).length === 1 && req.body.status;
      
      let submissionData;
      
      if (isStatusUpdate) {
        // For status-only updates, just update the status
        submissionData = {
          status: req.body.status
        };
      } else {
        // For full updates, process all fields
        submissionData = {
          ...req.body,
          submissionDate: new Date(req.body.submissionDate),
          lastVendorContact: req.body.lastVendorContact ? new Date(req.body.lastVendorContact) : null,
          nextFollowUpDate: req.body.nextFollowUpDate ? new Date(req.body.nextFollowUpDate) : null,
          // Update timestamps only if the content changed
          notesUpdatedAt: req.body.notes !== currentSubmission.notes ? now : currentSubmission.notesUpdatedAt,
          vendorFeedbackUpdatedAt: req.body.vendorFeedback !== currentSubmission.vendorFeedback ? now : currentSubmission.vendorFeedbackUpdatedAt,
        };
        
        // For full updates, validate against the schema
        const updateSchema = insertSubmissionSchema.omit({ createdBy: true });
        const result = updateSchema.safeParse(submissionData);
        if (!result.success) {
          console.error('Validation error:', result.error.errors);
          return res.status(400).json({ message: "Invalid submission data", errors: result.error.errors });
        }
        submissionData = result.data;
      }
      
      const submission = await storage.updateSubmission(req.params.id, submissionData);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      res.json(submission);
    } catch (error) {
      console.error("Error updating submission:", error);
      res.status(500).json({ message: "Failed to update submission" });
    }
  });

  app.delete('/api/submissions/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteSubmission(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting submission:", error);
      res.status(500).json({ message: "Failed to delete submission" });
    }
  });

  // Interview routes
  app.get('/api/interviews', isAuthenticated, async (req: any, res) => {
    try {
      const { upcoming, dateFrom, dateTo, submissionId } = req.query;
      
      // If requesting interviews for a specific submission
      if (submissionId) {
        const interviews = await storage.getInterviewsForSubmission(submissionId as string);
        res.json(interviews);
        return;
      }
      
      // Otherwise get all interviews with filters
      const interviews = await storage.getInterviews({
        upcoming: upcoming === 'true',
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      });
      res.json(interviews);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      res.status(500).json({ message: "Failed to fetch interviews" });
    }
  });

  app.post('/api/interviews', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const interviewData = {
        ...req.body,
        interviewDate: new Date(req.body.interviewDate),
        createdBy: userId,
      };
      
      const result = insertInterviewSchema.safeParse(interviewData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid interview data", errors: result.error.errors });
      }
      
      const interview = await storage.createInterview(result.data);
      
      // Update submission status to interview_scheduled
      await storage.updateSubmission(result.data.submissionId, {
        status: 'interview_scheduled',
      });
      
      res.status(201).json(interview);
    } catch (error) {
      console.error("Error creating interview:", error);
      res.status(500).json({ message: "Failed to create interview" });
    }
  });

  // Update interview with feedback and follow-up
  app.put('/api/interviews/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateData: any = { ...req.body };
      
      // Convert date strings to Date objects
      if (updateData.followUpDate) {
        updateData.followUpDate = new Date(updateData.followUpDate);
      }
      
      const interview = await storage.updateInterview(id, updateData);
      if (!interview) {
        return res.status(404).json({ message: "Interview not found" });
      }
      
      res.json(interview);
    } catch (error) {
      console.error("Error updating interview:", error);
      res.status(500).json({ message: "Failed to update interview" });
    }
  });

  app.put('/api/interviews/:id', isAuthenticated, async (req: any, res) => {
    try {
      const updateData = { ...req.body };
      if (updateData.interviewDate) {
        updateData.interviewDate = new Date(updateData.interviewDate);
      }
      
      const interview = await storage.updateInterview(req.params.id, updateData);
      res.json(interview);
    } catch (error) {
      console.error("Error updating interview:", error);
      res.status(500).json({ message: "Failed to update interview" });
    }
  });

  app.delete('/api/interviews/:id', isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteInterview(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting interview:", error);
      res.status(500).json({ message: "Failed to delete interview" });
    }
  });

  // CSV Export route
  app.get('/api/submissions/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const submissions = await storage.getSubmissions({
        userId: user?.role === 'recruiter' ? userId : undefined,
        userRole: user?.role,
      });
      
      const csvHeaders = [
        'Consultant Name',
        'Vendor',
        'Position',
        'Status',
        'Submission Date',
        'Notes'
      ];
      
      const csvRows = submissions.map(sub => [
        `"${sub.consultant.firstName} ${sub.consultant.lastName}"`,
        `"${sub.vendor.name}"`,
        `"${sub.positionTitle}"`,
        `"${sub.status}"`,
        sub.submissionDate.toISOString().split('T')[0],
        `"${sub.notes || ''}"`
      ]);
      
      const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting submissions:", error);
      res.status(500).json({ message: "Failed to export submissions" });
    }
  });

  // Vendor Analytics Routes
  app.get('/api/analytics/vendors', isAuthenticated, async (req: any, res) => {
    try {
      const { timeframe = 'monthly', skill = 'all' } = req.query;
      const userId = req.user.claims.sub;
      
      const vendorAnalytics = await storage.getVendorAnalytics(userId, timeframe as string, skill as string);
      res.json(vendorAnalytics);
    } catch (error) {
      console.error("Error fetching vendor analytics:", error);
      res.status(500).json({ message: "Failed to fetch vendor analytics" });
    }
  });

  app.get('/api/analytics/vendor-skills', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const vendorSkillMetrics = await storage.getVendorSkillMetrics(userId);
      res.json({ vendorSkills: vendorSkillMetrics });
    } catch (error) {
      console.error("Error fetching vendor-skill metrics:", error);
      res.status(500).json({ message: "Failed to fetch vendor-skill metrics" });
    }
  });

  // Consultant Notification Routes
  app.get('/api/notifications/consultant-activity', isAuthenticated, async (req: any, res) => {
    try {
      const { timeframe = 'weekly' } = req.query;
      const userId = req.user.claims.sub;
      
      const activityData = await storage.getConsultantActivityNotifications(userId, timeframe as string);
      res.json(activityData);
    } catch (error) {
      console.error("Error fetching consultant activity notifications:", error);
      res.status(500).json({ message: "Failed to fetch consultant activity notifications" });
    }
  });

  app.get('/api/analytics/consultant-summary', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      const consultantSummary = await storage.getConsultantSummaryStats(userId);
      res.json(consultantSummary);
    } catch (error) {
      console.error("Error fetching consultant summary:", error);
      res.status(500).json({ message: "Failed to fetch consultant summary" });
    }
  });

  // Initialize email report service
  const emailReportService = new EmailReportService(storage);

  // Email Report Routes
  app.post('/api/reports/send', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can send reports" });
      }
      
      const { reportType, recipientEmails, senderEmail } = req.body;
      
      if (!reportType || !recipientEmails || !senderEmail) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const success = await emailReportService.sendReport({
        reportType,
        recipientEmails: Array.isArray(recipientEmails) ? recipientEmails : [recipientEmails],
        senderEmail
      });
      
      res.json({ success, message: success ? 'Report sent successfully' : 'Failed to send report' });
    } catch (error) {
      console.error("Error sending report:", error);
      res.status(500).json({ message: "Failed to send report" });
    }
  });

  app.get('/api/reports/preview/:type', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can preview reports" });
      }
      
      const reportType = req.params.type as 'daily' | 'weekly' | 'monthly';
      const htmlContent = await emailReportService.generateReportPreview(reportType);
      
      res.setHeader('Content-Type', 'text/html');
      res.send(htmlContent);
    } catch (error) {
      console.error("Error generating report preview:", error);
      res.status(500).json({ message: "Failed to generate report preview" });
    }
  });

  // Admin User Management Routes
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can view users" });
      }
      
      // Get all users from database (we'll need to add this method to storage)
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can create users" });
      }
      
      const userData = {
        ...req.body,
        isPasswordTemporary: true,
        passwordExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      };
      
      const result = insertUserSchema.safeParse(userData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid user data", errors: result.error.errors });
      }
      
      const newUser = await storage.upsertUser(result.data);
      res.status(201).json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can update users" });
      }
      
      const updateData = req.body;
      const updatedUser = await storage.updateUser(req.params.id, updateData);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Only admins can delete users" });
      }
      
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // File serving
  app.use('/uploads', express.static('uploads'));

  const httpServer = createServer(app);
  return httpServer;
}

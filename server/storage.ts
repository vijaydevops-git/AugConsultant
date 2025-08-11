import {
  users,
  consultants,
  vendors,
  submissions,
  interviews,
  type User,
  type UpsertUser,
  type InsertConsultant,
  type Consultant,
  type InsertVendor,
  type Vendor,
  type InsertSubmission,
  type Submission,
  type InsertInterview,
  type Interview,
  type SubmissionWithRelations,
  type ConsultantWithSubmissions,
  type VendorWithSubmissions,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc, and, gte, lte, like, or, count, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Consultant operations
  getConsultants(filters?: { search?: string; status?: string; userId?: string; userRole?: string }): Promise<Consultant[]>;
  getConsultant(id: string): Promise<ConsultantWithSubmissions | undefined>;
  createConsultant(consultant: InsertConsultant): Promise<Consultant>;
  updateConsultant(id: string, consultant: Partial<InsertConsultant>): Promise<Consultant>;
  deleteConsultant(id: string): Promise<void>;
  
  // Vendor operations
  getVendors(filters?: { search?: string; status?: string; userId?: string; userRole?: string }): Promise<Vendor[]>;
  getVendor(id: string): Promise<VendorWithSubmissions | undefined>;
  createVendor(vendor: InsertVendor): Promise<Vendor>;
  updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor>;
  deleteVendor(id: string): Promise<void>;
  
  // Submission operations
  getSubmissions(filters?: { 
    status?: string; 
    userId?: string; 
    userRole?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<SubmissionWithRelations[]>;
  getSubmission(id: string): Promise<SubmissionWithRelations | undefined>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: string, submission: Partial<InsertSubmission>): Promise<Submission>;
  deleteSubmission(id: string): Promise<void>;
  
  // Interview operations
  getInterviews(filters?: { 
    upcoming?: boolean; 
    dateFrom?: Date; 
    dateTo?: Date;
  }): Promise<Interview[]>;
  getInterviewsForSubmission(submissionId: string): Promise<Interview[]>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(id: string, interview: Partial<InsertInterview>): Promise<Interview>;
  deleteInterview(id: string): Promise<void>;
  
  // Dashboard statistics
  getDashboardStats(filters?: { 
    userId?: string; 
    userRole?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    submitted: number;
    pending: number;
    interviews: number;
    hired: number;
    rejected: number;
  }>;
  
  getWeeklyActivity(dateFrom: Date, dateTo: Date): Promise<Array<{ date: string; count: number }>>;
  
  // Follow-up reminders
  getFollowUpReminders(filters?: { 
    userId?: string; 
    userRole?: string;
    overdue?: boolean;
  }): Promise<Array<{
    id: string;
    consultantName: string;
    vendorName: string;
    positionTitle: string;
    status: string;
    nextFollowUpDate: Date;
    lastVendorContact: Date | null;
    vendorFeedback: string | null;
    daysSinceContact: number;
    daysPastDue: number;
  }>>;
  
  // Advanced Analytics
  getConsultantAnalytics(filters?: { 
    userId?: string; 
    userRole?: string;
    consultantId?: string;
    timeframe?: 'daily' | 'weekly' | 'monthly';
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<Array<{
    consultantId: string;
    consultantName: string;
    dailySubmissions?: Array<{ date: string; count: number }>;
    weeklySubmissions?: Array<{ week: string; count: number }>;
    monthlySubmissions?: Array<{ month: string; count: number }>;
    statusBreakdown: {
      submitted: number;
      under_review: number;
      interview_scheduled: number;
      hired: number;
      rejected: number;
    };
    totalSubmissions: number;
  }>>;
  
  getRecruiterPerformance(filters?: { 
    userId?: string; 
    userRole?: string;
    timeframe?: 'daily' | 'weekly' | 'monthly';
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<Array<{
    recruiterId: string;
    recruiterName: string;
    recruiterEmail: string;
    totalSubmissions: number;
    consultantsWorkedWith: number;
    statusBreakdown: {
      submitted: number;
      under_review: number;
      interview_scheduled: number;
      hired: number;
      rejected: number;
    };
    timeBasedData?: Array<{ period: string; count: number }>;
    successRate: number; // (hired / total submissions) * 100
  }>>;
  
  getSubmissionAnalytics(filters?: { 
    userId?: string; 
    userRole?: string;
    timeframe?: 'daily' | 'weekly' | 'monthly';
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    totalSubmissions: number;
    submissionsProgression: {
      submitted: number;
      under_review: number;
      interview_scheduled: number;
      hired: number;
      rejected: number;
      waiting_for_vendor_update: number; // submitted + under_review
    };
    timeBasedSubmissions: Array<{ period: string; count: number }>;
    averageTimeToInterview: number; // in days
    conversionRates: {
      submittedToInterview: number; // percentage
      interviewToHired: number; // percentage
      overallSuccess: number; // percentage
    };
  }>;

  // Vendor Analytics operations
  getVendorAnalytics(userId: string, timeframe: string, skill: string): Promise<any>;
  getVendorSkillMetrics(userId: string): Promise<any[]>;
  
  // Consultant Notification operations
  getConsultantActivityNotifications(userId: string, timeframe: string): Promise<any>;
  getConsultantSummaryStats(userId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: string, userData: Partial<UpsertUser>): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  // Consultant operations
  async getConsultants(filters?: { search?: string; status?: string; userId?: string; userRole?: string }): Promise<Consultant[]> {
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          like(consultants.firstName, `%${filters.search}%`),
          like(consultants.lastName, `%${filters.search}%`),
          like(consultants.email, `%${filters.search}%`),
          sql`${consultants.skills} && ARRAY[${filters.search}]`
        )
      );
    }
    
    if (filters?.status) {
      conditions.push(eq(consultants.status, filters.status));
    }
    
    // Role-based filtering: recruiters only see consultants they created
    if (filters?.userRole === 'recruiter' && filters?.userId) {
      conditions.push(eq(consultants.createdBy, filters.userId));
    }
    
    if (conditions.length > 0) {
      const whereCondition = and(...conditions);
      return await db
        .select()
        .from(consultants)
        .where(whereCondition)
        .orderBy(desc(consultants.createdAt));
    }
    
    return await db
      .select()
      .from(consultants)
      .orderBy(desc(consultants.createdAt));
  }

  async getConsultant(id: string): Promise<ConsultantWithSubmissions | undefined> {
    const [consultant] = await db.select().from(consultants).where(eq(consultants.id, id));
    
    if (!consultant) return undefined;
    
    const consultantSubmissions = await db
      .select({
        submission: submissions,
        vendor: vendors,
        recruiter: users,
      })
      .from(submissions)
      .leftJoin(vendors, eq(submissions.vendorId, vendors.id))
      .leftJoin(users, eq(submissions.createdBy, users.id))
      .where(eq(submissions.consultantId, id))
      .orderBy(desc(submissions.submissionDate));
    
    return {
      ...consultant,
      submissions: consultantSubmissions.map(({ submission, vendor, recruiter }) => ({
        ...submission,
        consultant,
        vendor: vendor || { 
          id: '', 
          name: 'Unknown Vendor',
          contactPerson: null,
          email: null,
          phone: null,
          location: null,
          specialties: null,
          status: 'inactive',
          notes: null,
          partnershipDate: null,
          recruiterId: '',
          createdAt: null,
          updatedAt: null,
          createdBy: null
        },
        recruiter: recruiter || { 
          id: '', 
          email: 'N/A',
          username: null,
          password: null,
          firstName: 'Unknown', 
          lastName: 'Recruiter', 
          profileImageUrl: null,
          role: 'recruiter',
          isPasswordTemporary: null,
          passwordExpiresAt: null,
          createdAt: null,
          updatedAt: null
        },
      })),
    };
  }

  async createConsultant(consultant: InsertConsultant): Promise<Consultant> {
    const [newConsultant] = await db
      .insert(consultants)
      .values(consultant)
      .returning();
    return newConsultant;
  }

  async updateConsultant(id: string, consultant: Partial<InsertConsultant>): Promise<Consultant> {
    const [updated] = await db
      .update(consultants)
      .set({ ...consultant, updatedAt: new Date() })
      .where(eq(consultants.id, id))
      .returning();
    return updated;
  }

  async deleteConsultant(id: string): Promise<void> {
    await db.delete(consultants).where(eq(consultants.id, id));
  }

  // Vendor operations
  async getVendors(filters?: { search?: string; status?: string; userId?: string; userRole?: string }): Promise<Vendor[]> {
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          like(vendors.name, `%${filters.search}%`),
          like(vendors.contactPerson, `%${filters.search}%`),
          sql`${vendors.specialties} && ARRAY[${filters.search}]`
        )
      );
    }
    
    if (filters?.status) {
      conditions.push(eq(vendors.status, filters.status));
    }
    
    // Role-based filtering: recruiters only see their assigned vendors
    if (filters?.userRole === 'recruiter' && filters?.userId) {
      conditions.push(eq(vendors.recruiterId, filters.userId));
    }
    
    if (conditions.length > 0) {
      const whereCondition = and(...conditions);
      return await db
        .select()
        .from(vendors)
        .where(whereCondition)
        .orderBy(desc(vendors.createdAt));
    }
    
    return await db
      .select()
      .from(vendors)
      .orderBy(desc(vendors.createdAt));
  }

  async getVendor(id: string): Promise<VendorWithSubmissions | undefined> {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    
    if (!vendor) return undefined;
    
    const vendorSubmissions = await db
      .select({
        submission: submissions,
        consultant: consultants,
        recruiter: users,
      })
      .from(submissions)
      .leftJoin(consultants, eq(submissions.consultantId, consultants.id))
      .leftJoin(users, eq(submissions.createdBy, users.id))
      .where(eq(submissions.vendorId, id))
      .orderBy(desc(submissions.submissionDate));
    
    return {
      ...vendor,
      submissions: vendorSubmissions.map(({ submission, consultant, recruiter }) => ({
        ...submission,
        consultant: consultant || { 
          id: '', 
          firstName: 'Unknown', 
          lastName: 'Consultant', 
          email: 'N/A',
          phone: null,
          location: null,
          position: null,
          experience: null,
          skills: null,
          resumeUrl: null,
          resumeFileName: null,
          status: 'inactive',
          createdAt: null,
          updatedAt: null,
          createdBy: null
        },
        vendor,
        recruiter: recruiter || { 
          id: '', 
          email: 'N/A',
          username: null,
          password: null,
          firstName: 'Unknown', 
          lastName: 'Recruiter', 
          profileImageUrl: null,
          role: 'recruiter',
          isPasswordTemporary: null,
          passwordExpiresAt: null,
          createdAt: null,
          updatedAt: null
        },
      })),
    };
  }

  async createVendor(vendor: InsertVendor): Promise<Vendor> {
    const [newVendor] = await db
      .insert(vendors)
      .values(vendor)
      .returning();
    return newVendor;
  }

  async updateVendor(id: string, vendor: Partial<InsertVendor>): Promise<Vendor> {
    const [updated] = await db
      .update(vendors)
      .set({ ...vendor, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();
    return updated;
  }

  async deleteVendor(id: string): Promise<void> {
    await db.delete(vendors).where(eq(vendors.id, id));
  }

  // Submission operations
  async getSubmissions(filters?: { 
    status?: string; 
    userId?: string; 
    userRole?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<SubmissionWithRelations[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(submissions.status, filters.status));
    }
    
    if (filters?.userId && filters?.userRole === 'recruiter') {
      conditions.push(eq(submissions.createdBy, filters.userId));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(submissions.submissionDate, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(submissions.submissionDate, filters.dateTo));
    }
    
    let results;
    if (conditions.length > 0) {
      const whereCondition = and(...conditions);
      results = await db
        .select({
          submission: submissions,
          consultant: consultants,
          vendor: vendors,
          recruiter: users,
        })
        .from(submissions)
        .leftJoin(consultants, eq(submissions.consultantId, consultants.id))
        .leftJoin(vendors, eq(submissions.vendorId, vendors.id))
        .leftJoin(users, eq(submissions.createdBy, users.id))
        .where(whereCondition)
        .orderBy(desc(submissions.submissionDate));
    } else {
      results = await db
        .select({
          submission: submissions,
          consultant: consultants,
          vendor: vendors,
          recruiter: users,
        })
        .from(submissions)
        .leftJoin(consultants, eq(submissions.consultantId, consultants.id))
        .leftJoin(vendors, eq(submissions.vendorId, vendors.id))
        .leftJoin(users, eq(submissions.createdBy, users.id))
        .orderBy(desc(submissions.submissionDate));
    }
    
    return results.map(({ submission, consultant, vendor, recruiter }) => ({
      ...submission,
      // Map snake_case to camelCase for timestamp fields
      notesUpdatedAt: submission.notesUpdatedAt,
      vendorFeedbackUpdatedAt: submission.vendorFeedbackUpdatedAt,
      consultant: consultant || { 
        id: '', 
        firstName: 'Unknown', 
        lastName: 'Consultant', 
        email: 'N/A',
        phone: null,
        location: null,
        position: null,
        experience: null,
        skills: null,
        resumeUrl: null,
        resumeFileName: null,
        status: 'inactive',
        createdAt: null,
        updatedAt: null,
        createdBy: null
      },
      vendor: vendor || { 
        id: '', 
        name: 'Unknown Vendor',
        contactPerson: null,
        email: null,
        phone: null,
        location: null,
        specialties: null,
        status: 'inactive',
        notes: null,
        partnershipDate: null,
        recruiterId: '',
        createdAt: null,
        updatedAt: null,
        createdBy: null
      },
      recruiter: recruiter || { 
        id: '', 
        email: 'N/A',
        username: null,
        password: null,
        firstName: 'Unknown', 
        lastName: 'Recruiter', 
        profileImageUrl: null,
        role: 'recruiter',
        isPasswordTemporary: null,
        passwordExpiresAt: null,
        createdAt: null,
        updatedAt: null
      },
    }));
  }

  async getSubmission(id: string): Promise<SubmissionWithRelations | undefined> {
    const [result] = await db
      .select({
        submission: submissions,
        consultant: consultants,
        vendor: vendors,
        recruiter: users,
      })
      .from(submissions)
      .leftJoin(consultants, eq(submissions.consultantId, consultants.id))
      .leftJoin(vendors, eq(submissions.vendorId, vendors.id))
      .leftJoin(users, eq(submissions.createdBy, users.id))
      .where(eq(submissions.id, id));
    
    if (!result) return undefined;
    
    const submissionInterviews = await this.getInterviewsForSubmission(id);
    
    return {
      ...result.submission,
      consultant: result.consultant || { 
        id: '', 
        firstName: 'Unknown', 
        lastName: 'Consultant', 
        email: 'N/A',
        phone: null,
        location: null,
        position: null,
        experience: null,
        skills: null,
        resumeUrl: null,
        resumeFileName: null,
        status: 'inactive',
        createdAt: null,
        updatedAt: null,
        createdBy: null
      },
      vendor: result.vendor || { 
        id: '', 
        name: 'Unknown Vendor',
        contactPerson: null,
        email: null,
        phone: null,
        location: null,
        specialties: null,
        status: 'inactive',
        notes: null,
        partnershipDate: null,
        recruiterId: '',
        createdAt: null,
        updatedAt: null,
        createdBy: null
      },
      recruiter: result.recruiter || { 
        id: '', 
        email: 'N/A',
        username: null,
        password: null,
        firstName: 'Unknown', 
        lastName: 'Recruiter', 
        profileImageUrl: null,
        role: 'recruiter',
        isPasswordTemporary: null,
        passwordExpiresAt: null,
        createdAt: null,
        updatedAt: null
      },
      interviews: submissionInterviews,
    };
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db
      .insert(submissions)
      .values(submission)
      .returning();
    return newSubmission;
  }

  async getSubmissionById(id: string): Promise<Submission | null> {
    const [result] = await db
      .select()
      .from(submissions)
      .where(eq(submissions.id, id))
      .limit(1);
    
    return result || null;
  }

  async updateSubmission(id: string, submission: Partial<InsertSubmission>): Promise<Submission> {
    // If status is being updated to rejected or hired, clear follow-up date
    const updateData = { ...submission, updatedAt: new Date() };
    if (submission.status === 'rejected' || submission.status === 'hired') {
      updateData.nextFollowUpDate = null;
    }
    
    const [updated] = await db
      .update(submissions)
      .set(updateData)
      .where(eq(submissions.id, id))
      .returning();
    return updated;
  }

  async deleteSubmission(id: string): Promise<void> {
    await db.delete(submissions).where(eq(submissions.id, id));
  }

  // Interview operations
  async getInterviews(filters?: { 
    upcoming?: boolean; 
    dateFrom?: Date; 
    dateTo?: Date;
  }): Promise<any[]> {
    const conditions = [];
    
    if (filters?.upcoming) {
      conditions.push(gte(interviews.interviewDate, new Date()));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(interviews.interviewDate, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(interviews.interviewDate, filters.dateTo));
    }
    
    let results;
    if (conditions.length > 0) {
      const whereCondition = and(...conditions);
      results = await db
        .select({
          interview: interviews,
          submission: submissions,
          consultant: consultants,
          vendor: vendors,
        })
        .from(interviews)
        .leftJoin(submissions, eq(interviews.submissionId, submissions.id))
        .leftJoin(consultants, eq(submissions.consultantId, consultants.id))
        .leftJoin(vendors, eq(submissions.vendorId, vendors.id))
        .where(whereCondition)
        .orderBy(asc(interviews.interviewDate));
    } else {
      results = await db
        .select({
          interview: interviews,
          submission: submissions,
          consultant: consultants,
          vendor: vendors,
        })
        .from(interviews)
        .leftJoin(submissions, eq(interviews.submissionId, submissions.id))
        .leftJoin(consultants, eq(submissions.consultantId, consultants.id))
        .leftJoin(vendors, eq(submissions.vendorId, vendors.id))
        .orderBy(asc(interviews.interviewDate));
    }
    
    return results.map(({ interview, submission, consultant, vendor }: any) => ({
      ...interview,
      submission: submission ? {
        ...submission,
        consultant: consultant!,
        vendor: vendor!,
      } : undefined,
    })).filter((i: any) => i.submission);
  }

  async getInterviewsForSubmission(submissionId: string): Promise<Interview[]> {
    return await db
      .select()
      .from(interviews)
      .where(eq(interviews.submissionId, submissionId))
      .orderBy(asc(interviews.interviewDate));
  }

  async createInterview(interview: InsertInterview): Promise<Interview> {
    const [newInterview] = await db
      .insert(interviews)
      .values(interview)
      .returning();
    return newInterview;
  }

  async updateInterview(id: string, interview: Partial<InsertInterview>): Promise<Interview> {
    const [updated] = await db
      .update(interviews)
      .set({ ...interview, updatedAt: new Date() })
      .where(eq(interviews.id, id))
      .returning();
    return updated;
  }

  async deleteInterview(id: string): Promise<void> {
    await db.delete(interviews).where(eq(interviews.id, id));
  }

  // Dashboard statistics
  async getDashboardStats(filters?: { 
    userId?: string; 
    userRole?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    submitted: number;
    pending: number;
    interviews: number;
    hired: number;
    rejected: number;
  }> {
    const conditions = [];
    
    if (filters?.userId && filters?.userRole === 'recruiter') {
      conditions.push(eq(submissions.createdBy, filters.userId));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(submissions.submissionDate, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(submissions.submissionDate, filters.dateTo));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const [stats] = await db
      .select({
        submitted: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'submitted')`,
        pending: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'under_review')`,
        interviews: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'interview_scheduled')`,
        hired: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`,
        rejected: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'rejected')`,
      })
      .from(submissions)
      .where(whereClause);
    
    return {
      submitted: Number(stats.submitted),
      pending: Number(stats.pending),
      interviews: Number(stats.interviews),
      hired: Number(stats.hired),
      rejected: Number(stats.rejected),
    };
  }

  async getFollowUpReminders(filters?: { 
    userId?: string; 
    userRole?: string;
    overdue?: boolean;
  }): Promise<Array<{
    id: string;
    consultantName: string;
    vendorName: string;
    positionTitle: string;
    status: string;
    nextFollowUpDate: Date;
    lastVendorContact: Date | null;
    vendorFeedback: string | null;
    daysSinceContact: number;
    daysPastDue: number;
  }>> {
    const conditions = [];
    const now = new Date();
    
    // Only get submissions with follow-up dates set and exclude rejected/hired submissions
    conditions.push(sql`${submissions.nextFollowUpDate} IS NOT NULL`);
    conditions.push(sql`${submissions.status} NOT IN ('rejected', 'hired')`);
    
    // Role-based filtering
    if (filters?.userRole === 'recruiter' && filters?.userId) {
      conditions.push(eq(submissions.createdBy, filters.userId));
    }
    
    // Filter for overdue only if requested
    if (filters?.overdue) {
      conditions.push(lte(submissions.nextFollowUpDate, now));
    }
    
    const whereCondition = and(...conditions);
    
    const results = await db
      .select({
        submission: submissions,
        consultant: {
          firstName: consultants.firstName,
          lastName: consultants.lastName,
        },
        vendor: {
          name: vendors.name,
        },
      })
      .from(submissions)
      .leftJoin(consultants, eq(submissions.consultantId, consultants.id))
      .leftJoin(vendors, eq(submissions.vendorId, vendors.id))
      .where(whereCondition)
      .orderBy(asc(submissions.nextFollowUpDate));
    
    return results.map(({ submission, consultant, vendor }) => {
      const daysSinceContact = submission.lastVendorContact 
        ? Math.floor((now.getTime() - submission.lastVendorContact.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const daysPastDue = submission.nextFollowUpDate!
        ? Math.floor((now.getTime() - submission.nextFollowUpDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      
      return {
        id: submission.id,
        consultantName: `${consultant?.firstName} ${consultant?.lastName}`,
        vendorName: vendor?.name || 'Unknown',
        positionTitle: submission.positionTitle,
        status: submission.status,
        nextFollowUpDate: submission.nextFollowUpDate!,
        lastVendorContact: submission.lastVendorContact,
        vendorFeedback: submission.vendorFeedback,
        daysSinceContact,
        daysPastDue,
      };
    });
  }

  async getWeeklyActivity(dateFrom: Date, dateTo: Date): Promise<Array<{ date: string; count: number }>> {
    const results = await db
      .select({
        date: sql<string>`DATE(${submissions.submissionDate})`,
        count: count(),
      })
      .from(submissions)
      .where(and(
        gte(submissions.submissionDate, dateFrom),
        lte(submissions.submissionDate, dateTo)
      ))
      .groupBy(sql`DATE(${submissions.submissionDate})`)
      .orderBy(sql`DATE(${submissions.submissionDate})`);
    
    return results.map(r => ({
      date: r.date,
      count: Number(r.count),
    }));
  }

  // Advanced Analytics Implementation
  async getConsultantAnalytics(filters?: { 
    userId?: string; 
    userRole?: string;
    consultantId?: string;
    timeframe?: 'daily' | 'weekly' | 'monthly';
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<Array<{
    consultantId: string;
    consultantName: string;
    dailySubmissions?: Array<{ date: string; count: number }>;
    weeklySubmissions?: Array<{ week: string; count: number }>;
    monthlySubmissions?: Array<{ month: string; count: number }>;
    statusBreakdown: {
      submitted: number;
      under_review: number;
      interview_scheduled: number;
      hired: number;
      rejected: number;
    };
    totalSubmissions: number;
  }>> {
    const conditions = [];
    
    if (filters?.userId && filters?.userRole === 'recruiter') {
      conditions.push(eq(submissions.createdBy, filters.userId));
    }
    
    if (filters?.consultantId) {
      conditions.push(eq(submissions.consultantId, filters.consultantId));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(submissions.submissionDate, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(submissions.submissionDate, filters.dateTo));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Get consultant stats with submission counts and status breakdown
    const consultantStats = await db
      .select({
        consultantId: consultants.id,
        consultantName: sql<string>`CONCAT(${consultants.firstName}, ' ', ${consultants.lastName})`,
        totalSubmissions: count(),
        submitted: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'submitted')`,
        under_review: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'under_review')`,
        interview_scheduled: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'interview_scheduled')`,
        hired: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`,
        rejected: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'rejected')`,
      })
      .from(submissions)
      .innerJoin(consultants, eq(submissions.consultantId, consultants.id))
      .where(whereClause)
      .groupBy(consultants.id, consultants.firstName, consultants.lastName)
      .orderBy(desc(count()));
    
    const results = [];
    
    for (const consultant of consultantStats) {
      let timeBasedData = undefined;
      
      if (filters?.timeframe) {
        const timeConditions = [...conditions, eq(submissions.consultantId, consultant.consultantId)];
        const timeWhereClause = and(...timeConditions);
        
        if (filters.timeframe === 'daily') {
          const dailyData = await db
            .select({
              date: sql<string>`DATE(${submissions.submissionDate})`,
              count: count(),
            })
            .from(submissions)
            .where(timeWhereClause)
            .groupBy(sql`DATE(${submissions.submissionDate})`)
            .orderBy(sql`DATE(${submissions.submissionDate})`);
          
          timeBasedData = { dailySubmissions: dailyData.map(d => ({ date: d.date, count: Number(d.count) })) };
        } else if (filters.timeframe === 'weekly') {
          const weeklyData = await db
            .select({
              week: sql<string>`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`,
              count: count(),
            })
            .from(submissions)
            .where(timeWhereClause)
            .groupBy(sql`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`)
            .orderBy(sql`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`);
          
          timeBasedData = { weeklySubmissions: weeklyData.map(w => ({ week: w.week, count: Number(w.count) })) };
        } else if (filters.timeframe === 'monthly') {
          const monthlyData = await db
            .select({
              month: sql<string>`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`,
              count: count(),
            })
            .from(submissions)
            .where(timeWhereClause)
            .groupBy(sql`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`)
            .orderBy(sql`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`);
          
          timeBasedData = { monthlySubmissions: monthlyData.map(m => ({ month: m.month, count: Number(m.count) })) };
        }
      }
      
      results.push({
        consultantId: consultant.consultantId,
        consultantName: consultant.consultantName,
        ...timeBasedData,
        statusBreakdown: {
          submitted: Number(consultant.submitted),
          under_review: Number(consultant.under_review),
          interview_scheduled: Number(consultant.interview_scheduled),
          hired: Number(consultant.hired),
          rejected: Number(consultant.rejected),
        },
        totalSubmissions: Number(consultant.totalSubmissions),
      });
    }
    
    return results;
  }

  async getRecruiterPerformance(filters?: { 
    userId?: string; 
    userRole?: string;
    timeframe?: 'daily' | 'weekly' | 'monthly';
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<Array<{
    recruiterId: string;
    recruiterName: string;
    recruiterEmail: string;
    totalSubmissions: number;
    consultantsWorkedWith: number;
    statusBreakdown: {
      submitted: number;
      under_review: number;
      interview_scheduled: number;
      hired: number;
      rejected: number;
    };
    timeBasedData?: Array<{ period: string; count: number }>;
    successRate: number;
  }>> {
    const conditions = [];
    
    if (filters?.userId && filters?.userRole === 'recruiter') {
      conditions.push(eq(submissions.createdBy, filters.userId));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(submissions.submissionDate, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(submissions.submissionDate, filters.dateTo));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Get recruiter performance stats
    const recruiterStats = await db
      .select({
        recruiterId: users.id,
        recruiterName: sql<string>`COALESCE(CONCAT(${users.firstName}, ' ', ${users.lastName}), ${users.email})`,
        recruiterEmail: users.email,
        totalSubmissions: count(),
        consultantsWorkedWith: sql<number>`COUNT(DISTINCT ${submissions.consultantId})`,
        submitted: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'submitted')`,
        under_review: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'under_review')`,
        interview_scheduled: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'interview_scheduled')`,
        hired: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`,
        rejected: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'rejected')`,
      })
      .from(submissions)
      .innerJoin(users, eq(submissions.createdBy, users.id))
      .where(whereClause)
      .groupBy(users.id, users.firstName, users.lastName, users.email)
      .orderBy(desc(count()));
    
    const results = [];
    
    for (const recruiter of recruiterStats) {
      let timeBasedData = undefined;
      
      if (filters?.timeframe) {
        const timeConditions = [...conditions, eq(submissions.createdBy, recruiter.recruiterId)];
        const timeWhereClause = and(...timeConditions);
        
        let timeData;
        if (filters.timeframe === 'daily') {
          timeData = await db
            .select({
              period: sql<string>`DATE(${submissions.submissionDate})`,
              count: count(),
            })
            .from(submissions)
            .where(timeWhereClause)
            .groupBy(sql`DATE(${submissions.submissionDate})`)
            .orderBy(sql`DATE(${submissions.submissionDate})`);
        } else if (filters.timeframe === 'weekly') {
          timeData = await db
            .select({
              period: sql<string>`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`,
              count: count(),
            })
            .from(submissions)
            .where(timeWhereClause)
            .groupBy(sql`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`)
            .orderBy(sql`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`);
        } else if (filters.timeframe === 'monthly') {
          timeData = await db
            .select({
              period: sql<string>`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`,
              count: count(),
            })
            .from(submissions)
            .where(timeWhereClause)
            .groupBy(sql`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`)
            .orderBy(sql`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`);
        }
        
        timeBasedData = timeData?.map(d => ({ period: d.period, count: Number(d.count) }));
      }
      
      const totalSubs = Number(recruiter.totalSubmissions);
      const hired = Number(recruiter.hired);
      const successRate = totalSubs > 0 ? Math.round((hired / totalSubs) * 100) : 0;
      
      results.push({
        recruiterId: recruiter.recruiterId,
        recruiterName: recruiter.recruiterName,
        recruiterEmail: recruiter.recruiterEmail || '',
        totalSubmissions: totalSubs,
        consultantsWorkedWith: Number(recruiter.consultantsWorkedWith),
        statusBreakdown: {
          submitted: Number(recruiter.submitted),
          under_review: Number(recruiter.under_review),
          interview_scheduled: Number(recruiter.interview_scheduled),
          hired: hired,
          rejected: Number(recruiter.rejected),
        },
        timeBasedData,
        successRate,
      });
    }
    
    return results;
  }

  async getSubmissionAnalytics(filters?: { 
    userId?: string; 
    userRole?: string;
    timeframe?: 'daily' | 'weekly' | 'monthly';
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<{
    totalSubmissions: number;
    submissionsProgression: {
      submitted: number;
      under_review: number;
      interview_scheduled: number;
      hired: number;
      rejected: number;
      waiting_for_vendor_update: number;
    };
    timeBasedSubmissions: Array<{ period: string; count: number }>;
    averageTimeToInterview: number;
    conversionRates: {
      submittedToInterview: number;
      interviewToHired: number;
      overallSuccess: number;
    };
  }> {
    const conditions = [];
    
    if (filters?.userId && filters?.userRole === 'recruiter') {
      conditions.push(eq(submissions.createdBy, filters.userId));
    }
    
    if (filters?.dateFrom) {
      conditions.push(gte(submissions.submissionDate, filters.dateFrom));
    }
    
    if (filters?.dateTo) {
      conditions.push(lte(submissions.submissionDate, filters.dateTo));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Get overall submission stats
    const [overallStats] = await db
      .select({
        totalSubmissions: count(),
        submitted: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'submitted')`,
        under_review: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'under_review')`,
        interview_scheduled: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'interview_scheduled')`,
        hired: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`,
        rejected: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'rejected')`,
      })
      .from(submissions)
      .where(whereClause);
    
    // Get time-based submissions
    let timeBasedSubmissions: Array<{ period: string; count: number }> = [];
    
    if (filters?.timeframe) {
      let timeData;
      if (filters.timeframe === 'daily') {
        timeData = await db
          .select({
            period: sql<string>`DATE(${submissions.submissionDate})`,
            count: count(),
          })
          .from(submissions)
          .where(whereClause)
          .groupBy(sql`DATE(${submissions.submissionDate})`)
          .orderBy(sql`DATE(${submissions.submissionDate})`);
      } else if (filters.timeframe === 'weekly') {
        timeData = await db
          .select({
            period: sql<string>`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`,
            count: count(),
          })
          .from(submissions)
          .where(whereClause)
          .groupBy(sql`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`)
          .orderBy(sql`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`);
      } else if (filters.timeframe === 'monthly') {
        timeData = await db
          .select({
            period: sql<string>`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`,
            count: count(),
          })
          .from(submissions)
          .where(whereClause)
          .groupBy(sql`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`)
          .orderBy(sql`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`);
      }
      
      timeBasedSubmissions = timeData?.map(d => ({ period: d.period, count: Number(d.count) })) || [];
    }
    
    // Calculate average time to interview (simplified - would need interview table join in real implementation)
    const averageTimeToInterview = 3; // placeholder - would calculate actual days
    
    const totalSubs = Number(overallStats.totalSubmissions);
    const interviewCount = Number(overallStats.interview_scheduled);
    const hiredCount = Number(overallStats.hired);
    const submittedCount = Number(overallStats.submitted);
    const underReviewCount = Number(overallStats.under_review);
    
    // Calculate conversion rates
    const submittedToInterview = totalSubs > 0 ? Math.round((interviewCount / totalSubs) * 100) : 0;
    const interviewToHired = interviewCount > 0 ? Math.round((hiredCount / interviewCount) * 100) : 0;
    const overallSuccess = totalSubs > 0 ? Math.round((hiredCount / totalSubs) * 100) : 0;
    
    return {
      totalSubmissions: totalSubs,
      submissionsProgression: {
        submitted: submittedCount,
        under_review: underReviewCount,
        interview_scheduled: interviewCount,
        hired: hiredCount,
        rejected: Number(overallStats.rejected),
        waiting_for_vendor_update: submittedCount + underReviewCount,
      },
      timeBasedSubmissions,
      averageTimeToInterview,
      conversionRates: {
        submittedToInterview,
        interviewToHired,
        overallSuccess,
      },
    };
  }

  // Vendor Analytics Methods
  async getVendorAnalytics(userId: string, timeframe: string, skill: string): Promise<any> {
    const user = await this.getUser(userId);
    const whereClause = user?.role === 'recruiter' ? eq(vendors.recruiterId, userId) : undefined;

    // Get vendor performance metrics
    const vendorData = await db
      .select({
        id: vendors.id,
        name: vendors.name,
        totalSubmissions: sql<number>`COUNT(${submissions.id})`,
        interviewsCount: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'interview_scheduled' OR EXISTS(
          SELECT 1 FROM ${interviews} WHERE ${interviews.submissionId} = ${submissions.id}
        ))`,
        placementsCount: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`,
      })
      .from(vendors)
      .leftJoin(submissions, eq(vendors.id, submissions.vendorId))
      .where(whereClause)
      .groupBy(vendors.id, vendors.name)
      .having(sql`COUNT(${submissions.id}) > 0`);

    // Get monthly trends
    const monthlyTrends = await db
      .select({
        month: sql<string>`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`,
        totalSubmissions: sql<number>`COUNT(*)`,
        totalInterviews: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'interview_scheduled')`,
        totalPlacements: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`,
      })
      .from(submissions)
      .leftJoin(vendors, eq(submissions.vendorId, vendors.id))
      .where(whereClause ? eq(vendors.recruiterId, userId) : undefined)
      .groupBy(sql`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`);

    // Get summary statistics
    const [summaryStats] = await db
      .select({
        totalActiveVendors: sql<number>`COUNT(DISTINCT ${vendors.id})`,
        overallPlacementRate: sql<number>`
          CASE 
            WHEN COUNT(${submissions.id}) > 0 
            THEN ROUND((COUNT(*) FILTER (WHERE ${submissions.status} = 'hired') * 100.0) / COUNT(${submissions.id}))
            ELSE 0 
          END
        `,
        mostRequestedSkill: sql<string>`'Java'`, // Placeholder - would need complex skills analysis
        monthlyGrowthRate: sql<number>`5`, // Placeholder
      })
      .from(vendors)
      .leftJoin(submissions, eq(vendors.id, submissions.vendorId))
      .where(whereClause);

    return {
      vendors: vendorData,
      monthlyTrends,
      summary: summaryStats,
    };
  }

  async getVendorSkillMetrics(userId: string): Promise<any[]> {
    const user = await this.getUser(userId);
    
    // Complex query to analyze vendor-skill performance
    const vendorSkillData = await db
      .select({
        vendorId: vendors.id,
        vendorName: vendors.name,
        skill: sql<string>`UNNEST(${consultants.skills})`,
        submissionCount: sql<number>`COUNT(${submissions.id})`,
        placementCount: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`,
      })
      .from(vendors)
      .innerJoin(submissions, eq(vendors.id, submissions.vendorId))
      .innerJoin(consultants, eq(submissions.consultantId, consultants.id))
      .where(user?.role === 'recruiter' ? eq(vendors.recruiterId, userId) : undefined)
      .groupBy(vendors.id, vendors.name, sql`UNNEST(${consultants.skills})`)
      .having(sql`COUNT(${submissions.id}) > 0`);

    return vendorSkillData;
  }

  // Consultant Notification Methods
  async getConsultantActivityNotifications(userId: string, timeframe: string): Promise<any> {
    const user = await this.getUser(userId);
    let dateFilter: any;

    // Calculate date range based on timeframe
    const now = new Date();
    if (timeframe === 'daily') {
      dateFilter = gte(submissions.submissionDate, new Date(now.getTime() - 24 * 60 * 60 * 1000));
    } else if (timeframe === 'weekly') {
      dateFilter = gte(submissions.submissionDate, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else if (timeframe === 'monthly') {
      dateFilter = gte(submissions.submissionDate, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000));
    }

    // Get consultant activity data
    const consultantActivity = await db
      .select({
        id: consultants.id,
        firstName: consultants.firstName,
        lastName: consultants.lastName,
        submissionCounts: sql<any>`
          JSON_BUILD_OBJECT(
            'new', COUNT(*) FILTER (WHERE ${submissions.status} = 'submitted' AND ${submissions.submissionDate} >= ${dateFilter})
          )
        `,
        interviewCounts: sql<any>`
          JSON_BUILD_OBJECT(
            'scheduled', COUNT(*) FILTER (WHERE ${submissions.status} = 'interview_scheduled'),
            'completed', COUNT(${interviews.id}) FILTER (WHERE ${interviews.status} = 'completed')
          )
        `,
        placementCounts: sql<any>`
          JSON_BUILD_OBJECT(
            'recent', COUNT(*) FILTER (WHERE ${submissions.status} = 'hired' AND ${submissions.updatedAt} >= ${dateFilter})
          )
        `,
        lastActivityDate: sql<Date>`MAX(${submissions.updatedAt})`,
      })
      .from(consultants)
      .leftJoin(submissions, eq(consultants.id, submissions.consultantId))
      .leftJoin(interviews, eq(submissions.id, interviews.submissionId))
      .where(user?.role === 'recruiter' ? eq(consultants.createdBy, userId) : undefined)
      .groupBy(consultants.id, consultants.firstName, consultants.lastName);

    // Get activity trends
    const activityTrends = await db
      .select({
        date: sql<string>`DATE(${submissions.submissionDate})`,
        submissionCount: sql<number>`COUNT(*)`,
        interviewCount: sql<number>`COUNT(${interviews.id})`,
        placementCount: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`,
      })
      .from(submissions)
      .leftJoin(interviews, eq(submissions.id, interviews.submissionId))
      .leftJoin(consultants, eq(submissions.consultantId, consultants.id))
      .where(and(
        dateFilter,
        user?.role === 'recruiter' ? eq(consultants.createdBy, userId) : undefined
      ))
      .groupBy(sql`DATE(${submissions.submissionDate})`)
      .orderBy(sql`DATE(${submissions.submissionDate})`);

    return {
      consultantActivity,
      activityTrends,
    };
  }

  async getConsultantSummaryStats(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [summaryData] = await db
      .select({
        totalActiveConsultants: sql<number>`COUNT(DISTINCT ${consultants.id}) FILTER (WHERE ${consultants.status} = 'active')`,
        todaySubmissions: sql<number>`COUNT(*) FILTER (WHERE DATE(${submissions.submissionDate}) = CURRENT_DATE)`,
        weekInterviews: sql<number>`COUNT(${interviews.id}) FILTER (WHERE ${interviews.interviewDate} >= ${weekStart})`,
        monthPlacements: sql<number>`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired' AND ${submissions.updatedAt} >= ${monthStart})`,
        avgResponseTime: sql<number>`3`, // Placeholder - would calculate actual response times
      })
      .from(consultants)
      .leftJoin(submissions, eq(consultants.id, submissions.consultantId))
      .leftJoin(interviews, eq(submissions.id, interviews.submissionId))
      .where(user?.role === 'recruiter' ? eq(consultants.createdBy, userId) : undefined);

    return summaryData;
  }
}

export const storage = new DatabaseStorage();

var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  consultants: () => consultants,
  consultantsRelations: () => consultantsRelations,
  insertConsultantSchema: () => insertConsultantSchema,
  insertInterviewSchema: () => insertInterviewSchema,
  insertSubmissionSchema: () => insertSubmissionSchema,
  insertUserSchema: () => insertUserSchema,
  insertVendorSchema: () => insertVendorSchema,
  interviews: () => interviews,
  interviewsRelations: () => interviewsRelations,
  sessions: () => sessions,
  submissions: () => submissions,
  submissionsRelations: () => submissionsRelations,
  users: () => users,
  usersRelations: () => usersRelations,
  vendors: () => vendors,
  vendorsRelations: () => vendorsRelations
});
import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: varchar("username").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).notNull().default("recruiter"),
  // admin or recruiter
  isPasswordTemporary: boolean("is_password_temporary").default(true),
  passwordExpiresAt: timestamp("password_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var consultants = pgTable("consultants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull().unique(),
  phone: varchar("phone"),
  location: varchar("location"),
  position: varchar("position"),
  experience: varchar("experience"),
  // e.g., "3-4 years"
  skills: text("skills").array(),
  // Array of skills
  resumeUrl: varchar("resume_url"),
  resumeFileName: varchar("resume_file_name"),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  // active, placed, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id)
});
var vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  contactPerson: varchar("contact_person"),
  email: varchar("email"),
  phone: varchar("phone"),
  location: varchar("location"),
  specialties: text("specialties").array(),
  // Array of specialties
  status: varchar("status", { length: 20 }).notNull().default("active"),
  // active, pending, inactive
  notes: text("notes"),
  // Notes about the vendor
  partnershipDate: timestamp("partnership_date").defaultNow(),
  recruiterId: varchar("recruiter_id").notNull().references(() => users.id),
  // Point of contact recruiter
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id)
});
var submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consultantId: varchar("consultant_id").notNull().references(() => consultants.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  positionTitle: varchar("position_title").notNull(),
  clientName: varchar("client_name"),
  // Direct client name
  endClientName: varchar("end_client_name"),
  // End client name
  status: varchar("status", { length: 30 }).notNull().default("submitted"),
  // submitted, under_review, interview_scheduled, hired, rejected
  submissionDate: timestamp("submission_date").notNull(),
  lastVendorContact: timestamp("last_vendor_contact"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  vendorFeedback: text("vendor_feedback"),
  // Last feedback from vendor
  vendorFeedbackUpdatedAt: timestamp("vendor_feedback_updated_at"),
  notes: text("notes"),
  notesUpdatedAt: timestamp("notes_updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").notNull().references(() => users.id)
});
var interviews = pgTable("interviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().references(() => submissions.id),
  interviewDate: timestamp("interview_date").notNull(),
  interviewType: varchar("interview_type", { length: 20 }).notNull(),
  // phone, video, onsite
  roundType: varchar("round_type", { length: 30 }).notNull(),
  // screening, technical, manager, final, hr
  meetingLink: varchar("meeting_link"),
  location: varchar("location"),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"),
  // scheduled, completed, cancelled, rescheduled
  // Feedback and follow-up fields
  feedback: text("feedback"),
  rating: integer("rating"),
  // 1-5 rating
  outcome: varchar("outcome", { length: 20 }),
  // pass, fail, pending
  nextSteps: text("next_steps"),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").notNull().references(() => users.id)
});
var usersRelations = relations(users, ({ many }) => ({
  consultants: many(consultants),
  vendors: many(vendors),
  assignedVendors: many(vendors),
  submissions: many(submissions),
  interviews: many(interviews)
}));
var consultantsRelations = relations(consultants, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [consultants.createdBy],
    references: [users.id]
  }),
  submissions: many(submissions)
}));
var vendorsRelations = relations(vendors, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [vendors.createdBy],
    references: [users.id]
  }),
  recruiter: one(users, {
    fields: [vendors.recruiterId],
    references: [users.id]
  }),
  submissions: many(submissions)
}));
var submissionsRelations = relations(submissions, ({ one, many }) => ({
  consultant: one(consultants, {
    fields: [submissions.consultantId],
    references: [consultants.id]
  }),
  vendor: one(vendors, {
    fields: [submissions.vendorId],
    references: [vendors.id]
  }),
  createdBy: one(users, {
    fields: [submissions.createdBy],
    references: [users.id]
  }),
  interviews: many(interviews)
}));
var interviewsRelations = relations(interviews, ({ one }) => ({
  submission: one(submissions, {
    fields: [interviews.submissionId],
    references: [submissions.id]
  }),
  createdBy: one(users, {
    fields: [interviews.createdBy],
    references: [users.id]
  })
}));
var insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true
});
var insertConsultantSchema = createInsertSchema(consultants).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  partnershipDate: true
});
var insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc, asc, and, gte, lte, like, or, count, sql as sql2 } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async getAllUsers() {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  async updateUser(id, userData) {
    const [updated] = await db.update(users).set({ ...userData, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
    return updated;
  }
  async deleteUser(id) {
    await db.delete(users).where(eq(users.id, id));
  }
  // Consultant operations
  async getConsultants(filters) {
    const conditions = [];
    if (filters?.search) {
      conditions.push(
        or(
          like(consultants.firstName, `%${filters.search}%`),
          like(consultants.lastName, `%${filters.search}%`),
          like(consultants.email, `%${filters.search}%`),
          sql2`${consultants.skills} && ARRAY[${filters.search}]`
        )
      );
    }
    if (filters?.status) {
      conditions.push(eq(consultants.status, filters.status));
    }
    if (filters?.userRole === "recruiter" && filters?.userId) {
      conditions.push(eq(consultants.createdBy, filters.userId));
    }
    if (conditions.length > 0) {
      const whereCondition = and(...conditions);
      return await db.select().from(consultants).where(whereCondition).orderBy(desc(consultants.createdAt));
    }
    return await db.select().from(consultants).orderBy(desc(consultants.createdAt));
  }
  async getConsultant(id) {
    const [consultant] = await db.select().from(consultants).where(eq(consultants.id, id));
    if (!consultant) return void 0;
    const consultantSubmissions = await db.select({
      submission: submissions,
      vendor: vendors,
      recruiter: users
    }).from(submissions).leftJoin(vendors, eq(submissions.vendorId, vendors.id)).leftJoin(users, eq(submissions.createdBy, users.id)).where(eq(submissions.consultantId, id)).orderBy(desc(submissions.submissionDate));
    return {
      ...consultant,
      submissions: consultantSubmissions.map(({ submission, vendor, recruiter }) => ({
        ...submission,
        consultant,
        vendor: vendor || {
          id: "",
          name: "Unknown Vendor",
          contactPerson: null,
          email: null,
          phone: null,
          location: null,
          specialties: null,
          status: "inactive",
          notes: null,
          partnershipDate: null,
          recruiterId: "",
          createdAt: null,
          updatedAt: null,
          createdBy: null
        },
        recruiter: recruiter || {
          id: "",
          email: "N/A",
          username: null,
          password: null,
          firstName: "Unknown",
          lastName: "Recruiter",
          profileImageUrl: null,
          role: "recruiter",
          isPasswordTemporary: null,
          passwordExpiresAt: null,
          createdAt: null,
          updatedAt: null
        }
      }))
    };
  }
  async createConsultant(consultant) {
    const [newConsultant] = await db.insert(consultants).values(consultant).returning();
    return newConsultant;
  }
  async updateConsultant(id, consultant) {
    const [updated] = await db.update(consultants).set({ ...consultant, updatedAt: /* @__PURE__ */ new Date() }).where(eq(consultants.id, id)).returning();
    return updated;
  }
  async deleteConsultant(id) {
    await db.delete(consultants).where(eq(consultants.id, id));
  }
  // Vendor operations
  async getVendors(filters) {
    const conditions = [];
    if (filters?.search) {
      conditions.push(
        or(
          like(vendors.name, `%${filters.search}%`),
          like(vendors.contactPerson, `%${filters.search}%`),
          sql2`${vendors.specialties} && ARRAY[${filters.search}]`
        )
      );
    }
    if (filters?.status) {
      conditions.push(eq(vendors.status, filters.status));
    }
    if (filters?.userRole === "recruiter" && filters?.userId) {
      conditions.push(eq(vendors.recruiterId, filters.userId));
    }
    if (conditions.length > 0) {
      const whereCondition = and(...conditions);
      return await db.select().from(vendors).where(whereCondition).orderBy(desc(vendors.createdAt));
    }
    return await db.select().from(vendors).orderBy(desc(vendors.createdAt));
  }
  async getVendor(id) {
    const [vendor] = await db.select().from(vendors).where(eq(vendors.id, id));
    if (!vendor) return void 0;
    const vendorSubmissions = await db.select({
      submission: submissions,
      consultant: consultants,
      recruiter: users
    }).from(submissions).leftJoin(consultants, eq(submissions.consultantId, consultants.id)).leftJoin(users, eq(submissions.createdBy, users.id)).where(eq(submissions.vendorId, id)).orderBy(desc(submissions.submissionDate));
    return {
      ...vendor,
      submissions: vendorSubmissions.map(({ submission, consultant, recruiter }) => ({
        ...submission,
        consultant: consultant || {
          id: "",
          firstName: "Unknown",
          lastName: "Consultant",
          email: "N/A",
          phone: null,
          location: null,
          position: null,
          experience: null,
          skills: null,
          resumeUrl: null,
          resumeFileName: null,
          status: "inactive",
          createdAt: null,
          updatedAt: null,
          createdBy: null
        },
        vendor,
        recruiter: recruiter || {
          id: "",
          email: "N/A",
          username: null,
          password: null,
          firstName: "Unknown",
          lastName: "Recruiter",
          profileImageUrl: null,
          role: "recruiter",
          isPasswordTemporary: null,
          passwordExpiresAt: null,
          createdAt: null,
          updatedAt: null
        }
      }))
    };
  }
  async createVendor(vendor) {
    const [newVendor] = await db.insert(vendors).values(vendor).returning();
    return newVendor;
  }
  async updateVendor(id, vendor) {
    const [updated] = await db.update(vendors).set({ ...vendor, updatedAt: /* @__PURE__ */ new Date() }).where(eq(vendors.id, id)).returning();
    return updated;
  }
  async deleteVendor(id) {
    await db.delete(vendors).where(eq(vendors.id, id));
  }
  // Submission operations
  async getSubmissions(filters) {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(submissions.status, filters.status));
    }
    if (filters?.userId && filters?.userRole === "recruiter") {
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
      results = await db.select({
        submission: submissions,
        consultant: consultants,
        vendor: vendors,
        recruiter: users
      }).from(submissions).leftJoin(consultants, eq(submissions.consultantId, consultants.id)).leftJoin(vendors, eq(submissions.vendorId, vendors.id)).leftJoin(users, eq(submissions.createdBy, users.id)).where(whereCondition).orderBy(desc(submissions.submissionDate));
    } else {
      results = await db.select({
        submission: submissions,
        consultant: consultants,
        vendor: vendors,
        recruiter: users
      }).from(submissions).leftJoin(consultants, eq(submissions.consultantId, consultants.id)).leftJoin(vendors, eq(submissions.vendorId, vendors.id)).leftJoin(users, eq(submissions.createdBy, users.id)).orderBy(desc(submissions.submissionDate));
    }
    return results.map(({ submission, consultant, vendor, recruiter }) => ({
      ...submission,
      // Map snake_case to camelCase for timestamp fields
      notesUpdatedAt: submission.notesUpdatedAt,
      vendorFeedbackUpdatedAt: submission.vendorFeedbackUpdatedAt,
      consultant: consultant || {
        id: "",
        firstName: "Unknown",
        lastName: "Consultant",
        email: "N/A",
        phone: null,
        location: null,
        position: null,
        experience: null,
        skills: null,
        resumeUrl: null,
        resumeFileName: null,
        status: "inactive",
        createdAt: null,
        updatedAt: null,
        createdBy: null
      },
      vendor: vendor || {
        id: "",
        name: "Unknown Vendor",
        contactPerson: null,
        email: null,
        phone: null,
        location: null,
        specialties: null,
        status: "inactive",
        notes: null,
        partnershipDate: null,
        recruiterId: "",
        createdAt: null,
        updatedAt: null,
        createdBy: null
      },
      recruiter: recruiter || {
        id: "",
        email: "N/A",
        username: null,
        password: null,
        firstName: "Unknown",
        lastName: "Recruiter",
        profileImageUrl: null,
        role: "recruiter",
        isPasswordTemporary: null,
        passwordExpiresAt: null,
        createdAt: null,
        updatedAt: null
      }
    }));
  }
  async getSubmission(id) {
    const [result] = await db.select({
      submission: submissions,
      consultant: consultants,
      vendor: vendors,
      recruiter: users
    }).from(submissions).leftJoin(consultants, eq(submissions.consultantId, consultants.id)).leftJoin(vendors, eq(submissions.vendorId, vendors.id)).leftJoin(users, eq(submissions.createdBy, users.id)).where(eq(submissions.id, id));
    if (!result) return void 0;
    const submissionInterviews = await this.getInterviewsForSubmission(id);
    return {
      ...result.submission,
      consultant: result.consultant || {
        id: "",
        firstName: "Unknown",
        lastName: "Consultant",
        email: "N/A",
        phone: null,
        location: null,
        position: null,
        experience: null,
        skills: null,
        resumeUrl: null,
        resumeFileName: null,
        status: "inactive",
        createdAt: null,
        updatedAt: null,
        createdBy: null
      },
      vendor: result.vendor || {
        id: "",
        name: "Unknown Vendor",
        contactPerson: null,
        email: null,
        phone: null,
        location: null,
        specialties: null,
        status: "inactive",
        notes: null,
        partnershipDate: null,
        recruiterId: "",
        createdAt: null,
        updatedAt: null,
        createdBy: null
      },
      recruiter: result.recruiter || {
        id: "",
        email: "N/A",
        username: null,
        password: null,
        firstName: "Unknown",
        lastName: "Recruiter",
        profileImageUrl: null,
        role: "recruiter",
        isPasswordTemporary: null,
        passwordExpiresAt: null,
        createdAt: null,
        updatedAt: null
      },
      interviews: submissionInterviews
    };
  }
  async createSubmission(submission) {
    const [newSubmission] = await db.insert(submissions).values(submission).returning();
    return newSubmission;
  }
  async getSubmissionById(id) {
    const [result] = await db.select().from(submissions).where(eq(submissions.id, id)).limit(1);
    return result || null;
  }
  async updateSubmission(id, submission) {
    const updateData = { ...submission, updatedAt: /* @__PURE__ */ new Date() };
    if (submission.status === "rejected" || submission.status === "hired") {
      updateData.nextFollowUpDate = null;
    }
    const [updated] = await db.update(submissions).set(updateData).where(eq(submissions.id, id)).returning();
    return updated;
  }
  async deleteSubmission(id) {
    await db.delete(submissions).where(eq(submissions.id, id));
  }
  // Interview operations
  async getInterviews(filters) {
    const conditions = [];
    if (filters?.upcoming) {
      conditions.push(gte(interviews.interviewDate, /* @__PURE__ */ new Date()));
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
      results = await db.select({
        interview: interviews,
        submission: submissions,
        consultant: consultants,
        vendor: vendors
      }).from(interviews).leftJoin(submissions, eq(interviews.submissionId, submissions.id)).leftJoin(consultants, eq(submissions.consultantId, consultants.id)).leftJoin(vendors, eq(submissions.vendorId, vendors.id)).where(whereCondition).orderBy(asc(interviews.interviewDate));
    } else {
      results = await db.select({
        interview: interviews,
        submission: submissions,
        consultant: consultants,
        vendor: vendors
      }).from(interviews).leftJoin(submissions, eq(interviews.submissionId, submissions.id)).leftJoin(consultants, eq(submissions.consultantId, consultants.id)).leftJoin(vendors, eq(submissions.vendorId, vendors.id)).orderBy(asc(interviews.interviewDate));
    }
    return results.map(({ interview, submission, consultant, vendor }) => ({
      ...interview,
      submission: submission ? {
        ...submission,
        consultant,
        vendor
      } : void 0
    })).filter((i) => i.submission);
  }
  async getInterviewsForSubmission(submissionId) {
    return await db.select().from(interviews).where(eq(interviews.submissionId, submissionId)).orderBy(asc(interviews.interviewDate));
  }
  async createInterview(interview) {
    const [newInterview] = await db.insert(interviews).values(interview).returning();
    return newInterview;
  }
  async updateInterview(id, interview) {
    const [updated] = await db.update(interviews).set({ ...interview, updatedAt: /* @__PURE__ */ new Date() }).where(eq(interviews.id, id)).returning();
    return updated;
  }
  async deleteInterview(id) {
    await db.delete(interviews).where(eq(interviews.id, id));
  }
  // Dashboard statistics
  async getDashboardStats(filters) {
    const conditions = [];
    if (filters?.userId && filters?.userRole === "recruiter") {
      conditions.push(eq(submissions.createdBy, filters.userId));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(submissions.submissionDate, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(submissions.submissionDate, filters.dateTo));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const [stats] = await db.select({
      submitted: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'submitted')`,
      pending: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'under_review')`,
      interviews: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'interview_scheduled')`,
      hired: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`,
      rejected: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'rejected')`
    }).from(submissions).where(whereClause);
    return {
      submitted: Number(stats.submitted),
      pending: Number(stats.pending),
      interviews: Number(stats.interviews),
      hired: Number(stats.hired),
      rejected: Number(stats.rejected)
    };
  }
  async getFollowUpReminders(filters) {
    const conditions = [];
    const now = /* @__PURE__ */ new Date();
    conditions.push(sql2`${submissions.nextFollowUpDate} IS NOT NULL`);
    conditions.push(sql2`${submissions.status} NOT IN ('rejected', 'hired')`);
    if (filters?.userRole === "recruiter" && filters?.userId) {
      conditions.push(eq(submissions.createdBy, filters.userId));
    }
    if (filters?.overdue) {
      conditions.push(lte(submissions.nextFollowUpDate, now));
    }
    const whereCondition = and(...conditions);
    const results = await db.select({
      submission: submissions,
      consultant: {
        firstName: consultants.firstName,
        lastName: consultants.lastName
      },
      vendor: {
        name: vendors.name
      }
    }).from(submissions).leftJoin(consultants, eq(submissions.consultantId, consultants.id)).leftJoin(vendors, eq(submissions.vendorId, vendors.id)).where(whereCondition).orderBy(asc(submissions.nextFollowUpDate));
    return results.map(({ submission, consultant, vendor }) => {
      const daysSinceContact = submission.lastVendorContact ? Math.floor((now.getTime() - submission.lastVendorContact.getTime()) / (1e3 * 60 * 60 * 24)) : 0;
      const daysPastDue = submission.nextFollowUpDate ? Math.floor((now.getTime() - submission.nextFollowUpDate.getTime()) / (1e3 * 60 * 60 * 24)) : 0;
      return {
        id: submission.id,
        consultantName: `${consultant?.firstName} ${consultant?.lastName}`,
        vendorName: vendor?.name || "Unknown",
        positionTitle: submission.positionTitle,
        status: submission.status,
        nextFollowUpDate: submission.nextFollowUpDate,
        lastVendorContact: submission.lastVendorContact,
        vendorFeedback: submission.vendorFeedback,
        daysSinceContact,
        daysPastDue
      };
    });
  }
  async getWeeklyActivity(dateFrom, dateTo) {
    const results = await db.select({
      date: sql2`DATE(${submissions.submissionDate})`,
      count: count()
    }).from(submissions).where(and(
      gte(submissions.submissionDate, dateFrom),
      lte(submissions.submissionDate, dateTo)
    )).groupBy(sql2`DATE(${submissions.submissionDate})`).orderBy(sql2`DATE(${submissions.submissionDate})`);
    return results.map((r) => ({
      date: r.date,
      count: Number(r.count)
    }));
  }
  // Advanced Analytics Implementation
  async getConsultantAnalytics(filters) {
    const conditions = [];
    if (filters?.userId && filters?.userRole === "recruiter") {
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
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const consultantStats = await db.select({
      consultantId: consultants.id,
      consultantName: sql2`CONCAT(${consultants.firstName}, ' ', ${consultants.lastName})`,
      totalSubmissions: count(),
      submitted: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'submitted')`,
      under_review: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'under_review')`,
      interview_scheduled: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'interview_scheduled')`,
      hired: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`,
      rejected: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'rejected')`
    }).from(submissions).innerJoin(consultants, eq(submissions.consultantId, consultants.id)).where(whereClause).groupBy(consultants.id, consultants.firstName, consultants.lastName).orderBy(desc(count()));
    const results = [];
    for (const consultant of consultantStats) {
      let timeBasedData = void 0;
      if (filters?.timeframe) {
        const timeConditions = [...conditions, eq(submissions.consultantId, consultant.consultantId)];
        const timeWhereClause = and(...timeConditions);
        if (filters.timeframe === "daily") {
          const dailyData = await db.select({
            date: sql2`DATE(${submissions.submissionDate})`,
            count: count()
          }).from(submissions).where(timeWhereClause).groupBy(sql2`DATE(${submissions.submissionDate})`).orderBy(sql2`DATE(${submissions.submissionDate})`);
          timeBasedData = { dailySubmissions: dailyData.map((d) => ({ date: d.date, count: Number(d.count) })) };
        } else if (filters.timeframe === "weekly") {
          const weeklyData = await db.select({
            week: sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`,
            count: count()
          }).from(submissions).where(timeWhereClause).groupBy(sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`).orderBy(sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`);
          timeBasedData = { weeklySubmissions: weeklyData.map((w) => ({ week: w.week, count: Number(w.count) })) };
        } else if (filters.timeframe === "monthly") {
          const monthlyData = await db.select({
            month: sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`,
            count: count()
          }).from(submissions).where(timeWhereClause).groupBy(sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`).orderBy(sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`);
          timeBasedData = { monthlySubmissions: monthlyData.map((m) => ({ month: m.month, count: Number(m.count) })) };
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
          rejected: Number(consultant.rejected)
        },
        totalSubmissions: Number(consultant.totalSubmissions)
      });
    }
    return results;
  }
  async getRecruiterPerformance(filters) {
    const conditions = [];
    if (filters?.userId && filters?.userRole === "recruiter") {
      conditions.push(eq(submissions.createdBy, filters.userId));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(submissions.submissionDate, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(submissions.submissionDate, filters.dateTo));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const recruiterStats = await db.select({
      recruiterId: users.id,
      recruiterName: sql2`COALESCE(CONCAT(${users.firstName}, ' ', ${users.lastName}), ${users.email})`,
      recruiterEmail: users.email,
      totalSubmissions: count(),
      consultantsWorkedWith: sql2`COUNT(DISTINCT ${submissions.consultantId})`,
      submitted: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'submitted')`,
      under_review: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'under_review')`,
      interview_scheduled: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'interview_scheduled')`,
      hired: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`,
      rejected: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'rejected')`
    }).from(submissions).innerJoin(users, eq(submissions.createdBy, users.id)).where(whereClause).groupBy(users.id, users.firstName, users.lastName, users.email).orderBy(desc(count()));
    const results = [];
    for (const recruiter of recruiterStats) {
      let timeBasedData = void 0;
      if (filters?.timeframe) {
        const timeConditions = [...conditions, eq(submissions.createdBy, recruiter.recruiterId)];
        const timeWhereClause = and(...timeConditions);
        let timeData;
        if (filters.timeframe === "daily") {
          timeData = await db.select({
            period: sql2`DATE(${submissions.submissionDate})`,
            count: count()
          }).from(submissions).where(timeWhereClause).groupBy(sql2`DATE(${submissions.submissionDate})`).orderBy(sql2`DATE(${submissions.submissionDate})`);
        } else if (filters.timeframe === "weekly") {
          timeData = await db.select({
            period: sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`,
            count: count()
          }).from(submissions).where(timeWhereClause).groupBy(sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`).orderBy(sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`);
        } else if (filters.timeframe === "monthly") {
          timeData = await db.select({
            period: sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`,
            count: count()
          }).from(submissions).where(timeWhereClause).groupBy(sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`).orderBy(sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`);
        }
        timeBasedData = timeData?.map((d) => ({ period: d.period, count: Number(d.count) }));
      }
      const totalSubs = Number(recruiter.totalSubmissions);
      const hired = Number(recruiter.hired);
      const successRate = totalSubs > 0 ? Math.round(hired / totalSubs * 100) : 0;
      results.push({
        recruiterId: recruiter.recruiterId,
        recruiterName: recruiter.recruiterName,
        recruiterEmail: recruiter.recruiterEmail || "",
        totalSubmissions: totalSubs,
        consultantsWorkedWith: Number(recruiter.consultantsWorkedWith),
        statusBreakdown: {
          submitted: Number(recruiter.submitted),
          under_review: Number(recruiter.under_review),
          interview_scheduled: Number(recruiter.interview_scheduled),
          hired,
          rejected: Number(recruiter.rejected)
        },
        timeBasedData,
        successRate
      });
    }
    return results;
  }
  async getSubmissionAnalytics(filters) {
    const conditions = [];
    if (filters?.userId && filters?.userRole === "recruiter") {
      conditions.push(eq(submissions.createdBy, filters.userId));
    }
    if (filters?.dateFrom) {
      conditions.push(gte(submissions.submissionDate, filters.dateFrom));
    }
    if (filters?.dateTo) {
      conditions.push(lte(submissions.submissionDate, filters.dateTo));
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : void 0;
    const [overallStats] = await db.select({
      totalSubmissions: count(),
      submitted: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'submitted')`,
      under_review: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'under_review')`,
      interview_scheduled: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'interview_scheduled')`,
      hired: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`,
      rejected: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'rejected')`
    }).from(submissions).where(whereClause);
    let timeBasedSubmissions = [];
    if (filters?.timeframe) {
      let timeData;
      if (filters.timeframe === "daily") {
        timeData = await db.select({
          period: sql2`DATE(${submissions.submissionDate})`,
          count: count()
        }).from(submissions).where(whereClause).groupBy(sql2`DATE(${submissions.submissionDate})`).orderBy(sql2`DATE(${submissions.submissionDate})`);
      } else if (filters.timeframe === "weekly") {
        timeData = await db.select({
          period: sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`,
          count: count()
        }).from(submissions).where(whereClause).groupBy(sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`).orderBy(sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-"W"WW')`);
      } else if (filters.timeframe === "monthly") {
        timeData = await db.select({
          period: sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`,
          count: count()
        }).from(submissions).where(whereClause).groupBy(sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`).orderBy(sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`);
      }
      timeBasedSubmissions = timeData?.map((d) => ({ period: d.period, count: Number(d.count) })) || [];
    }
    const averageTimeToInterview = 3;
    const totalSubs = Number(overallStats.totalSubmissions);
    const interviewCount = Number(overallStats.interview_scheduled);
    const hiredCount = Number(overallStats.hired);
    const submittedCount = Number(overallStats.submitted);
    const underReviewCount = Number(overallStats.under_review);
    const submittedToInterview = totalSubs > 0 ? Math.round(interviewCount / totalSubs * 100) : 0;
    const interviewToHired = interviewCount > 0 ? Math.round(hiredCount / interviewCount * 100) : 0;
    const overallSuccess = totalSubs > 0 ? Math.round(hiredCount / totalSubs * 100) : 0;
    return {
      totalSubmissions: totalSubs,
      submissionsProgression: {
        submitted: submittedCount,
        under_review: underReviewCount,
        interview_scheduled: interviewCount,
        hired: hiredCount,
        rejected: Number(overallStats.rejected),
        waiting_for_vendor_update: submittedCount + underReviewCount
      },
      timeBasedSubmissions,
      averageTimeToInterview,
      conversionRates: {
        submittedToInterview,
        interviewToHired,
        overallSuccess
      }
    };
  }
  // Vendor Analytics Methods
  async getVendorAnalytics(userId, timeframe, skill) {
    const user = await this.getUser(userId);
    const whereClause = user?.role === "recruiter" ? eq(vendors.recruiterId, userId) : void 0;
    const vendorData = await db.select({
      id: vendors.id,
      name: vendors.name,
      totalSubmissions: sql2`COUNT(${submissions.id})`,
      interviewsCount: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'interview_scheduled' OR EXISTS(
          SELECT 1 FROM ${interviews} WHERE ${interviews.submissionId} = ${submissions.id}
        ))`,
      placementsCount: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`
    }).from(vendors).leftJoin(submissions, eq(vendors.id, submissions.vendorId)).where(whereClause).groupBy(vendors.id, vendors.name).having(sql2`COUNT(${submissions.id}) > 0`);
    const monthlyTrends = await db.select({
      month: sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`,
      totalSubmissions: sql2`COUNT(*)`,
      totalInterviews: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'interview_scheduled')`,
      totalPlacements: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`
    }).from(submissions).leftJoin(vendors, eq(submissions.vendorId, vendors.id)).where(whereClause ? eq(vendors.recruiterId, userId) : void 0).groupBy(sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`).orderBy(sql2`TO_CHAR(${submissions.submissionDate}, 'YYYY-MM')`);
    const [summaryStats] = await db.select({
      totalActiveVendors: sql2`COUNT(DISTINCT ${vendors.id})`,
      overallPlacementRate: sql2`
          CASE 
            WHEN COUNT(${submissions.id}) > 0 
            THEN ROUND((COUNT(*) FILTER (WHERE ${submissions.status} = 'hired') * 100.0) / COUNT(${submissions.id}))
            ELSE 0 
          END
        `,
      mostRequestedSkill: sql2`'Java'`,
      // Placeholder - would need complex skills analysis
      monthlyGrowthRate: sql2`5`
      // Placeholder
    }).from(vendors).leftJoin(submissions, eq(vendors.id, submissions.vendorId)).where(whereClause);
    return {
      vendors: vendorData,
      monthlyTrends,
      summary: summaryStats
    };
  }
  async getVendorSkillMetrics(userId) {
    const user = await this.getUser(userId);
    const vendorSkillData = await db.select({
      vendorId: vendors.id,
      vendorName: vendors.name,
      skill: sql2`UNNEST(${consultants.skills})`,
      submissionCount: sql2`COUNT(${submissions.id})`,
      placementCount: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`
    }).from(vendors).innerJoin(submissions, eq(vendors.id, submissions.vendorId)).innerJoin(consultants, eq(submissions.consultantId, consultants.id)).where(user?.role === "recruiter" ? eq(vendors.recruiterId, userId) : void 0).groupBy(vendors.id, vendors.name, sql2`UNNEST(${consultants.skills})`).having(sql2`COUNT(${submissions.id}) > 0`);
    return vendorSkillData;
  }
  // Consultant Notification Methods
  async getConsultantActivityNotifications(userId, timeframe) {
    const user = await this.getUser(userId);
    let dateFilter;
    const now = /* @__PURE__ */ new Date();
    if (timeframe === "daily") {
      dateFilter = gte(submissions.submissionDate, new Date(now.getTime() - 24 * 60 * 60 * 1e3));
    } else if (timeframe === "weekly") {
      dateFilter = gte(submissions.submissionDate, new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3));
    } else if (timeframe === "monthly") {
      dateFilter = gte(submissions.submissionDate, new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3));
    }
    const consultantActivity = await db.select({
      id: consultants.id,
      firstName: consultants.firstName,
      lastName: consultants.lastName,
      submissionCounts: sql2`
          JSON_BUILD_OBJECT(
            'new', COUNT(*) FILTER (WHERE ${submissions.status} = 'submitted' AND ${submissions.submissionDate} >= ${dateFilter})
          )
        `,
      interviewCounts: sql2`
          JSON_BUILD_OBJECT(
            'scheduled', COUNT(*) FILTER (WHERE ${submissions.status} = 'interview_scheduled'),
            'completed', COUNT(${interviews.id}) FILTER (WHERE ${interviews.status} = 'completed')
          )
        `,
      placementCounts: sql2`
          JSON_BUILD_OBJECT(
            'recent', COUNT(*) FILTER (WHERE ${submissions.status} = 'hired' AND ${submissions.updatedAt} >= ${dateFilter})
          )
        `,
      lastActivityDate: sql2`MAX(${submissions.updatedAt})`
    }).from(consultants).leftJoin(submissions, eq(consultants.id, submissions.consultantId)).leftJoin(interviews, eq(submissions.id, interviews.submissionId)).where(user?.role === "recruiter" ? eq(consultants.createdBy, userId) : void 0).groupBy(consultants.id, consultants.firstName, consultants.lastName);
    const activityTrends = await db.select({
      date: sql2`DATE(${submissions.submissionDate})`,
      submissionCount: sql2`COUNT(*)`,
      interviewCount: sql2`COUNT(${interviews.id})`,
      placementCount: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired')`
    }).from(submissions).leftJoin(interviews, eq(submissions.id, interviews.submissionId)).leftJoin(consultants, eq(submissions.consultantId, consultants.id)).where(and(
      dateFilter,
      user?.role === "recruiter" ? eq(consultants.createdBy, userId) : void 0
    )).groupBy(sql2`DATE(${submissions.submissionDate})`).orderBy(sql2`DATE(${submissions.submissionDate})`);
    return {
      consultantActivity,
      activityTrends
    };
  }
  async getConsultantSummaryStats(userId) {
    const user = await this.getUser(userId);
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const [summaryData] = await db.select({
      totalActiveConsultants: sql2`COUNT(DISTINCT ${consultants.id}) FILTER (WHERE ${consultants.status} = 'active')`,
      todaySubmissions: sql2`COUNT(*) FILTER (WHERE DATE(${submissions.submissionDate}) = CURRENT_DATE)`,
      weekInterviews: sql2`COUNT(${interviews.id}) FILTER (WHERE ${interviews.interviewDate} >= ${weekStart})`,
      monthPlacements: sql2`COUNT(*) FILTER (WHERE ${submissions.status} = 'hired' AND ${submissions.updatedAt} >= ${monthStart})`,
      avgResponseTime: sql2`3`
      // Placeholder - would calculate actual response times
    }).from(consultants).leftJoin(submissions, eq(consultants.id, submissions.consultantId)).leftJoin(interviews, eq(submissions.id, interviews.submissionId)).where(user?.role === "recruiter" ? eq(consultants.createdBy, userId) : void 0);
    return summaryData;
  }
};
var storage = new DatabaseStorage();

// server/ec2Auth.ts
import session from "express-session";
import connectPg from "connect-pg-simple";
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET || "fallback-secret-key",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      // HTTP for EC2
      maxAge: sessionTtl
    }
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use((req, res, next) => {
    if (!req.session) {
      req.session = {};
    }
    const mockUser = {
      id: "ec2-admin",
      email: "admin@ec2.local",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
      claims: {
        sub: "ec2-admin",
        email: "admin@ec2.local",
        first_name: "Admin",
        last_name: "User"
      }
    };
    req.user = mockUser;
    req.session.userId = "ec2-admin";
    next();
  });
  app2.get("/api/login", (req, res) => {
    res.redirect("/");
  });
  app2.get("/api/logout", (req, res) => {
    req.session?.destroy(() => {
      res.redirect("/");
    });
  });
  app2.get("/api/auth/user", (req, res) => {
    res.json(req.user);
  });
}

// server/emailService.ts
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
var sesClient = null;
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_REGION) {
  sesClient = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
}
var EmailReportService = class {
  storage;
  constructor(storage2) {
    this.storage = storage2;
  }
  // Get submission data for reporting
  async getSubmissionsForPeriod(reportType) {
    const now = /* @__PURE__ */ new Date();
    let dateFrom;
    let dateTo;
    switch (reportType) {
      case "daily":
        dateFrom = startOfDay(subDays(now, 1));
        dateTo = endOfDay(subDays(now, 1));
        break;
      case "weekly":
        dateFrom = startOfWeek(subDays(now, 7));
        dateTo = endOfWeek(subDays(now, 7));
        break;
      case "monthly":
        dateFrom = startOfMonth(subDays(now, 30));
        dateTo = endOfMonth(subDays(now, 30));
        break;
    }
    const submissions2 = await this.storage.getSubmissions({
      dateFrom,
      dateTo
    });
    return submissions2.map((submission) => ({
      submissionDate: submission.submissionDate,
      consultantName: `${submission.consultant.firstName} ${submission.consultant.lastName}`,
      positionTitle: submission.positionTitle,
      clientName: submission.clientName || "N/A",
      endClientName: submission.endClientName || "N/A",
      vendorName: submission.vendor.name,
      status: submission.status,
      submittedBy: `${submission.recruiter.firstName} ${submission.recruiter.lastName}`
    }));
  }
  // Generate HTML email content
  generateEmailHtml(data, reportType) {
    const reportTitle = `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Submission Report`;
    const reportDate = format(/* @__PURE__ */ new Date(), "MMMM dd, yyyy");
    const submissionRows = data.map((submission) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">${format(submission.submissionDate, "MMM dd, yyyy")}</td>
        <td style="padding: 12px; text-align: left;">${submission.consultantName}</td>
        <td style="padding: 12px; text-align: left;">${submission.positionTitle}</td>
        <td style="padding: 12px; text-align: left;">${submission.clientName}</td>
        <td style="padding: 12px; text-align: left;">${submission.endClientName}</td>
        <td style="padding: 12px; text-align: left;">${submission.vendorName}</td>
        <td style="padding: 12px; text-align: left;">
          <span style="background-color: ${this.getStatusColor(submission.status)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
            ${submission.status.replace("_", " ").toUpperCase()}
          </span>
        </td>
        <td style="padding: 12px; text-align: left;">${submission.submittedBy}</td>
      </tr>
    `).join("");
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
            <div style="font-size: 24px; font-weight: bold; color: #10b981;">${new Set(data.map((d) => d.consultantName)).size}</div>
            <div style="color: #64748b; font-size: 14px;">Unique Consultants</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #f59e0b;">${new Set(data.map((d) => d.vendorName)).size}</div>
            <div style="color: #64748b; font-size: 14px;">Vendors Engaged</div>
          </div>
          <div style="background: white; padding: 15px; border-radius: 6px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold; color: #8b5cf6;">${new Set(data.map((d) => d.submittedBy)).size}</div>
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
  generateRecruiterSummary(data) {
    const recruiterStats = data.reduce((acc, submission) => {
      const key = submission.submittedBy;
      if (!acc[key]) {
        acc[key] = {
          name: submission.submittedBy,
          count: 0,
          consultants: /* @__PURE__ */ new Set(),
          vendors: /* @__PURE__ */ new Set()
        };
      }
      acc[key].count++;
      acc[key].consultants.add(submission.consultantName);
      acc[key].vendors.add(submission.vendorName);
      return acc;
    }, {});
    const recruiterRows = Object.values(recruiterStats).map((stats) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px; text-align: left;">
          <div style="font-weight: 600;">${stats.name}</div>
        </td>
        <td style="padding: 12px; text-align: center; font-weight: 600; color: #3b82f6;">${stats.count}</td>
        <td style="padding: 12px; text-align: center;">${stats.consultants.size}</td>
        <td style="padding: 12px; text-align: center;">${stats.vendors.size}</td>
      </tr>
    `).join("");
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
  getStatusColor(status) {
    const colors = {
      "submitted": "#3b82f6",
      "under_review": "#f59e0b",
      "interview_scheduled": "#8b5cf6",
      "hired": "#10b981",
      "rejected": "#ef4444"
    };
    return colors[status] || "#6b7280";
  }
  // Send email report
  async sendReport(config) {
    if (!sesClient) {
      console.log("AWS SES not configured - email report generated but not sent");
      return false;
    }
    try {
      const data = await this.getSubmissionsForPeriod(config.reportType);
      const htmlContent = this.generateEmailHtml(data, config.reportType);
      const reportTitle = `${config.reportType.charAt(0).toUpperCase() + config.reportType.slice(1)} Submission Report`;
      const command = new SendEmailCommand({
        Source: config.senderEmail,
        Destination: {
          ToAddresses: config.recipientEmails
        },
        Message: {
          Subject: {
            Data: `${reportTitle} - ${format(/* @__PURE__ */ new Date(), "MMMM dd, yyyy")}`,
            Charset: "UTF-8"
          },
          Body: {
            Html: {
              Data: htmlContent,
              Charset: "UTF-8"
            }
          }
        }
      });
      await sesClient.send(command);
      console.log(`${config.reportType} report sent successfully to ${config.recipientEmails.join(", ")}`);
      return true;
    } catch (error) {
      console.error(`Failed to send ${config.reportType} report:`, error);
      return false;
    }
  }
  // Generate report without sending (for testing/preview)
  async generateReportPreview(reportType) {
    const data = await this.getSubmissionsForPeriod(reportType);
    return this.generateEmailHtml(data, reportType);
  }
};

// server/routes.ts
import multer from "multer";
import path from "path";
var isAuthenticated = (req, res, next) => {
  if (req.user) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};
var upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }
  }
});
async function registerRoutes(app2) {
  await setupAuth(app2);
  app2.post("/api/test-login", async (req, res) => {
    const { userType } = req.body;
    let userId;
    if (userType === "admin") {
      userId = "admin-test-123";
    } else if (userType === "recruiter") {
      userId = "recruiter-test-456";
    } else {
      return res.status(400).json({ message: "Invalid user type" });
    }
    try {
      const user = await storage.getUser(userId);
      req.session.userId = userId;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Failed to save session" });
        }
        console.log(`Test login successful: ${userId}, session ID: ${req.session.id}`);
        res.json({ message: "Test login successful", user });
      });
    } catch (error) {
      console.error("Test login error:", error);
      res.status(500).json({ message: "Test login failed" });
    }
  });
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { timeframe, week, month, year } = req.query;
      let dateFrom;
      let dateTo;
      if (timeframe === "weekly" && week && month && year) {
        const weekNum = parseInt(week);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        const firstDayOfMonth = new Date(yearNum, monthNum - 1, 1);
        const firstDayOfWeek = new Date(firstDayOfMonth);
        firstDayOfWeek.setDate(firstDayOfWeek.getDate() + (weekNum - 1) * 7);
        dateFrom = firstDayOfWeek;
        dateTo = new Date(firstDayOfWeek);
        dateTo.setDate(dateTo.getDate() + 6);
      } else if (timeframe === "monthly" && month && year) {
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        dateFrom = new Date(yearNum, monthNum - 1, 1);
        dateTo = new Date(yearNum, monthNum, 0);
      } else if (timeframe === "yearly" && year) {
        const yearNum = parseInt(year);
        dateFrom = new Date(yearNum, 0, 1);
        dateTo = new Date(yearNum, 11, 31);
      } else {
        const now = /* @__PURE__ */ new Date();
        const dayOfWeek = now.getDay();
        dateFrom = new Date(now);
        dateFrom.setDate(now.getDate() - dayOfWeek);
        dateTo = new Date(now);
        dateTo.setDate(now.getDate() + (6 - dayOfWeek));
      }
      const stats = await storage.getDashboardStats({
        userId: user?.role === "recruiter" ? userId : void 0,
        userRole: user?.role,
        dateFrom,
        dateTo
      });
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });
  app2.get("/api/dashboard/activity", isAuthenticated, async (req, res) => {
    try {
      const now = /* @__PURE__ */ new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek2 = new Date(now);
      startOfWeek2.setDate(now.getDate() - dayOfWeek);
      const endOfWeek2 = new Date(now);
      endOfWeek2.setDate(now.getDate() + (6 - dayOfWeek));
      const activity = await storage.getWeeklyActivity(startOfWeek2, endOfWeek2);
      res.json(activity);
    } catch (error) {
      console.error("Error fetching weekly activity:", error);
      res.status(500).json({ message: "Failed to fetch weekly activity" });
    }
  });
  app2.get("/api/analytics/consultants", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { timeframe, consultantId, dateFrom, dateTo } = req.query;
      const analytics = await storage.getConsultantAnalytics({
        userId: user?.role === "recruiter" ? userId : void 0,
        userRole: user?.role,
        consultantId,
        timeframe,
        dateFrom: dateFrom ? new Date(dateFrom) : void 0,
        dateTo: dateTo ? new Date(dateTo) : void 0
      });
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching consultant analytics:", error);
      res.status(500).json({ message: "Failed to fetch consultant analytics" });
    }
  });
  app2.get("/api/analytics/recruiters", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { timeframe, dateFrom, dateTo } = req.query;
      const analytics = await storage.getRecruiterPerformance({
        userId: user?.role === "recruiter" ? userId : void 0,
        userRole: user?.role,
        timeframe,
        dateFrom: dateFrom ? new Date(dateFrom) : void 0,
        dateTo: dateTo ? new Date(dateTo) : void 0
      });
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching recruiter analytics:", error);
      res.status(500).json({ message: "Failed to fetch recruiter analytics" });
    }
  });
  app2.get("/api/analytics/submissions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { timeframe, dateFrom, dateTo } = req.query;
      const analytics = await storage.getSubmissionAnalytics({
        userId: user?.role === "recruiter" ? userId : void 0,
        userRole: user?.role,
        timeframe,
        dateFrom: dateFrom ? new Date(dateFrom) : void 0,
        dateTo: dateTo ? new Date(dateTo) : void 0
      });
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching submission analytics:", error);
      res.status(500).json({ message: "Failed to fetch submission analytics" });
    }
  });
  app2.get("/api/dashboard/recent-submissions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const submissions2 = await storage.getSubmissions({
        userId: user?.role === "recruiter" ? userId : void 0,
        userRole: user?.role
      });
      res.json(submissions2.slice(0, 4));
    } catch (error) {
      console.error("Error fetching recent submissions:", error);
      res.status(500).json({ message: "Failed to fetch recent submissions" });
    }
  });
  app2.get("/api/dashboard/follow-up-reminders", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { overdue } = req.query;
      const reminders = await storage.getFollowUpReminders({
        userId: user?.role === "recruiter" ? userId : void 0,
        userRole: user?.role,
        overdue: overdue === "true"
      });
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching follow-up reminders:", error);
      res.status(500).json({ message: "Failed to fetch follow-up reminders" });
    }
  });
  app2.get("/api/dashboard/upcoming-interviews", isAuthenticated, async (req, res) => {
    try {
      const now = /* @__PURE__ */ new Date();
      const nextWeek = new Date(now);
      nextWeek.setDate(now.getDate() + 7);
      const interviews2 = await storage.getInterviews({
        upcoming: true,
        dateFrom: now,
        dateTo: nextWeek
      });
      res.json(interviews2.slice(0, 5));
    } catch (error) {
      console.error("Error fetching upcoming interviews:", error);
      res.status(500).json({ message: "Failed to fetch upcoming interviews" });
    }
  });
  app2.get("/api/consultants", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { search, status } = req.query;
      const consultants2 = await storage.getConsultants({
        search,
        status,
        userId: user?.role === "recruiter" ? userId : void 0,
        userRole: user?.role
      });
      res.json(consultants2);
    } catch (error) {
      console.error("Error fetching consultants:", error);
      res.status(500).json({ message: "Failed to fetch consultants" });
    }
  });
  app2.get("/api/consultants/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/consultants", isAuthenticated, upload.single("resume"), async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can create consultants" });
      }
      const consultantData = {
        ...req.body,
        skills: Array.isArray(req.body.skills) ? req.body.skills : JSON.parse(req.body.skills || "[]"),
        resumeUrl: req.file ? `/uploads/${req.file.filename}` : void 0,
        resumeFileName: req.file ? req.file.originalname : void 0,
        createdBy: userId
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
  app2.put("/api/consultants/:id", isAuthenticated, upload.single("resume"), async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      if (!user || user.role !== "admin" && user.role !== "recruiter") {
        return res.status(403).json({ message: "Only admins and recruiters can edit consultants" });
      }
      const updateData = { ...req.body };
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
  app2.delete("/api/consultants/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can delete consultants" });
      }
      await storage.deleteConsultant(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting consultant:", error);
      res.status(500).json({ message: "Failed to delete consultant" });
    }
  });
  app2.get("/api/vendors", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { search, status } = req.query;
      const vendors2 = await storage.getVendors({
        search,
        status,
        userId: user?.role === "recruiter" ? userId : void 0,
        userRole: user?.role
      });
      res.json(vendors2);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      res.status(500).json({ message: "Failed to fetch vendors" });
    }
  });
  app2.get("/api/vendors/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/vendors", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const vendorData = {
        ...req.body,
        specialties: Array.isArray(req.body.specialties) ? req.body.specialties : JSON.parse(req.body.specialties || "[]"),
        recruiterId: req.body.recruiterId || userId,
        // Allow admin to assign to any recruiter, recruiter assigns to self
        createdBy: userId
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
  app2.put("/api/vendors/:id", isAuthenticated, async (req, res) => {
    try {
      const updateData = {
        ...req.body,
        specialties: Array.isArray(req.body.specialties) ? req.body.specialties : JSON.parse(req.body.specialties || "[]")
      };
      const vendor = await storage.updateVendor(req.params.id, updateData);
      res.json(vendor);
    } catch (error) {
      console.error("Error updating vendor:", error);
      res.status(500).json({ message: "Failed to update vendor" });
    }
  });
  app2.delete("/api/vendors/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteVendor(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      res.status(500).json({ message: "Failed to delete vendor" });
    }
  });
  app2.get("/api/submissions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { status, timeframe, week, month, year } = req.query;
      let dateFrom;
      let dateTo;
      if (timeframe === "weekly" && week && month && year) {
        const weekNum = parseInt(week);
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        const firstDayOfMonth = new Date(yearNum, monthNum - 1, 1);
        const firstDayOfWeek = new Date(firstDayOfMonth);
        firstDayOfWeek.setDate(firstDayOfWeek.getDate() + (weekNum - 1) * 7);
        dateFrom = firstDayOfWeek;
        dateTo = new Date(firstDayOfWeek);
        dateTo.setDate(dateTo.getDate() + 6);
      } else if (timeframe === "monthly" && month && year) {
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);
        dateFrom = new Date(yearNum, monthNum - 1, 1);
        dateTo = new Date(yearNum, monthNum, 0);
      } else if (timeframe === "yearly" && year) {
        const yearNum = parseInt(year);
        dateFrom = new Date(yearNum, 0, 1);
        dateTo = new Date(yearNum, 11, 31);
      }
      const submissions2 = await storage.getSubmissions({
        status,
        userId: user?.role === "recruiter" ? userId : void 0,
        userRole: user?.role,
        dateFrom,
        dateTo
      });
      res.json(submissions2);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });
  app2.get("/api/submissions/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/submissions", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const now = /* @__PURE__ */ new Date();
      const submissionData = {
        ...req.body,
        submissionDate: new Date(req.body.submissionDate),
        lastVendorContact: req.body.lastVendorContact ? new Date(req.body.lastVendorContact) : null,
        nextFollowUpDate: req.body.nextFollowUpDate ? new Date(req.body.nextFollowUpDate) : null,
        // Set timestamps if notes or vendor feedback are provided during creation
        notesUpdatedAt: req.body.notes ? now : null,
        vendorFeedbackUpdatedAt: req.body.vendorFeedback ? now : null,
        createdBy: userId
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
  app2.put("/api/submissions/:id", isAuthenticated, async (req, res) => {
    try {
      const currentSubmission = await storage.getSubmissionById(req.params.id);
      if (!currentSubmission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      const now = /* @__PURE__ */ new Date();
      const isStatusUpdate = Object.keys(req.body).length === 1 && req.body.status;
      let submissionData;
      if (isStatusUpdate) {
        submissionData = {
          status: req.body.status
        };
      } else {
        submissionData = {
          ...req.body,
          submissionDate: new Date(req.body.submissionDate),
          lastVendorContact: req.body.lastVendorContact ? new Date(req.body.lastVendorContact) : null,
          nextFollowUpDate: req.body.nextFollowUpDate ? new Date(req.body.nextFollowUpDate) : null,
          // Update timestamps only if the content changed
          notesUpdatedAt: req.body.notes !== currentSubmission.notes ? now : currentSubmission.notesUpdatedAt,
          vendorFeedbackUpdatedAt: req.body.vendorFeedback !== currentSubmission.vendorFeedback ? now : currentSubmission.vendorFeedbackUpdatedAt
        };
        const updateSchema = insertSubmissionSchema.omit({ createdBy: true });
        const result = updateSchema.safeParse(submissionData);
        if (!result.success) {
          console.error("Validation error:", result.error.errors);
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
  app2.delete("/api/submissions/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteSubmission(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting submission:", error);
      res.status(500).json({ message: "Failed to delete submission" });
    }
  });
  app2.get("/api/interviews", isAuthenticated, async (req, res) => {
    try {
      const { upcoming, dateFrom, dateTo, submissionId } = req.query;
      if (submissionId) {
        const interviews3 = await storage.getInterviewsForSubmission(submissionId);
        res.json(interviews3);
        return;
      }
      const interviews2 = await storage.getInterviews({
        upcoming: upcoming === "true",
        dateFrom: dateFrom ? new Date(dateFrom) : void 0,
        dateTo: dateTo ? new Date(dateTo) : void 0
      });
      res.json(interviews2);
    } catch (error) {
      console.error("Error fetching interviews:", error);
      res.status(500).json({ message: "Failed to fetch interviews" });
    }
  });
  app2.post("/api/interviews", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const interviewData = {
        ...req.body,
        interviewDate: new Date(req.body.interviewDate),
        createdBy: userId
      };
      const result = insertInterviewSchema.safeParse(interviewData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid interview data", errors: result.error.errors });
      }
      const interview = await storage.createInterview(result.data);
      await storage.updateSubmission(result.data.submissionId, {
        status: "interview_scheduled"
      });
      res.status(201).json(interview);
    } catch (error) {
      console.error("Error creating interview:", error);
      res.status(500).json({ message: "Failed to create interview" });
    }
  });
  app2.put("/api/interviews/:id", isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = { ...req.body };
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
  app2.put("/api/interviews/:id", isAuthenticated, async (req, res) => {
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
  app2.delete("/api/interviews/:id", isAuthenticated, async (req, res) => {
    try {
      await storage.deleteInterview(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting interview:", error);
      res.status(500).json({ message: "Failed to delete interview" });
    }
  });
  app2.get("/api/submissions/export", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const submissions2 = await storage.getSubmissions({
        userId: user?.role === "recruiter" ? userId : void 0,
        userRole: user?.role
      });
      const csvHeaders = [
        "Consultant Name",
        "Vendor",
        "Position",
        "Status",
        "Submission Date",
        "Notes"
      ];
      const csvRows = submissions2.map((sub) => [
        `"${sub.consultant.firstName} ${sub.consultant.lastName}"`,
        `"${sub.vendor.name}"`,
        `"${sub.positionTitle}"`,
        `"${sub.status}"`,
        sub.submissionDate.toISOString().split("T")[0],
        `"${sub.notes || ""}"`
      ]);
      const csvContent = [csvHeaders.join(","), ...csvRows.map((row) => row.join(","))].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="submissions.csv"');
      res.send(csvContent);
    } catch (error) {
      console.error("Error exporting submissions:", error);
      res.status(500).json({ message: "Failed to export submissions" });
    }
  });
  app2.get("/api/analytics/vendors", isAuthenticated, async (req, res) => {
    try {
      const { timeframe = "monthly", skill = "all" } = req.query;
      const userId = req.user.claims.sub;
      const vendorAnalytics = await storage.getVendorAnalytics(userId, timeframe, skill);
      res.json(vendorAnalytics);
    } catch (error) {
      console.error("Error fetching vendor analytics:", error);
      res.status(500).json({ message: "Failed to fetch vendor analytics" });
    }
  });
  app2.get("/api/analytics/vendor-skills", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const vendorSkillMetrics = await storage.getVendorSkillMetrics(userId);
      res.json({ vendorSkills: vendorSkillMetrics });
    } catch (error) {
      console.error("Error fetching vendor-skill metrics:", error);
      res.status(500).json({ message: "Failed to fetch vendor-skill metrics" });
    }
  });
  app2.get("/api/notifications/consultant-activity", isAuthenticated, async (req, res) => {
    try {
      const { timeframe = "weekly" } = req.query;
      const userId = req.user.claims.sub;
      const activityData = await storage.getConsultantActivityNotifications(userId, timeframe);
      res.json(activityData);
    } catch (error) {
      console.error("Error fetching consultant activity notifications:", error);
      res.status(500).json({ message: "Failed to fetch consultant activity notifications" });
    }
  });
  app2.get("/api/analytics/consultant-summary", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const consultantSummary = await storage.getConsultantSummaryStats(userId);
      res.json(consultantSummary);
    } catch (error) {
      console.error("Error fetching consultant summary:", error);
      res.status(500).json({ message: "Failed to fetch consultant summary" });
    }
  });
  const emailReportService = new EmailReportService(storage);
  app2.post("/api/reports/send", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
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
      res.json({ success, message: success ? "Report sent successfully" : "Failed to send report" });
    } catch (error) {
      console.error("Error sending report:", error);
      res.status(500).json({ message: "Failed to send report" });
    }
  });
  app2.get("/api/reports/preview/:type", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can preview reports" });
      }
      const reportType = req.params.type;
      const htmlContent = await emailReportService.generateReportPreview(reportType);
      res.setHeader("Content-Type", "text/html");
      res.send(htmlContent);
    } catch (error) {
      console.error("Error generating report preview:", error);
      res.status(500).json({ message: "Failed to generate report preview" });
    }
  });
  app2.get("/api/admin/users", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can view users" });
      }
      const users2 = await storage.getAllUsers();
      res.json(users2);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app2.post("/api/admin/users", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can create users" });
      }
      const userData = {
        ...req.body,
        isPasswordTemporary: true,
        passwordExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3)
        // 7 days from now
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
  app2.put("/api/admin/users/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
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
  app2.delete("/api/admin/users/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can delete users" });
      }
      await storage.deleteUser(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });
  app2.use("/uploads", express.static("uploads"));
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/seedData.ts
async function seedDatabase() {
  try {
    const existingConsultants = await db.select().from(consultants).limit(1);
    if (existingConsultants.length > 0) {
      console.log("Database already seeded");
      return;
    }
    console.log("Seeding database with demo data...");
    const existingUsers = await db.select().from(users).limit(1);
    const createdBy = existingUsers[0]?.id || "system";
    const createdConsultants = await db.insert(consultants).values([
      {
        firstName: "John",
        lastName: "Smith",
        email: "john.smith@email.com",
        phone: "+1-555-0101",
        position: "Senior Java Developer",
        skills: ["Java", "Spring Boot", "Microservices", "AWS"],
        experience: "8 years",
        location: "New York, NY",
        status: "active",
        resumeUrl: "/uploads/john-smith-resume.pdf",
        resumeFileName: "john-smith-resume.pdf",
        createdBy
      },
      {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@email.com",
        phone: "+1-555-0102",
        position: "React Frontend Developer",
        skills: ["React", "TypeScript", "Node.js", "GraphQL"],
        experience: "5 years",
        location: "San Francisco, CA",
        status: "active",
        resumeUrl: "/uploads/sarah-johnson-resume.pdf",
        resumeFileName: "sarah-johnson-resume.pdf",
        createdBy
      },
      {
        firstName: "Michael",
        lastName: "Chen",
        email: "michael.chen@email.com",
        phone: "+1-555-0103",
        position: "DevOps Engineer",
        skills: ["Docker", "Kubernetes", "AWS", "Terraform"],
        experience: "6 years",
        location: "Seattle, WA",
        status: "placed",
        resumeUrl: "/uploads/michael-chen-resume.pdf",
        resumeFileName: "michael-chen-resume.pdf",
        createdBy
      },
      {
        firstName: "Emily",
        lastName: "Davis",
        email: "emily.davis@email.com",
        phone: "+1-555-0104",
        position: "Python Data Scientist",
        skills: ["Python", "Machine Learning", "TensorFlow", "SQL"],
        experience: "4 years",
        location: "Boston, MA",
        status: "active",
        resumeUrl: "/uploads/emily-davis-resume.pdf",
        resumeFileName: "emily-davis-resume.pdf",
        createdBy
      }
    ]).returning();
    const createdVendors = await db.insert(vendors).values([
      {
        name: "TechCorp Solutions",
        contactPerson: "Robert Wilson",
        email: "robert.wilson@techcorp.com",
        phone: "+1-555-1001",
        location: "New York, NY",
        specialties: ["Java", "Spring Boot", "Microservices"],
        status: "active",
        notes: "Leading technology consulting firm",
        createdBy
      },
      {
        name: "InnovateTech Inc",
        contactPerson: "Lisa Anderson",
        email: "lisa.anderson@innovatetech.com",
        phone: "+1-555-1002",
        location: "San Francisco, CA",
        specialties: ["React", "AI", "Machine Learning"],
        status: "active",
        notes: "Startup focused on AI and machine learning",
        createdBy
      },
      {
        name: "CloudFirst Systems",
        contactPerson: "David Brown",
        email: "david.brown@cloudfirst.com",
        phone: "+1-555-1003",
        location: "Seattle, WA",
        specialties: ["DevOps", "AWS", "Docker", "Kubernetes"],
        status: "active",
        notes: "Cloud infrastructure and DevOps specialists",
        createdBy
      },
      {
        name: "DataDriven Analytics",
        contactPerson: "Jennifer Taylor",
        email: "jennifer.taylor@datadriven.com",
        phone: "+1-555-1004",
        location: "Boston, MA",
        specialties: ["Python", "Data Analytics", "SQL"],
        status: "pending",
        notes: "Data analytics and business intelligence",
        createdBy
      }
    ]).returning();
    const createdSubmissions = await db.insert(submissions).values([
      {
        consultantId: createdConsultants[0].id,
        vendorId: createdVendors[0].id,
        positionTitle: "Senior Java Developer",
        status: "submitted",
        submissionDate: /* @__PURE__ */ new Date("2024-01-15"),
        notes: "Great fit for their microservices project",
        createdBy
      },
      {
        consultantId: createdConsultants[1].id,
        vendorId: createdVendors[1].id,
        positionTitle: "Frontend React Developer",
        status: "under_review",
        submissionDate: /* @__PURE__ */ new Date("2024-01-18"),
        notes: "Awaiting technical interview feedback",
        createdBy
      },
      {
        consultantId: createdConsultants[2].id,
        vendorId: createdVendors[2].id,
        positionTitle: "DevOps Engineer",
        status: "interview_scheduled",
        submissionDate: /* @__PURE__ */ new Date("2024-01-20"),
        notes: "Technical interview scheduled for next week",
        createdBy
      },
      {
        consultantId: createdConsultants[3].id,
        vendorId: createdVendors[3].id,
        positionTitle: "Data Scientist",
        status: "submitted",
        submissionDate: /* @__PURE__ */ new Date("2024-01-22"),
        notes: "Resume submitted, pending initial review",
        createdBy
      }
    ]).returning();
    await db.insert(interviews).values([
      {
        submissionId: createdSubmissions[2].id,
        interviewDate: /* @__PURE__ */ new Date("2024-01-28T10:00:00"),
        interviewType: "video",
        roundType: "technical",
        status: "scheduled",
        notes: "Technical interview focusing on Kubernetes and AWS",
        createdBy
      },
      {
        submissionId: createdSubmissions[1].id,
        interviewDate: /* @__PURE__ */ new Date("2024-01-25T14:00:00"),
        interviewType: "video",
        roundType: "technical",
        status: "completed",
        notes: "Candidate performed well in coding challenge - Strong technical skills, good React knowledge",
        createdBy
      }
    ]);
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// server/scheduler.ts
import cron from "node-cron";
var ReportScheduler = class {
  emailReportService;
  isProduction;
  constructor(storage2) {
    this.emailReportService = new EmailReportService(storage2);
    this.isProduction = process.env.NODE_ENV === "production";
  }
  startSchedulers() {
    if (!this.isProduction) {
      console.log("Scheduler disabled in non-production environment");
      return;
    }
    cron.schedule("0 19 * * *", async () => {
      console.log("Running daily email report...");
      await this.sendScheduledReport("daily");
    }, {
      timezone: "America/New_York"
    });
    cron.schedule("0 19 * * 5", async () => {
      console.log("Running weekly email report...");
      await this.sendScheduledReport("weekly");
    }, {
      timezone: "America/New_York"
    });
    cron.schedule("0 19 28-31 * *", async () => {
      const today = /* @__PURE__ */ new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      if (tomorrow.getDate() === 1) {
        console.log("Running monthly email report...");
        await this.sendScheduledReport("monthly");
      }
    }, {
      timezone: "America/New_York"
    });
    console.log("Report schedulers started successfully");
  }
  async sendScheduledReport(reportType) {
    try {
      const senderEmail = process.env.SES_SENDER_EMAIL;
      const recipientEmails = process.env.REPORT_RECIPIENT_EMAILS?.split(",") || [];
      if (!senderEmail) {
        console.error("SES_SENDER_EMAIL not configured");
        return;
      }
      if (recipientEmails.length === 0) {
        console.error("REPORT_RECIPIENT_EMAILS not configured");
        return;
      }
      const success = await this.emailReportService.sendReport({
        reportType,
        recipientEmails: recipientEmails.map((email) => email.trim()),
        senderEmail
      });
      if (success) {
        console.log(`${reportType} report sent successfully to ${recipientEmails.join(", ")}`);
      } else {
        console.error(`Failed to send ${reportType} report`);
      }
    } catch (error) {
      console.error(`Error sending scheduled ${reportType} report:`, error);
    }
  }
  // Method to manually trigger reports (for testing)
  async triggerReport(reportType) {
    console.log(`Manually triggering ${reportType} report...`);
    await this.sendScheduledReport(reportType);
  }
};

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  if (app.get("env") === "development") {
    await seedDatabase();
  }
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
    if (process.env.NODE_ENV === "production") {
      const storage2 = new DatabaseStorage();
      const scheduler = new ReportScheduler(storage2);
      scheduler.startSchedulers();
    }
  });
})();

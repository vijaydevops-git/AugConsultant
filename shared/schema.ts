import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  decimal,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  username: varchar("username").unique(),
  password: varchar("password"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { length: 20 }).notNull().default("recruiter"), // admin or recruiter
  isPasswordTemporary: boolean("is_password_temporary").default(true),
  passwordExpiresAt: timestamp("password_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Consultants table
export const consultants = pgTable("consultants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull().unique(),
  phone: varchar("phone"),
  location: varchar("location"),
  position: varchar("position"),
  experience: varchar("experience"), // e.g., "3-4 years"
  skills: text("skills").array(), // Array of skills
  resumeUrl: varchar("resume_url"),
  resumeFileName: varchar("resume_file_name"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, placed, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

// Vendors table
export const vendors = pgTable("vendors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  contactPerson: varchar("contact_person"),
  email: varchar("email"),
  phone: varchar("phone"),
  location: varchar("location"),
  specialties: text("specialties").array(), // Array of specialties
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, pending, inactive
  notes: text("notes"), // Notes about the vendor
  partnershipDate: timestamp("partnership_date").defaultNow(),
  recruiterId: varchar("recruiter_id").notNull().references(() => users.id), // Point of contact recruiter
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").references(() => users.id),
});

// Submissions table
export const submissions = pgTable("submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  consultantId: varchar("consultant_id").notNull().references(() => consultants.id),
  vendorId: varchar("vendor_id").notNull().references(() => vendors.id),
  positionTitle: varchar("position_title").notNull(),
  clientName: varchar("client_name"), // Direct client name
  endClientName: varchar("end_client_name"), // End client name
  status: varchar("status", { length: 30 }).notNull().default("submitted"), // submitted, under_review, interview_scheduled, hired, rejected
  submissionDate: timestamp("submission_date").notNull(),
  lastVendorContact: timestamp("last_vendor_contact"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  vendorFeedback: text("vendor_feedback"), // Last feedback from vendor
  vendorFeedbackUpdatedAt: timestamp("vendor_feedback_updated_at"),
  notes: text("notes"),
  notesUpdatedAt: timestamp("notes_updated_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
});

// Interviews table
export const interviews = pgTable("interviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: varchar("submission_id").notNull().references(() => submissions.id),
  interviewDate: timestamp("interview_date").notNull(),
  interviewType: varchar("interview_type", { length: 20 }).notNull(), // phone, video, onsite
  roundType: varchar("round_type", { length: 30 }).notNull(), // screening, technical, manager, final, hr
  meetingLink: varchar("meeting_link"),
  location: varchar("location"),
  notes: text("notes"),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"), // scheduled, completed, cancelled, rescheduled
  // Feedback and follow-up fields
  feedback: text("feedback"),
  rating: integer("rating"), // 1-5 rating
  outcome: varchar("outcome", { length: 20 }), // pass, fail, pending
  nextSteps: text("next_steps"),
  followUpDate: timestamp("follow_up_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  consultants: many(consultants),
  vendors: many(vendors),
  assignedVendors: many(vendors),
  submissions: many(submissions),
  interviews: many(interviews),
}));

export const consultantsRelations = relations(consultants, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [consultants.createdBy],
    references: [users.id],
  }),
  submissions: many(submissions),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [vendors.createdBy],
    references: [users.id],
  }),
  recruiter: one(users, {
    fields: [vendors.recruiterId],
    references: [users.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one, many }) => ({
  consultant: one(consultants, {
    fields: [submissions.consultantId],
    references: [consultants.id],
  }),
  vendor: one(vendors, {
    fields: [submissions.vendorId],
    references: [vendors.id],
  }),
  createdBy: one(users, {
    fields: [submissions.createdBy],
    references: [users.id],
  }),
  interviews: many(interviews),
}));

export const interviewsRelations = relations(interviews, ({ one }) => ({
  submission: one(submissions, {
    fields: [interviews.submissionId],
    references: [submissions.id],
  }),
  createdBy: one(users, {
    fields: [interviews.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertConsultantSchema = createInsertSchema(consultants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVendorSchema = createInsertSchema(vendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  partnershipDate: true,
});

export const insertSubmissionSchema = createInsertSchema(submissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInterviewSchema = createInsertSchema(interviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertConsultant = z.infer<typeof insertConsultantSchema>;
export type Consultant = typeof consultants.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type Vendor = typeof vendors.$inferSelect;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissions.$inferSelect;
export type InsertInterview = z.infer<typeof insertInterviewSchema>;
export type Interview = typeof interviews.$inferSelect;

// Extended types with relations
export type SubmissionWithRelations = Submission & {
  consultant: Consultant;
  vendor: Vendor;
  recruiter: User;
  interviews?: Interview[];
};

export type ConsultantWithSubmissions = Consultant & {
  submissions?: SubmissionWithRelations[];
};

export type VendorWithSubmissions = Vendor & {
  submissions?: SubmissionWithRelations[];
};

export type VendorWithRecruiter = Vendor & {
  recruiter?: User;
  submissions?: SubmissionWithRelations[];
};

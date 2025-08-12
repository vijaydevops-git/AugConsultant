import type { 
  User, 
  Consultant, 
  Vendor, 
  Submission, 
  Interview,
  SubmissionWithRelations,
  ConsultantWithSubmissions,
  VendorWithSubmissions
} from "@shared/schema";

export type {
  User,
  Consultant,
  Vendor,
  Submission,
  Interview,
  SubmissionWithRelations,
  ConsultantWithSubmissions,
  VendorWithSubmissions,
};

export interface DashboardStats {
  submitted: number;
  pending: number;
  interviews: number;
  hired: number;
  rejected: number;
}

export interface WeeklyActivity {
  date: string;
  count: number;
}

export interface FilterOptions {
  timeframe?: 'weekly' | 'monthly' | 'yearly';
  week?: number;
  month?: number;
  year?: number;
  status?: string;
}

export interface ConsultantFilters {
  search?: string;
  status?: string;
}

export interface VendorFilters {
  search?: string;
  status?: string;
}

export const StatusColors = {
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-orange-100 text-orange-800',
  interview_scheduled: 'bg-purple-100 text-purple-800',
  hired: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
} as const;

export const StatusLabels = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  interview_scheduled: 'Interview Scheduled',
  hired: 'Hired',
  rejected: 'Rejected',
} as const;

export const ConsultantStatusColors = {
  active: 'bg-green-100 text-green-800',
  placed: 'bg-blue-100 text-blue-800',
  inactive: 'bg-gray-100 text-gray-800',
} as const;

export const VendorStatusColors = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-gray-100 text-gray-800',
} as const;

export const InterviewTypeIcons = {
  phone: 'phone',
  video: 'video',
  onsite: 'building',
} as const;

export interface SubmissionFormData {
  consultantId: string;
  vendorId: string;
  positionTitle: string;
  clientName?: string;
  endClientName?: string;
  submissionDate: string; // ISO date string
  status: string;
  lastVendorContact?: string; // ISO date string
  nextFollowUpDate?: string; // ISO date string
  vendorFeedback?: string;
  notes?: string;
}

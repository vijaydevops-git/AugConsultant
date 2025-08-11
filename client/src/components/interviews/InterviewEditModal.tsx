import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  CalendarDays, 
  Clock, 
  User, 
  Building, 
  Star, 
  CheckCircle, 
  XCircle, 
  Clock4,
  ArrowRight
} from "lucide-react";

const interviewEditSchema = z.object({
  interviewDate: z.string().min(1, "Interview date is required"),
  status: z.enum(["scheduled", "completed", "cancelled", "rescheduled"], {
    required_error: "Status is required",
  }),
  outcome: z.enum(["pass", "fail", "pending", "hired", "rejected"]).optional(),
  feedback: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  nextSteps: z.string().optional(),
  followUpDate: z.string().optional(),
});

type InterviewEditFormData = z.infer<typeof interviewEditSchema>;

interface InterviewWithSubmission {
  id: string;
  interviewDate: string;
  interviewType: 'phone' | 'video' | 'onsite';
  roundType: 'screening' | 'technical' | 'manager' | 'final' | 'hr';
  meetingLink?: string;
  location?: string;
  notes?: string;
  status: string;
  feedback?: string;
  rating?: number;
  outcome?: string;
  nextSteps?: string;
  followUpDate?: string;
  submission: {
    id: string;
    positionTitle: string;
    status: string;
    submissionDate: string;
    consultant: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
    };
    vendor: {
      name: string;
    };
  };
}

interface InterviewEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview: InterviewWithSubmission | null;
  onNavigateToSubmissions?: (consultantId: string) => void;
}

const statusColors = {
  scheduled: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800", 
  cancelled: "bg-red-100 text-red-800",
  rescheduled: "bg-yellow-100 text-yellow-800"
} as const;

const outcomeColors = {
  pass: "bg-green-100 text-green-800",
  fail: "bg-red-100 text-red-800",
  pending: "bg-yellow-100 text-yellow-800",
  hired: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800"
} as const;

export default function InterviewEditModal({ 
  open, 
  onOpenChange, 
  interview,
  onNavigateToSubmissions 
}: InterviewEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submissionStatus, setSubmissionStatus] = useState<string>("");

  const form = useForm<InterviewEditFormData>({
    resolver: zodResolver(interviewEditSchema),
    defaultValues: {
      interviewDate: "",
      status: "scheduled",
      outcome: undefined,
      feedback: "",
      rating: undefined,
      nextSteps: "",
      followUpDate: "",
    },
  });

  useEffect(() => {
    if (interview) {
      const interviewDate = new Date(interview.interviewDate);
      form.reset({
        interviewDate: format(interviewDate, "yyyy-MM-dd'T'HH:mm"),
        status: interview.status as any,
        outcome: interview.outcome as any || undefined,
        feedback: interview.feedback || "",
        rating: interview.rating || undefined,
        nextSteps: interview.nextSteps || "",
        followUpDate: interview.followUpDate ? format(new Date(interview.followUpDate), "yyyy-MM-dd") : "",
      });
      setSubmissionStatus(interview.submission.status);
    }
  }, [interview, form]);

  const updateInterviewMutation = useMutation({
    mutationFn: async (data: InterviewEditFormData) => {
      const payload = {
        ...data,
        interviewDate: new Date(data.interviewDate).toISOString(),
        followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString() : null,
      };

      const response = await apiRequest(`/api/interviews/${interview!.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update interview");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/upcoming-interviews"] });
      
      toast({
        title: "Interview Updated",
        description: "The interview has been updated successfully.",
      });
      
      onOpenChange(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update interview. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateSubmissionStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await apiRequest(`/api/submissions/${interview!.submission.id}`, {
        method: "PUT",
        body: JSON.stringify({
          ...interview!.submission,
          status: newStatus,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update submission status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Submission Status Updated",
        description: "The submission status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update submission status.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InterviewEditFormData) => {
    updateInterviewMutation.mutate(data);
    
    // Auto-update submission status based on interview outcome
    if (data.outcome === "hired" && submissionStatus !== "hired") {
      updateSubmissionStatusMutation.mutate("hired");
    } else if (data.outcome === "rejected" && submissionStatus !== "rejected") {
      updateSubmissionStatusMutation.mutate("rejected");
    }
  };

  const handleNavigateToSubmissions = () => {
    if (interview && onNavigateToSubmissions) {
      onNavigateToSubmissions(interview.submission.consultant.firstName + " " + interview.submission.consultant.lastName);
    }
  };

  if (!interview) return null;

  const interviewDate = new Date(interview.interviewDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span>Edit Interview</span>
            <Badge className={statusColors[interview.status as keyof typeof statusColors]}>
              {interview.status}
            </Badge>
            {interview.outcome && (
              <Badge className={outcomeColors[interview.outcome as keyof typeof outcomeColors]}>
                {interview.outcome}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Update interview details, status, and outcome for {interview.submission.consultant.firstName} {interview.submission.consultant.lastName}
          </DialogDescription>
        </DialogHeader>

        {/* Interview Summary Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-slate-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-600" />
                <span>Interview Summary</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNavigateToSubmissions}
                className="flex items-center space-x-1"
              >
                <ArrowRight className="h-4 w-4" />
                <span>View Submissions</span>
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Consultant</p>
                <p className="font-semibold text-slate-800">
                  {interview.submission.consultant.firstName} {interview.submission.consultant.lastName}
                </p>
                <p className="text-sm text-slate-500">{interview.submission.consultant.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Position</p>
                <p className="font-semibold text-slate-800">{interview.submission.positionTitle}</p>
                <p className="text-sm text-slate-500">at {interview.submission.vendor.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Round Type</p>
                <p className="capitalize font-medium">{interview.roundType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Interview Type</p>
                <p className="capitalize font-medium">{interview.interviewType}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Interview Date */}
              <FormField
                control={form.control}
                name="interviewDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <span>Interview Date & Time</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Interview Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Interview Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rescheduled">Rescheduled</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Interview Outcome */}
              <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Interview Outcome</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || "none"}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select outcome" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No outcome set</SelectItem>
                        <SelectItem value="pending">Pending Decision</SelectItem>
                        <SelectItem value="pass">Passed - Moving Forward</SelectItem>
                        <SelectItem value="fail">Did Not Pass</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Rating */}
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Star className="h-4 w-4" />
                      <span>Rating (1-5)</span>
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value === "0" ? undefined : parseInt(value))}
                      value={field.value?.toString() || "0"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">No rating</SelectItem>
                        <SelectItem value="1">1 - Poor</SelectItem>
                        <SelectItem value="2">2 - Below Average</SelectItem>
                        <SelectItem value="3">3 - Average</SelectItem>
                        <SelectItem value="4">4 - Good</SelectItem>
                        <SelectItem value="5">5 - Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Feedback */}
            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interview Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter detailed feedback about the interview performance..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-6">
              {/* Next Steps */}
              <FormField
                control={form.control}
                name="nextSteps"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Steps</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What are the next steps for this candidate?"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Follow-up Date */}
              <FormField
                control={form.control}
                name="followUpDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Clock4 className="h-4 w-4" />
                      <span>Follow-up Date</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={updateInterviewMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateInterviewMutation.isPending}
              >
                {updateInterviewMutation.isPending ? "Updating..." : "Update Interview"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
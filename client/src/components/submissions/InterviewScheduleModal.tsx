import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Calendar, Clock, Video, Phone, Building, User, Mail, MapPin, Briefcase, CalendarCheck, AlertCircle, Copy } from "lucide-react";
import { format, addDays } from "date-fns";
import type { SubmissionWithRelations, Interview } from "@/lib/types";

const interviewSchema = z.object({
  interviewDate: z.string().min(1, "Interview date is required"),
  interviewTime: z.string().min(1, "Interview time is required"),
  interviewType: z.enum(["phone", "video", "onsite"], { required_error: "Interview type is required" }),
  roundType: z.enum(["screening", "technical", "manager", "final", "hr"], { required_error: "Round type is required" }),
  meetingLink: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  location: z.string().optional(),
  notes: z.string().optional(),
  duration: z.string().default("60"),
});

type InterviewFormData = z.infer<typeof interviewSchema>;

interface InterviewScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: SubmissionWithRelations | null;
}

const getTimeSlots = () => {
  const slots = [];
  for (let hour = 8; hour <= 18; hour++) {
    for (let minute of [0, 30]) {
      const time24 = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const time12 = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
      slots.push({ value: time24, label: time12 });
    }
  }
  return slots;
};

const getDurationOptions = () => [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
];

export default function InterviewScheduleModal({ 
  open, 
  onOpenChange, 
  submission 
}: InterviewScheduleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check for existing interviews for this submission
  const { data: existingInterviews = [] } = useQuery<Interview[]>({
    queryKey: ["/api/interviews", submission?.id],
    queryFn: async () => {
      if (!submission?.id) return [];
      const response = await fetch(`/api/interviews?submissionId=${submission.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch interviews');
      return response.json();
    },
    enabled: open && !!submission?.id,
  });

  const form = useForm<InterviewFormData>({
    resolver: zodResolver(interviewSchema),
    defaultValues: {
      interviewDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
      interviewTime: "10:00",
      interviewType: "video",
      roundType: "screening",
      meetingLink: "",
      location: "",
      notes: "",
      duration: "60",
    },
  });

  const watchedInterviewType = form.watch("interviewType");

  useEffect(() => {
    if (open && submission) {
      // Reset form when modal opens
      form.reset({
        interviewDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        interviewTime: "10:00",
        interviewType: "video",
        roundType: "screening",
        meetingLink: "",
        location: "",
        notes: "",
        duration: "60",
      });
    }
  }, [open, submission, form]);

  const createInterviewMutation = useMutation({
    mutationFn: async (data: InterviewFormData) => {
      if (!submission) throw new Error("No submission selected");
      
      // Combine date and time
      const interviewDateTime = new Date(`${data.interviewDate}T${data.interviewTime}`);
      
      const interviewData = {
        submissionId: submission.id,
        interviewDate: interviewDateTime.toISOString(),
        interviewType: data.interviewType,
        roundType: data.roundType,
        meetingLink: data.meetingLink || undefined,
        location: data.location || undefined,
        notes: data.notes || undefined,
      };
      
      const response = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(interviewData),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to schedule interview');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/upcoming-interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      
      toast({
        title: "Interview Scheduled",
        description: "The interview has been scheduled and submission status updated.",
      });
      
      onOpenChange(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Scheduling Failed",
        description: "There was an error scheduling the interview.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InterviewFormData) => {
    createInterviewMutation.mutate(data);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  const copyToClipboard = async (text: string, description: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${description} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CalendarCheck className="h-5 w-5 text-primary" />
            <span>Schedule Interview</span>
          </DialogTitle>
          <DialogDescription>
            Schedule a new interview for the consultant submission
          </DialogDescription>
        </DialogHeader>
        
        {submission && (
          <>
            {/* Submission Summary */}
            <Card className="bg-gradient-to-r from-blue-50 to-slate-50 dark:from-blue-950 dark:to-slate-950">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <span>Submission Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {getInitials(submission.consultant.firstName, submission.consultant.lastName)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {submission.consultant.firstName} {submission.consultant.lastName}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center space-x-1">
                        <Mail className="h-3 w-3" />
                        <span>{submission.consultant.email}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => copyToClipboard(submission.consultant.email, "Email")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {submission.vendor.name}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {submission.positionTitle}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Submitted {format(new Date(submission.submissionDate), 'MMM d, yyyy')}</span>
                  </Badge>
                  {submission.recruiter && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                      <User className="h-4 w-4" />
                      <span>By {submission.recruiter.firstName} {submission.recruiter.lastName}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Existing Interviews */}
            {existingInterviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <span>Previous Interviews</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {existingInterviews.map((interview: any, index: number) => {
                      const interviewDate = new Date(interview.interviewDate);
                      const isUpcoming = interviewDate > new Date();
                      return (
                        <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {interview.interviewType === 'video' && <Video className="h-4 w-4 text-blue-600" />}
                            {interview.interviewType === 'phone' && <Phone className="h-4 w-4 text-green-600" />}
                            {interview.interviewType === 'onsite' && <MapPin className="h-4 w-4 text-purple-600" />}
                            <div>
                              <p className="font-medium text-sm">{interview.roundType} - {interview.interviewType}</p>
                              <p className="text-xs text-slate-600 dark:text-slate-400">
                                {format(interviewDate, 'MMM d, yyyy h:mm a')}
                              </p>
                            </div>
                          </div>
                          <Badge variant={isUpcoming ? "default" : "secondary"}>
                            {isUpcoming ? "Upcoming" : "Completed"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interview Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schedule New Interview</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* Date and Time Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="interviewDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>Interview Date</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                min={format(new Date(), 'yyyy-MM-dd')}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="interviewTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>Time</span>
                            </FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-48">
                                {getTimeSlots().map((slot) => (
                                  <SelectItem key={slot.value} value={slot.value}>
                                    {slot.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Type and Round Row */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="interviewType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Interview Type</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="phone">📞 Phone Call</SelectItem>
                                <SelectItem value="video">🎥 Video Meeting</SelectItem>
                                <SelectItem value="onsite">🏢 On-site</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="roundType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Interview Round</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="screening">📋 Initial Screening</SelectItem>
                                <SelectItem value="technical">💻 Technical Round</SelectItem>
                                <SelectItem value="manager">👔 Manager Round</SelectItem>
                                <SelectItem value="final">🎯 Final Round</SelectItem>
                                <SelectItem value="hr">👥 HR Round</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Duration */}
                    <FormField
                      control={form.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getDurationOptions().map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Meeting Link for Video Interviews */}
                    {watchedInterviewType === 'video' && (
                      <FormField
                        control={form.control}
                        name="meetingLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-1">
                              <Video className="h-4 w-4" />
                              <span>Meeting Link</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://zoom.us/j/... or Teams link"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Location for On-site Interviews */}
                    {watchedInterviewType === 'onsite' && (
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center space-x-1">
                              <MapPin className="h-4 w-4" />
                              <span>Location</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Office address or meeting room"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Notes */}
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any special instructions, requirements, or notes about this interview..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={createInterviewMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createInterviewMutation.isPending}
                        className="min-w-[120px]"
                      >
                        {createInterviewMutation.isPending ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Scheduling...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <CalendarCheck className="h-4 w-4" />
                            <span>Schedule Interview</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
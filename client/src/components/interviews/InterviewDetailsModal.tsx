import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  MapPin, 
  User, 
  Building, 
  Mail, 
  Copy,
  MessageSquare,
  Bell,
  Star,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { format, parseISO } from "date-fns";

const feedbackSchema = z.object({
  rating: z.string().min(1, "Rating is required"),
  feedback: z.string().min(10, "Feedback must be at least 10 characters"),
  outcome: z.enum(["pass", "fail", "pending"], { required_error: "Outcome is required" }),
  nextSteps: z.string().optional(),
  followUpDate: z.string().optional(),
});

type FeedbackFormData = z.infer<typeof feedbackSchema>;

interface InterviewWithDetails {
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
      skills: string[];
    };
    vendor: {
      name: string;
      contactEmail?: string;
    };
  };
}

interface InterviewDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview: InterviewWithDetails | null;
}

export default function InterviewDetailsModal({ 
  open, 
  onOpenChange, 
  interview 
}: InterviewDetailsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("details");

  const form = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: interview?.rating?.toString() || "",
      feedback: interview?.feedback || "",
      outcome: interview?.outcome as "pass" | "fail" | "pending" || "pending",
      nextSteps: interview?.nextSteps || "",
      followUpDate: interview?.followUpDate ? format(parseISO(interview.followUpDate), 'yyyy-MM-dd') : "",
    },
  });

  const updateInterviewMutation = useMutation({
    mutationFn: async (data: FeedbackFormData) => {
      if (!interview) throw new Error("No interview selected");
      
      const updateData = {
        rating: parseInt(data.rating),
        feedback: data.feedback,
        outcome: data.outcome,
        nextSteps: data.nextSteps || undefined,
        followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString() : undefined,
      };
      
      const response = await fetch(`/api/interviews/${interview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update interview');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interviews"] });
      toast({
        title: "Interview Updated",
        description: "Interview feedback and follow-up information has been saved.",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "There was an error updating the interview.",
        variant: "destructive",
      });
    },
  });

  const onSubmitFeedback = (data: FeedbackFormData) => {
    updateInterviewMutation.mutate(data);
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

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-5 w-5 text-blue-600" />;
      case 'phone': return <Phone className="h-5 w-5 text-green-600" />;
      case 'onsite': return <MapPin className="h-5 w-5 text-purple-600" />;
      default: return <Calendar className="h-5 w-5" />;
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'pass': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Pass</Badge>;
      case 'fail': return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"><XCircle className="h-3 w-3 mr-1" />Fail</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
      default: return null;
    }
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  if (!interview) return null;

  const interviewDate = parseISO(interview.interviewDate);
  const isUpcoming = interviewDate > new Date();
  const submissionDate = parseISO(interview.submission.submissionDate);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            {getInterviewTypeIcon(interview.interviewType)}
            <span>Interview Details</span>
            {interview.outcome && getOutcomeBadge(interview.outcome)}
          </DialogTitle>
          <DialogDescription>
            {interview.roundType.charAt(0).toUpperCase() + interview.roundType.slice(1)} round interview for {interview.submission.consultant.firstName} {interview.submission.consultant.lastName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Interview Details</TabsTrigger>
            <TabsTrigger value="feedback">Feedback & Rating</TabsTrigger>
            <TabsTrigger value="followup">Follow-up Actions</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            {/* Interview Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span>Interview Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Date & Time</p>
                    <p className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span>{format(interviewDate, 'EEEE, MMMM d, yyyy')}</span>
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 ml-6">
                      {format(interviewDate, 'h:mm a')}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Interview Type</p>
                    <div className="flex items-center space-x-2">
                      {getInterviewTypeIcon(interview.interviewType)}
                      <span className="capitalize">{interview.interviewType}</span>
                    </div>
                  </div>
                </div>

                {interview.meetingLink && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Meeting Link</p>
                    <div className="flex items-center space-x-2">
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <a 
                        href={interview.meetingLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Join Meeting
                      </a>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(interview.meetingLink!, "Meeting link")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {interview.location && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Location</p>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-purple-600" />
                      <span>{interview.location}</span>
                    </div>
                  </div>
                )}

                {interview.notes && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Notes</p>
                    <p className="text-sm bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
                      {interview.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consultant Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-green-600" />
                  <span>Consultant Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">
                      {interview.submission.consultant.firstName} {interview.submission.consultant.lastName}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                      <Mail className="h-4 w-4" />
                      <span>{interview.submission.consultant.email}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => copyToClipboard(interview.submission.consultant.email, "Email")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {interview.submission.consultant.phone && (
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                        <Phone className="h-4 w-4" />
                        <span>{interview.submission.consultant.phone}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Position</p>
                    <p className="font-semibold">{interview.submission.positionTitle}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">@ {interview.submission.vendor.name}</p>
                  </div>
                </div>
                
                {interview.submission.consultant.skills && interview.submission.consultant.skills.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {interview.submission.consultant.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <span>Interview Feedback</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {interview.feedback && interview.rating ? (
                  <div className="space-y-4">
                    {/* Existing Feedback Display */}
                    <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Rating:</span>
                        <div className="flex space-x-1">
                          {getRatingStars(interview.rating)}
                        </div>
                        <span className="text-sm text-slate-600">({interview.rating}/5)</span>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Feedback:</span>
                        <p className="text-sm">{interview.feedback}</p>
                      </div>
                      
                      {interview.outcome && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Outcome:</span>
                          {getOutcomeBadge(interview.outcome)}
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab("followup")}
                      className="w-full"
                    >
                      Update Feedback
                    </Button>
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmitFeedback)} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="rating"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rating (1-5)</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select rating" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1">⭐ 1 - Poor</SelectItem>
                                  <SelectItem value="2">⭐⭐ 2 - Below Average</SelectItem>
                                  <SelectItem value="3">⭐⭐⭐ 3 - Average</SelectItem>
                                  <SelectItem value="4">⭐⭐⭐⭐ 4 - Good</SelectItem>
                                  <SelectItem value="5">⭐⭐⭐⭐⭐ 5 - Excellent</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="outcome"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Interview Outcome</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="pending">📋 Pending Decision</SelectItem>
                                  <SelectItem value="pass">✅ Passed</SelectItem>
                                  <SelectItem value="fail">❌ Failed</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="feedback"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Detailed Feedback</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Provide detailed feedback about the candidate's performance, technical skills, communication, and overall assessment..."
                                className="min-h-[120px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => onOpenChange(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          disabled={updateInterviewMutation.isPending}
                        >
                          {updateInterviewMutation.isPending ? "Saving..." : "Save Feedback"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="followup" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5 text-orange-600" />
                  <span>Follow-up Actions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmitFeedback)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="nextSteps"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Next Steps</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="What are the next steps? Schedule another round, send feedback to vendor, etc..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="followUpDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Follow-up Date</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              min={format(new Date(), 'yyyy-MM-dd')}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end space-x-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                      >
                        Close
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateInterviewMutation.isPending}
                      >
                        {updateInterviewMutation.isPending ? "Saving..." : "Save Follow-up"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
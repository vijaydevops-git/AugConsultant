import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Calendar, 
  MoreHorizontal, 
  Video, 
  Phone, 
  Building, 
  Copy, 
  Clock, 
  PhoneCall, 
  Edit, 
  ChevronDown, 
  ChevronRight, 
  MessageSquare,
  FileText 
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { StatusColors, StatusLabels } from "@/lib/types";
import type { SubmissionWithRelations, Interview } from "@/lib/types";
import InterviewScheduleModal from "./InterviewScheduleModal";
import FollowUpModal from "./FollowUpModal";

interface SubmissionListProps {
  searchQuery: string;
  onEditSubmission: (submission: SubmissionWithRelations) => void;
  initialStatusFilter?: string;
}

export default function SubmissionList({ searchQuery, onEditSubmission, initialStatusFilter = "" }: SubmissionListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  
  // Update status filter when initialStatusFilter changes (from URL params)
  useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithRelations | null>(null);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedFollowUpSubmission, setSelectedFollowUpSubmission] = useState<SubmissionWithRelations | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data: submissions, isLoading } = useQuery<SubmissionWithRelations[]>({
    queryKey: ["/api/submissions"],
    staleTime: 0, // Always consider data stale to force fresh fetches
  });

  const { data: interviews = [] } = useQuery<Interview[]>({
    queryKey: ["/api/interviews"],
  });

  const { data: user } = useQuery<{ role: string }>({ queryKey: ["/api/auth/user"] });
  const isAdmin = user?.role === "admin";

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest("PUT", `/api/submissions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      toast({
        title: "Success",
        description: "Submission status updated successfully.",
      });
    },
    onError: (error: any) => {
      if (error.status === 401 || error.status === 403) {
        toast({
          title: "Session Expired",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Update Failed",
        description: "There was an error updating the submission status.",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const handleScheduleInterview = (submission: SubmissionWithRelations) => {
    setSelectedSubmission(submission);
    setIsInterviewModalOpen(true);
  };

  const handleUpdateFollowUp = (submission: SubmissionWithRelations) => {
    setSelectedFollowUpSubmission(submission);
    setIsFollowUpModalOpen(true);
  };

  const toggleExpanded = (submissionId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(submissionId)) {
      newExpanded.delete(submissionId);
    } else {
      newExpanded.add(submissionId);
    }
    setExpandedRows(newExpanded);
  };

  const getInterviewForSubmission = (submissionId: string): Interview | undefined => {
    return interviews.find(interview => interview.submissionId === submissionId);
  };

  const getInterviewIcon = (type: string) => {
    switch (type) {
      case 'phone': return Phone;
      case 'video': return Video;
      case 'onsite': return Building;
      default: return Phone;
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    });
  };

  const joinInterview = (link: string) => {
    window.open(link, '_blank');
  };

  const handleStatusChange = (submission: SubmissionWithRelations, newStatus: string) => {
    // If the new status is "interview_scheduled", first open the interview modal
    if (newStatus === 'interview_scheduled') {
      setSelectedSubmission(submission);
      setIsInterviewModalOpen(true);
      return; // Don't update status yet - wait for interview to be scheduled
    }
    
    // For other statuses, update directly
    updateStatusMutation.mutate({ id: submission.id, status: newStatus });
  };

  const filteredSubmissions = submissions?.filter(submission => {
    const consultantName = `${submission.consultant?.firstName || ''} ${submission.consultant?.lastName || ''}`.trim();
    const vendorName = submission.vendor?.name || '';
    const positionTitle = submission.positionTitle || '';
    
    const matchesSearch = !searchQuery || 
      consultantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      positionTitle.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === 'all' || submission.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-32"></div>
                </div>
                <div className="h-6 bg-slate-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">All Submissions</h3>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No submissions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => {
                const isExpanded = expandedRows.has(submission.id);
                const hasNotesOrFeedback = submission.notes || submission.vendorFeedback;

                return (
                  <Card key={submission.id} className="border">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-12 gap-3 items-center">
                        {/* Consultant Info */}
                        <div className="col-span-2 flex items-center gap-2">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-slate-600">
                              {submission.consultant.firstName?.charAt(0) || 'N'}{submission.consultant.lastName?.charAt(0) || 'A'}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-800 truncate">
                              {submission.consultant.firstName || 'Unknown'} {submission.consultant.lastName || 'Consultant'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{submission.consultant.email || 'No email'}</p>
                          </div>
                        </div>

                        {/* Position & Vendor */}
                        <div className="col-span-3 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{submission.positionTitle}</p>
                          <p className="text-xs text-slate-500 truncate">at {submission.vendor.name}</p>
                        </div>

                        {/* Status */}
                        <div className="col-span-2 flex justify-center">
                          <Select
                            value={submission.status}
                            onValueChange={(value) => handleStatusChange(submission, value)}
                          >
                            <SelectTrigger className="w-auto h-7 px-2 text-xs">
                              <Badge className={StatusColors[submission.status as keyof typeof StatusColors]}>
                                {StatusLabels[submission.status as keyof typeof StatusLabels]}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="pending_review">Pending Review</SelectItem>
                              <SelectItem value="under_review">Under Review</SelectItem>
                              <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                              <SelectItem value="hired">Hired</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date */}
                        <div className="col-span-1 text-xs text-slate-500 text-center">
                          {formatDate(submission.submissionDate.toString())}
                        </div>

                        {/* Actions */}
                        <div className="col-span-4 flex justify-end items-center gap-2">
                          {/* Interview Status Display */}
                          {submission.status === 'interview_scheduled' && (() => {
                            const interview = getInterviewForSubmission(submission.id);
                            if (interview) {
                              const Icon = getInterviewIcon(interview.interviewType);
                              const interviewDate = new Date(interview.interviewDate);
                              const isUpcoming = interviewDate > new Date();
                              
                              return (
                                <div className="flex items-center gap-1">
                                  <div className="flex items-center bg-slate-50 px-2 py-1 rounded text-xs">
                                    <Icon className="h-3 w-3 text-slate-500" />
                                    <span className="text-slate-600 ml-1 text-xs">
                                      {isToday(interviewDate) ? 'Today' : format(interviewDate, 'MMM d')}
                                    </span>
                                  </div>
                                  
                                  {interview.meetingLink && isUpcoming && (
                                    <Button
                                      size="sm"
                                      onClick={() => joinInterview(interview.meetingLink!)}
                                      className="h-6 px-3 text-xs"
                                    >
                                      Join
                                    </Button>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {/* Primary Action Button */}
                          {submission.status !== 'interview_scheduled' && submission.status !== 'hired' && submission.status !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleScheduleInterview(submission)}
                              className="h-6 px-3 text-xs whitespace-nowrap"
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              Schedule
                            </Button>
                          )}
                          
                          {/* Secondary Action Button */}
                          {submission.status !== 'hired' && submission.status !== 'rejected' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateFollowUp(submission)}
                              className="h-6 px-3 text-xs whitespace-nowrap"
                            >
                              <PhoneCall className="h-3 w-3 mr-1" />
                              Follow-up
                            </Button>
                          )}
                          
                          {/* Edit Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditSubmission(submission)}
                            className="h-6 px-3 text-xs whitespace-nowrap"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>

                          {/* Expand Button for Notes/Feedback */}
                          {hasNotesOrFeedback && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => toggleExpanded(submission.id)}
                              className="h-6 w-6 p-0 ml-1"
                              title={isExpanded ? "Hide details" : "Show notes/feedback"}
                            >
                              {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && hasNotesOrFeedback && (
                        <div className="mt-4 pt-4 border-t space-y-4">
                          {submission.notes && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <FileText className="h-4 w-4 text-slate-500" />
                                  <h4 className="font-semibold text-slate-700">Notes</h4>
                                </div>
                                {(submission as any).notesUpdatedAt && (
                                  <span className="text-xs text-slate-400">
                                    Updated {format(new Date((submission as any).notesUpdatedAt), 'MMM d, yyyy h:mm a')}
                                  </span>
                                )}
                              </div>
                              <div className="bg-slate-50 p-3 rounded border">
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">{submission.notes}</p>
                              </div>
                            </div>
                          )}
                          
                          {submission.vendorFeedback && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                  <MessageSquare className="h-4 w-4 text-blue-500" />
                                  <h4 className="font-semibold text-slate-700">Vendor Feedback</h4>
                                </div>
                                {submission.vendorFeedbackUpdatedAt && (
                                  <span className="text-xs text-slate-400">
                                    Updated {format(new Date(submission.vendorFeedbackUpdatedAt), 'MMM d, yyyy h:mm a')}
                                  </span>
                                )}
                              </div>
                              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                                <p className="text-sm text-slate-600 whitespace-pre-wrap">{submission.vendorFeedback}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <InterviewScheduleModal
        open={isInterviewModalOpen}
        onOpenChange={setIsInterviewModalOpen}
        submission={selectedSubmission}
      />
      
      <FollowUpModal
        open={isFollowUpModalOpen}
        onOpenChange={setIsFollowUpModalOpen}
        submission={selectedFollowUpSubmission}
      />
    </>
  );
}
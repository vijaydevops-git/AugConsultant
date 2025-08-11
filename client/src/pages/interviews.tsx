import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import InterviewDetailsModal from "@/components/interviews/InterviewDetailsModal";
import InterviewEditModal from "@/components/interviews/InterviewEditModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  Clock, 
  Video, 
  Phone, 
  MapPin, 
  User, 
  Building, 
  Search,
  Filter,
  CalendarDays,
  TrendingUp,
  Users,
  CheckCircle2,
  Edit,
  ArrowRight,
  Star,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format, isToday, isTomorrow, isThisWeek, parseISO } from "date-fns";

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
      skills: string[];
    };
    vendor: {
      name: string;
      contactEmail?: string;
    };
  };
}

export default function InterviewsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRound, setFilterRound] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  const [selectedInterview, setSelectedInterview] = useState<InterviewWithSubmission | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: interviews = [], isLoading } = useQuery<InterviewWithSubmission[]>({
    queryKey: ["/api/interviews"],
  });

  // Filter interviews based on search and filters
  const filteredInterviews = interviews.filter((interview) => {
    const searchMatch = 
      interview.submission.consultant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.submission.consultant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.submission.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      interview.submission.positionTitle.toLowerCase().includes(searchTerm.toLowerCase());

    const typeMatch = filterType === "all" || interview.interviewType === filterType;
    const roundMatch = filterRound === "all" || interview.roundType === filterRound;

    const interviewDate = parseISO(interview.interviewDate);
    let dateMatch = true;
    if (filterDate === "today") dateMatch = isToday(interviewDate);
    else if (filterDate === "tomorrow") dateMatch = isTomorrow(interviewDate);
    else if (filterDate === "week") dateMatch = isThisWeek(interviewDate);
    else if (filterDate === "upcoming") dateMatch = interviewDate > new Date();
    else if (filterDate === "past") dateMatch = interviewDate < new Date();

    return searchMatch && typeMatch && roundMatch && dateMatch;
  });

  // Group interviews by status
  const upcomingInterviews = filteredInterviews.filter(i => parseISO(i.interviewDate) > new Date());
  const pastInterviews = filteredInterviews.filter(i => parseISO(i.interviewDate) < new Date());

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4 text-blue-600" />;
      case 'phone': return <Phone className="h-4 w-4 text-green-600" />;
      case 'onsite': return <MapPin className="h-4 w-4 text-purple-600" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const getInterviewTypeColor = (type: string) => {
    switch (type) {
      case 'video': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'phone': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'onsite': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  const getRoundTypeColor = (type: string) => {
    switch (type) {
      case 'screening': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'technical': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'manager': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'final': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'hr': return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300';
    }
  };

  const formatRelativeDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (date.getTime() < new Date().getTime() && date.getTime() > new Date().getTime() - 24 * 60 * 60 * 1000) {
      return "Yesterday";
    }
    return format(date, 'MMM d, yyyy');
  };

  const openDetailsModal = (interview: InterviewWithSubmission) => {
    setSelectedInterview(interview);
    setDetailsModalOpen(true);
  };

  const openEditModal = (interview: InterviewWithSubmission) => {
    setSelectedInterview(interview);
    setEditModalOpen(true);
  };

  const navigateToSubmissions = (consultantName?: string) => {
    if (consultantName) {
      setLocation(`/submissions?search=${encodeURIComponent(consultantName)}`);
    } else {
      setLocation('/submissions');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Interview Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Track and manage all consultant interviews across your recruitment pipeline
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <CalendarDays className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {interviews.length}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Interviews</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {upcomingInterviews.length}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Upcoming</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {new Set(interviews.map(i => i.submission.consultant.email)).size}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Unique Consultants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {pastInterviews.length}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search consultants, vendors, or positions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterRound} onValueChange={setFilterRound}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rounds</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="hr">HR</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterDate} onValueChange={setFilterDate}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="tomorrow">Tomorrow</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span>Upcoming Interviews ({upcomingInterviews.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingInterviews
                .sort((a, b) => parseISO(a.interviewDate).getTime() - parseISO(b.interviewDate).getTime())
                .map((interview) => {
                  const interviewDate = parseISO(interview.interviewDate);
                  return (
                    <div 
                      key={interview.id} 
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div 
                        className="flex items-center space-x-4 cursor-pointer flex-grow"
                        onClick={() => openDetailsModal(interview)}
                      >
                        <div className="flex items-center space-x-2">
                          {getInterviewTypeIcon(interview.interviewType)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {interview.submission.consultant.firstName} {interview.submission.consultant.lastName}
                              </p>
                              {interview.status && (
                                <Badge variant="outline" className="text-xs">
                                  {interview.status}
                                </Badge>
                              )}
                              {interview.outcome && (
                                <Badge 
                                  className={`text-xs ${
                                    interview.outcome === 'hired' ? 'bg-emerald-100 text-emerald-800' :
                                    interview.outcome === 'rejected' ? 'bg-red-100 text-red-800' :
                                    interview.outcome === 'pass' ? 'bg-green-100 text-green-800' :
                                    interview.outcome === 'fail' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {interview.outcome}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {interview.submission.positionTitle} @ {interview.submission.vendor.name}
                              </p>
                              {interview.rating && (
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  <span className="text-xs text-slate-600">{interview.rating}/5</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {formatRelativeDate(interviewDate)}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {format(interviewDate, 'h:mm a')}
                          </p>
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          <Badge className={`text-xs ${getInterviewTypeColor(interview.interviewType)}`}>
                            {interview.interviewType}
                          </Badge>
                          <Badge className={`text-xs ${getRoundTypeColor(interview.roundType)}`}>
                            {interview.roundType}
                          </Badge>
                        </div>

                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToSubmissions(`${interview.submission.consultant.firstName} ${interview.submission.consultant.lastName}`);
                            }}
                            className="h-8 w-8 p-0"
                            title="View submissions"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(interview);
                            }}
                            className="h-8 w-8 p-0"
                            title="Edit interview"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Interviews */}
      {pastInterviews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-slate-600" />
              <span>Completed Interviews ({pastInterviews.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastInterviews
                .sort((a, b) => parseISO(b.interviewDate).getTime() - parseISO(a.interviewDate).getTime())
                .slice(0, 10) // Show only recent 10
                .map((interview) => {
                  const interviewDate = parseISO(interview.interviewDate);
                  return (
                    <div 
                      key={interview.id} 
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg opacity-75 hover:opacity-100 transition-opacity"
                    >
                      <div 
                        className="flex items-center space-x-4 cursor-pointer flex-grow"
                        onClick={() => openDetailsModal(interview)}
                      >
                        <div className="flex items-center space-x-2">
                          {getInterviewTypeIcon(interview.interviewType)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-slate-900 dark:text-slate-100">
                                {interview.submission.consultant.firstName} {interview.submission.consultant.lastName}
                              </p>
                              {interview.status && (
                                <Badge variant="outline" className="text-xs">
                                  {interview.status}
                                </Badge>
                              )}
                              {interview.outcome && (
                                <Badge 
                                  className={`text-xs ${
                                    interview.outcome === 'hired' ? 'bg-emerald-100 text-emerald-800' :
                                    interview.outcome === 'rejected' ? 'bg-red-100 text-red-800' :
                                    interview.outcome === 'pass' ? 'bg-green-100 text-green-800' :
                                    interview.outcome === 'fail' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {interview.outcome}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {interview.submission.positionTitle} @ {interview.submission.vendor.name}
                              </p>
                              {interview.rating && (
                                <div className="flex items-center space-x-1">
                                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  <span className="text-xs text-slate-600">{interview.rating}/5</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {formatRelativeDate(interviewDate)}
                          </p>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {format(interviewDate, 'h:mm a')}
                          </p>
                        </div>
                        
                        <div className="flex flex-col space-y-1">
                          <Badge variant="outline" className="text-xs">
                            {interview.interviewType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {interview.roundType}
                          </Badge>
                        </div>

                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateToSubmissions(`${interview.submission.consultant.firstName} ${interview.submission.consultant.lastName}`);
                            }}
                            className="h-8 w-8 p-0"
                            title="View submissions"
                          >
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(interview);
                            }}
                            className="h-8 w-8 p-0"
                            title="Edit interview"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {filteredInterviews.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarDays className="h-16 w-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              No interviews found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {interviews.length === 0
                ? "No interviews have been scheduled yet."
                : "No interviews match your current filters."
              }
            </p>
            {searchTerm || filterType !== "all" || filterRound !== "all" || filterDate !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                  setFilterRound("all");
                  setFilterDate("all");
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Interview Details Modal */}
      <InterviewDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        interview={selectedInterview}
      />

      {/* Interview Edit Modal */}
      <InterviewEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        interview={selectedInterview}
        onNavigateToSubmissions={navigateToSubmissions}
      />
    </div>
  );
}
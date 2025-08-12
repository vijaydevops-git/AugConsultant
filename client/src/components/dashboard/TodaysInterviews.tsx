import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Video, Building, Copy, Clock, AlertCircle } from "lucide-react";
import { format, isToday, differenceInMinutes, differenceInHours } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Interview } from "@/lib/types";

interface InterviewWithRelations extends Interview {
  submission?: {
    consultant: {
      firstName: string;
      lastName: string;
      phone?: string;
      email: string;
    };
    vendor: {
      name: string;
    };
    positionTitle: string;
  };
}

export default function TodaysInterviews() {
  const { toast } = useToast();
  
  const { data: allInterviews = [], isLoading } = useQuery<InterviewWithRelations[]>({
    queryKey: ["/api/dashboard/upcoming-interviews"],
  });

  // Filter for this week's interviews
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Start of current week (Sunday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // End of current week (Saturday)
  
  const weekInterviews = allInterviews.filter(interview => {
    const interviewDate = new Date(interview.interviewDate);
    return interviewDate >= startOfWeek && interviewDate <= endOfWeek;
  }).sort((a, b) => 
    new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime()
  );

  const getInterviewIcon = (type: string) => {
    switch (type) {
      case 'phone': return Phone;
      case 'video': return Video;
      case 'onsite': return Building;
      default: return Phone;
    }
  };

  const getUrgencyStatus = (dateString: string) => {
    const interviewTime = new Date(dateString);
    const now = new Date();
    const minutesUntil = differenceInMinutes(interviewTime, now);
    const hoursUntil = differenceInHours(interviewTime, now);
    
    if (minutesUntil < 0) {
      return { 
        label: 'In Progress', 
        color: 'bg-green-100 text-green-700 border-green-200',
        urgency: 'current'
      };
    } else if (minutesUntil <= 15) {
      return { 
        label: `${minutesUntil} min`, 
        color: 'bg-red-100 text-red-700 border-red-200',
        urgency: 'urgent'
      };
    } else if (hoursUntil <= 2) {
      return { 
        label: `${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`, 
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        urgency: 'soon'
      };
    } else {
      return { 
        label: 'Scheduled', 
        color: 'bg-blue-100 text-blue-700 border-blue-200',
        urgency: 'scheduled'
      };
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

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-slate-200 rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-32 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <Clock className="h-5 w-5 mr-2" />
          This Week Scheduled Interviews
        </CardTitle>
        <Badge variant="outline" className="text-xs">
          {weekInterviews.length} scheduled
        </Badge>
      </CardHeader>
      <CardContent>
        {weekInterviews.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No interviews scheduled this week</p>
            <p className="text-xs text-slate-400 mt-1">You can focus on other tasks</p>
          </div>
        ) : (
          <div className="space-y-3">
            {weekInterviews.map((interview) => {
              const Icon = getInterviewIcon(interview.interviewType);
              const urgencyStatus = getUrgencyStatus(interview.interviewDate.toString());
              
              return (
                <div 
                  key={interview.id} 
                  className={`p-4 border rounded-lg ${
                    urgencyStatus.urgency === 'urgent' ? 'border-red-200 bg-red-50' :
                    urgencyStatus.urgency === 'soon' ? 'border-yellow-200 bg-yellow-50' :
                    urgencyStatus.urgency === 'current' ? 'border-green-200 bg-green-50' :
                    'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 space-y-1">
                      {/* Candidate Name */}
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-slate-800">
                          {interview.submission?.consultant.firstName} {interview.submission?.consultant.lastName}
                        </h4>
                        {urgencyStatus.urgency === 'urgent' && (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      {/* Position Title */}
                      <p className="text-sm text-slate-700 font-medium">
                        {interview.submission?.positionTitle || 'Position not specified'}
                      </p>
                      
                      {/* Vendor and Round */}
                      <p className="text-xs text-slate-600">
                        {interview.submission?.vendor.name} • <span className="capitalize">{interview.roundType}</span> Round
                      </p>
                      
                      {/* Interview Type */}
                      <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <Icon className="h-3 w-3" />
                        <span className="capitalize">{interview.interviewType}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-700 mb-1">
                        {format(new Date(interview.interviewDate), 'MMM d, h:mm a')}
                      </div>
                      <Badge className={urgencyStatus.color}>
                        {urgencyStatus.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {interview.meetingLink && (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8 text-xs px-3"
                          onClick={() => joinInterview(interview.meetingLink!)}
                        >
                          <Video className="h-3 w-3 mr-1" />
                          Join Interview
                        </Button>
                      )}
                      {interview.submission?.consultant.phone && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs px-3"
                          onClick={() => copyToClipboard(interview.submission!.consultant.phone!, 'Phone number')}
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Copy Phone
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      {interview.meetingLink && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => copyToClipboard(interview.meetingLink!, 'Meeting link')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
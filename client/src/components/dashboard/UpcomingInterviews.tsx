import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Video, Building, ExternalLink, Copy, Clock } from "lucide-react";
import { format, isToday, isTomorrow, formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import type { Interview } from "@/lib/types";

interface InterviewWithRelations extends Interview {
  submission?: {
    consultant: {
      firstName: string;
      lastName: string;
    };
    vendor: {
      name: string;
    };
    positionTitle: string;
  };
}

export default function UpcomingInterviews() {
  const { toast } = useToast();
  const { data: interviews = [], isLoading } = useQuery<InterviewWithRelations[]>({
    queryKey: ["/api/dashboard/upcoming-interviews"],
  });

  const getInterviewIcon = (type: string) => {
    switch (type) {
      case 'phone':
        return Phone;
      case 'video':
        return Video;
      case 'onsite':
        return Building;
      default:
        return Phone;
    }
  };

  const getTimeUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (isToday(date)) {
      const hours = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60));
      if (hours <= 2 && hours >= 0) {
        return `In ${Math.max(1, hours)} hour${hours !== 1 ? 's' : ''}`;
      }
      return 'Today';
    } else if (isTomorrow(date)) {
      return 'Tomorrow';
    } else {
      return format(date, 'MMM d');
    }
  };

  const getPriorityColor = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const hoursUntil = (date.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntil <= 2) return 'border-red-500 bg-red-50';
    if (hoursUntil <= 24) return 'border-yellow-500 bg-yellow-50';
    return 'border-blue-500 bg-blue-50';
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
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border-l-4 border-slate-200 pl-4 py-2">
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
        <CardTitle className="text-lg font-semibold">Upcoming Interviews</CardTitle>
        <span className="text-sm text-slate-500">Next 7 days</span>
      </CardHeader>
      <CardContent>
        {interviews.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No upcoming interviews</p>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => {
              const Icon = getInterviewIcon(interview.interviewType);
              const priorityColor = getPriorityColor(interview.interviewDate.toString());
              
              return (
                <div 
                  key={interview.id} 
                  className={`border-l-4 ${priorityColor} pl-4 py-3 rounded-r-lg space-y-2`}
                >
                  {/* Candidate Name */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-800">
                      {interview.submission?.consultant.firstName} {interview.submission?.consultant.lastName}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {getTimeUntil(interview.interviewDate.toString())}
                    </Badge>
                  </div>
                  
                  {/* Position Title */}
                  <div className="text-sm text-slate-700 font-medium">
                    {interview.submission?.positionTitle || 'Position not specified'}
                  </div>
                  
                  {/* Vendor and Round */}
                  <div className="text-xs text-slate-600">
                    {interview.submission?.vendor.name} • <span className="capitalize">{interview.roundType}</span> Round
                  </div>
                  
                  {/* Interview Type and Date/Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                      <Icon className="h-3 w-3" />
                      <span className="capitalize">{interview.interviewType}</span>
                    </div>
                    <div className="text-xs text-slate-700 font-medium">
                      {format(new Date(interview.interviewDate), 'MMM d, h:mm a')}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center space-x-1 pt-1">
                    {interview.meetingLink && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => joinInterview(interview.meetingLink!)}
                        >
                          <Video className="h-3 w-3 mr-1" />
                          Join
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs px-2"
                          onClick={() => copyToClipboard(interview.meetingLink!, 'Meeting link')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {interview.location && interview.interviewType === 'onsite' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2"
                        onClick={() => copyToClipboard(interview.location!, 'Location')}
                      >
                        <Building className="h-3 w-3 mr-1" />
                        Copy Location
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-slate-200">
          <Button 
            variant="ghost" 
            className="w-full text-sm font-medium"
            onClick={() => window.location.href = '/submissions'}
          >
            Schedule New Interview
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

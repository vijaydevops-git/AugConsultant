import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Bell, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format, isToday, isTomorrow, formatDistanceToNow } from "date-fns";

export default function Header() {
  const { user } = useAuth();
  
  const { data: upcomingInterviews = [] } = useQuery({
    queryKey: ["/api/dashboard/upcoming-interviews"],
  });

  const urgentInterviews = upcomingInterviews.filter((interview: any) => {
    const interviewDate = new Date(interview.interviewDate);
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    return interviewDate <= twoHoursFromNow && interviewDate >= now;
  });

  const formatInterviewTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isTomorrow(date)) {
      return `Tomorrow at ${format(date, 'h:mm a')}`;
    } else {
      return `${format(date, 'MMM d')} at ${format(date, 'h:mm a')}`;
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-sm text-slate-500">
            Welcome back, <span className="font-medium">{user?.firstName || 'User'}</span>
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="relative p-2">
                <Bell className="h-5 w-5" />
                {urgentInterviews.length > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs animate-pulse"
                  >
                    {urgentInterviews.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {urgentInterviews.length > 0 ? (
                <>
                  <div className="px-4 py-2 border-b">
                    <p className="font-semibold text-sm">Urgent Interviews</p>
                    <p className="text-xs text-muted-foreground">Starting within 2 hours</p>
                  </div>
                  {urgentInterviews.map((interview: any) => (
                    <DropdownMenuItem key={interview.id} className="flex flex-col items-start p-4">
                      <p className="font-medium text-sm">{interview.consultant?.firstName} {interview.consultant?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{interview.vendor?.name}</p>
                      <p className="text-xs text-primary font-medium mt-1">
                        {formatInterviewTime(interview.interviewDate)}
                      </p>
                    </DropdownMenuItem>
                  ))}
                </>
              ) : (
                <DropdownMenuItem disabled>
                  <p className="text-sm text-muted-foreground">No urgent interviews</p>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {getInitials(user?.firstName, user?.lastName)}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-800">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-500 capitalize">
                {user?.role || 'User'}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="ml-2 p-2"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

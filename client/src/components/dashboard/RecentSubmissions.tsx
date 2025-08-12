import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { StatusColors, StatusLabels } from "@/lib/types";
import type { SubmissionWithRelations } from "@/lib/types";
import { useLocation } from "wouter";

export default function RecentSubmissions() {
  const [, setLocation] = useLocation();
  
  const { data: submissions = [], isLoading } = useQuery<SubmissionWithRelations[]>({
    queryKey: ["/api/dashboard/recent-submissions"],
  });

  const getInitials = (firstName: string, lastName: string) => {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  const formatTimeAgo = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const handleViewAll = () => {
    setLocation('/submissions');
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-slate-200 rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-slate-200 rounded w-32"></div>
                </div>
                <div className="h-6 bg-slate-200 rounded w-16"></div>
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
        <CardTitle className="text-lg font-semibold">Recent Submissions</CardTitle>
        <button 
          onClick={handleViewAll}
          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          View All
        </button>
      </CardHeader>
      <CardContent>
        {submissions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">No recent submissions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div 
                key={submission.id} 
                className="flex items-center space-x-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => setLocation(`/submissions?id=${submission.id}`)}
              >
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-600">
                    {getInitials(submission.consultant.firstName, submission.consultant.lastName)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {submission.consultant.firstName} {submission.consultant.lastName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {submission.vendor.name}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={StatusColors[submission.status as keyof typeof StatusColors]}>
                    {StatusLabels[submission.status as keyof typeof StatusLabels]}
                  </Badge>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatTimeAgo(submission.submissionDate.toString())}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

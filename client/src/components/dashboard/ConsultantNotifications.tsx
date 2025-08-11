import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, TrendingUp, Users, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ConsultantNotificationsProps {
  className?: string;
}

const NOTIFICATION_COLORS = {
  submissions: '#3b82f6',
  interviews: '#f59e0b', 
  placements: '#10b981',
  pending: '#6b7280',
};

export default function ConsultantNotifications({ className }: ConsultantNotificationsProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [notificationType, setNotificationType] = useState<'all' | 'submissions' | 'interviews' | 'placements'>('all');

  const { data: notificationData, isLoading } = useQuery({
    queryKey: ['/api/notifications/consultant-activity', timeframe],
  });

  const { data: consultantSummary } = useQuery({
    queryKey: ['/api/analytics/consultant-summary'],
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-200 rounded w-1/3"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get consultant activity metrics
  const getActivityMetrics = () => {
    if (!(notificationData as any)?.consultantActivity) return [];

    return (notificationData as any).consultantActivity.map((consultant: any) => ({
      consultantName: `${consultant.firstName} ${consultant.lastName}`,
      consultantId: consultant.id,
      newSubmissions: consultant.submissionCounts?.new || 0,
      scheduledInterviews: consultant.interviewCounts?.scheduled || 0,
      completedInterviews: consultant.interviewCounts?.completed || 0,
      recentPlacements: consultant.placementCounts?.recent || 0,
      totalActivity: (consultant.submissionCounts?.new || 0) + 
                   (consultant.interviewCounts?.scheduled || 0) + 
                   (consultant.interviewCounts?.completed || 0) +
                   (consultant.placementCounts?.recent || 0),
      lastActivity: consultant.lastActivityDate,
    }));
  };

  // Get time-based activity trends
  const getActivityTrends = () => {
    if (!(notificationData as any)?.activityTrends) return [];

    return (notificationData as any).activityTrends.map((trend: any) => ({
      date: trend.date,
      submissions: trend.submissionCount,
      interviews: trend.interviewCount,
      placements: trend.placementCount,
    }));
  };

  // Get summary statistics
  const getSummaryStats = () => {
    if (!consultantSummary) return null;

    return {
      totalActiveConsultants: (consultantSummary as any).totalActiveConsultants || 0,
      newSubmissionsToday: (consultantSummary as any).todaySubmissions || 0,
      interviewsThisWeek: (consultantSummary as any).weekInterviews || 0,
      placementsThisMonth: (consultantSummary as any).monthPlacements || 0,
      avgResponseTime: (consultantSummary as any).avgResponseTime || 0,
    };
  };

  const activityMetrics = getActivityMetrics();
  const activityTrends = getActivityTrends();
  const summaryStats = getSummaryStats();

  // Filter consultants based on notification type
  const getFilteredConsultants = () => {
    if (notificationType === 'all') return activityMetrics;
    
    return activityMetrics.filter((consultant: any) => {
      switch (notificationType) {
        case 'submissions':
          return consultant.newSubmissions > 0;
        case 'interviews':
          return consultant.scheduledInterviews > 0 || consultant.completedInterviews > 0;
        case 'placements':
          return consultant.recentPlacements > 0;
        default:
          return true;
      }
    });
  };

  const filteredConsultants = getFilteredConsultants();

  // Get high-priority notifications
  const getPriorityNotifications = () => {
    return activityMetrics
      .filter((consultant: any) => consultant.totalActivity > 0)
      .sort((a: any, b: any) => b.totalActivity - a.totalActivity)
      .slice(0, 10);
  };

  const priorityNotifications = getPriorityNotifications();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            Consultant Activity Notifications
          </CardTitle>
          
          <div className="flex items-center gap-4">
            <Select value={notificationType} onValueChange={(value: 'all' | 'submissions' | 'interviews' | 'placements') => setNotificationType(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="submissions">Submissions</SelectItem>
                <SelectItem value="interviews">Interviews</SelectItem>
                <SelectItem value="placements">Placements</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeframe} onValueChange={(value: 'daily' | 'weekly' | 'monthly') => setTimeframe(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Configure Alerts
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Active Consultants</span>
            </div>
            <div className="text-2xl font-bold mt-2">{summaryStats?.totalActiveConsultants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Today's Submissions</span>
            </div>
            <div className="text-2xl font-bold mt-2">{summaryStats?.newSubmissionsToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">Week Interviews</span>
            </div>
            <div className="text-2xl font-bold mt-2">{summaryStats?.interviewsThisWeek}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-teal-600" />
              <span className="text-sm text-muted-foreground">Month Placements</span>
            </div>
            <div className="text-2xl font-bold mt-2">{summaryStats?.placementsThisMonth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-muted-foreground">Avg Response</span>
            </div>
            <div className="text-2xl font-bold mt-2">{summaryStats?.avgResponseTime}h</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Trends Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activity Trends ({timeframe})</CardTitle>
          </CardHeader>
          <CardContent>
            {activityTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="submissions" 
                    stroke={NOTIFICATION_COLORS.submissions} 
                    name="Submissions" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="interviews" 
                    stroke={NOTIFICATION_COLORS.interviews} 
                    name="Interviews" 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="placements" 
                    stroke={NOTIFICATION_COLORS.placements} 
                    name="Placements" 
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No activity trend data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Active Consultants */}
        <Card>
          <CardHeader>
            <CardTitle>Most Active Consultants</CardTitle>
          </CardHeader>
          <CardContent>
            {priorityNotifications.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={priorityNotifications.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="consultantName" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="totalActivity" fill={NOTIFICATION_COLORS.submissions} name="Total Activity" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No consultant activity data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Activity List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Consultant Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredConsultants.length > 0 ? (
            <div className="space-y-4">
              {filteredConsultants.slice(0, 20).map((consultant: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1">
                    <h4 className="font-medium">{consultant.consultantName}</h4>
                    <p className="text-sm text-muted-foreground">
                      Last activity: {consultant.lastActivity ? 
                        new Date(consultant.lastActivity).toLocaleDateString() : 'No recent activity'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {consultant.newSubmissions > 0 && (
                      <Badge variant="default" className="bg-blue-100 text-blue-800">
                        {consultant.newSubmissions} Submissions
                      </Badge>
                    )}
                    
                    {consultant.scheduledInterviews > 0 && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {consultant.scheduledInterviews} Interviews
                      </Badge>
                    )}
                    
                    {consultant.recentPlacements > 0 && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        {consultant.recentPlacements} Placements
                      </Badge>
                    )}

                    {consultant.totalActivity === 0 && (
                      <Badge variant="outline" className="text-muted-foreground">
                        No Recent Activity
                      </Badge>
                    )}

                    {consultant.totalActivity > 5 && (
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                    )}
                  </div>
                </div>
              ))}

              {filteredConsultants.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No consultants match the selected notification type
                </div>
              )}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-muted-foreground">
              No consultant activity data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { UserCheck, Target, TrendingUp, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface RecruiterAnalyticsProps {
  className?: string;
}

export default function RecruiterAnalytics({ className }: RecruiterAnalyticsProps) {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/recruiters', { timeframe }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('timeframe', timeframe);
      
      const response = await fetch(`/api/analytics/recruiters?${params}`);
      if (!response.ok) throw new Error('Failed to fetch recruiter analytics');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Recruiter Performance Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-slate-200 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If user is a recruiter, show only their data
  const isRecruiter = (user as any)?.role === 'recruiter';
  const displayData = isRecruiter 
    ? analytics?.filter((recruiter: any) => recruiter.recruiterId === (user as any)?.id)
    : analytics;

  // Prepare chart data for performance comparison
  const performanceData = displayData?.map((recruiter: any) => ({
    name: recruiter.recruiterName.split(' ')[0], // First name only
    submissions: recruiter.totalSubmissions,
    consultants: recruiter.consultantsWorkedWith,
    successRate: recruiter.successRate,
    hired: recruiter.statusBreakdown.hired,
  })) || [];

  // Get time-based trend data (for single recruiter view)
  const getTrendData = () => {
    if (!isRecruiter || !displayData?.[0]?.timeBasedData) return [];
    
    return displayData[0].timeBasedData.map((item: any) => ({
      period: item.period,
      submissions: item.count,
    }));
  };

  const trendData = getTrendData();

  // Get recruiter's first name for title
  const getRecruiterName = () => {
    if (isRecruiter && displayData?.[0]) {
      const firstName = displayData[0].recruiterName.split(' ')[0];
      return `${firstName} Performance Analytics`;
    }
    return 'Recruiter Performance Analytics';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5" />
          {getRecruiterName()}
        </CardTitle>
        
        <div className="flex items-center gap-4">
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
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">
                  {isRecruiter ? 'Your Submissions' : 'Total Recruiters'}
                </span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {isRecruiter 
                  ? displayData?.[0]?.totalSubmissions || 0
                  : displayData?.length || 0
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">
                  {isRecruiter ? 'Consultants Worked' : 'Avg Submissions'}
                </span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {isRecruiter 
                  ? displayData?.[0]?.consultantsWorkedWith || 0
                  : Math.round(displayData?.reduce((sum: number, r: any) => sum + r.totalSubmissions, 0) / (displayData?.length || 1)) || 0
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">
                  {isRecruiter ? 'Success Rate' : 'Avg Success Rate'}
                </span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {isRecruiter 
                  ? `${displayData?.[0]?.successRate || 0}%`
                  : `${Math.round(displayData?.reduce((sum: number, r: any) => sum + r.successRate, 0) / (displayData?.length || 1)) || 0}%`
                }
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">
                  {isRecruiter ? 'Hired' : 'Total Hired'}
                </span>
              </div>
              <p className="text-2xl font-bold mt-2">
                {isRecruiter 
                  ? displayData?.[0]?.statusBreakdown?.hired || 0
                  : displayData?.reduce((sum: number, r: any) => sum + r.statusBreakdown.hired, 0) || 0
                }
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Comparison Chart (Admin view) or Trend Chart (Recruiter view) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {isRecruiter ? `${displayData?.[0]?.recruiterName.split(' ')[0] || 'Your'} Submission Trend (${timeframe})` : 'Recruiter Performance Comparison'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                {isRecruiter ? (
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="submissions" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="submissions" fill="#3b82f6" name="Submissions" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Success Rate Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">
                {isRecruiter ? `${displayData?.[0]?.recruiterName.split(' ')[0] || 'Your'} Status Breakdown` : 'Success Rate Comparison'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                {isRecruiter ? (
                  <BarChart data={[
                    { status: 'Submitted', count: displayData?.[0]?.statusBreakdown?.submitted || 0 },
                    { status: 'Under Review', count: displayData?.[0]?.statusBreakdown?.under_review || 0 },
                    { status: 'Interview', count: displayData?.[0]?.statusBreakdown?.interview_scheduled || 0 },
                    { status: 'Hired', count: displayData?.[0]?.statusBreakdown?.hired || 0 },
                    { status: 'Rejected', count: displayData?.[0]?.statusBreakdown?.rejected || 0 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" />
                  </BarChart>
                ) : (
                  <BarChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="successRate" fill="#10b981" name="Success Rate %" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Performance Table */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">
              {isRecruiter ? `${displayData?.[0]?.recruiterName.split(' ')[0] || 'Your'} Detailed Performance` : 'Recruiter Performance Details'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayData?.map((recruiter: any) => (
                <div key={recruiter.recruiterId} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{recruiter.recruiterName}</p>
                    <p className="text-sm text-slate-600">{recruiter.recruiterEmail}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-sm">
                        <strong>{recruiter.totalSubmissions}</strong> submissions
                      </span>
                      <span className="text-sm">
                        <strong>{recruiter.consultantsWorkedWith}</strong> consultants
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 items-end">
                    <Badge 
                      variant="outline" 
                      className={`${recruiter.successRate >= 20 ? 'text-green-700 bg-green-50' : 'text-orange-700 bg-orange-50'}`}
                    >
                      {recruiter.successRate}% success rate
                    </Badge>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-green-700 bg-green-50 text-xs">
                        {recruiter.statusBreakdown.hired} hired
                      </Badge>
                      <Badge variant="outline" className="text-purple-700 bg-purple-50 text-xs">
                        {recruiter.statusBreakdown.interview_scheduled} interviews
                      </Badge>
                      <Badge variant="outline" className="text-blue-700 bg-blue-50 text-xs">
                        {recruiter.statusBreakdown.submitted + recruiter.statusBreakdown.under_review} pending
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
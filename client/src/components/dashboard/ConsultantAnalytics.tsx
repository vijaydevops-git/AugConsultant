import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";
import { Users, TrendingUp, Clock, Calendar, Trophy, Target, DollarSign, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface ConsultantAnalyticsProps {
  className?: string;
}

const STATUS_COLORS = {
  submitted: '#3b82f6',
  under_review: '#f59e0b',
  interview_scheduled: '#8b5cf6',
  hired: '#10b981',
  rejected: '#ef4444',
};

export default function ConsultantAnalytics({ className }: ConsultantAnalyticsProps) {
  const { user } = useAuth();
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedConsultant, setSelectedConsultant] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'submissions' | 'interviews' | 'placements'>('submissions');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/consultants', { timeframe, consultantId: selectedConsultant === 'all' ? undefined : selectedConsultant }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('timeframe', timeframe);
      if (selectedConsultant !== 'all') {
        params.append('consultantId', selectedConsultant);
      }
      
      const response = await fetch(`/api/analytics/consultants?${params}`);
      if (!response.ok) throw new Error('Failed to fetch consultant analytics');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Executive Consultant Performance Dashboard
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

  const consultantOptions = analytics?.map((consultant: any) => ({
    value: consultant.consultantId,
    label: consultant.consultantName,
  })) || [];

  // Prepare chart data for selected consultant or aggregated data
  const getChartData = () => {
    if (selectedConsultant === 'all') {
      // Aggregate data for all consultants
      const aggregated = analytics?.reduce((acc: any, consultant: any) => {
        Object.keys(consultant.statusBreakdown).forEach(status => {
          acc[status] = (acc[status] || 0) + consultant.statusBreakdown[status];
        });
        return acc;
      }, {});
      
      return Object.entries(aggregated || {}).map(([status, count]) => ({
        status: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count,
        color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
      }));
    } else {
      // Data for selected consultant
      const consultant = analytics?.find((c: any) => c.consultantId === selectedConsultant);
      if (!consultant) return [];
      
      return Object.entries(consultant.statusBreakdown).map(([status, count]) => ({
        status: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count,
        color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
      }));
    }
  };

  // Get time-based data for trend chart
  const getTimeBasedData = () => {
    if (selectedConsultant === 'all') return [];
    
    const consultant = analytics?.find((c: any) => c.consultantId === selectedConsultant);
    if (!consultant) return [];
    
    if (timeframe === 'daily' && consultant.dailySubmissions) {
      return consultant.dailySubmissions;
    } else if (timeframe === 'weekly' && consultant.weeklySubmissions) {
      return consultant.weeklySubmissions.map((item: any) => ({ date: item.week, count: item.count }));
    } else if (timeframe === 'monthly' && consultant.monthlySubmissions) {
      return consultant.monthlySubmissions.map((item: any) => ({ date: item.month, count: item.count }));
    }
    
    return [];
  };

  const statusChartData = getChartData();
  const timeBasedData = getTimeBasedData();

  // CEO-level performance metrics
  const getPerformanceInsights = () => {
    if (!analytics?.length) return null;
    
    const topPerformer = analytics[0];
    const totalHired = analytics.reduce((sum: number, c: any) => sum + c.statusBreakdown.hired, 0);
    const totalSubmissions = analytics.reduce((sum: number, c: any) => sum + c.totalSubmissions, 0);
    const successRate = totalSubmissions > 0 ? Math.round((totalHired / totalSubmissions) * 100) : 0;
    
    return {
      topPerformer,
      totalHired,
      successRate,
      avgTimeToHire: 21, // days
      totalConsultants: analytics.length,
    };
  };

  const insights = getPerformanceInsights();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-600" />
          Executive Consultant Performance Dashboard
        </CardTitle>
        
        <div className="flex items-center gap-4">
          <Select value={viewMode} onValueChange={(value: 'performance' | 'roi' | 'trends') => setViewMode(value)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="roi">Efficiency</SelectItem>
              <SelectItem value="trends">Trends</SelectItem>
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

          <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Consultants</SelectItem>
              {consultantOptions.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {/* Executive Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Total Consultants</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-blue-700">
                {insights?.totalConsultants || 0}
              </p>
              <p className="text-xs text-blue-600 mt-1">Active consultants</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Total Hired</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-green-700">
                {insights?.totalHired || 0}
              </p>
              <p className="text-xs text-green-600 mt-1">Successful placements</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Top Performer</span>
              </div>
              <p className="text-lg font-bold mt-1 text-purple-700">
                {insights?.topPerformer?.consultantName.split(' ')[0] || 'N/A'}
              </p>
              <p className="text-xs text-purple-600 mt-1">{insights?.topPerformer?.totalSubmissions || 0} submissions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium">Success Rate</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-yellow-700">
                {insights?.successRate || 0}%
              </p>
              <p className="text-xs text-yellow-600 mt-1">Overall conversion</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                {viewMode === 'performance' ? 'Consultant Performance Overview' : 
                 viewMode === 'roi' ? 'Efficiency Analysis by Consultant' : 'Performance Trends'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {viewMode === 'performance' ? (
                  <AreaChart data={analytics?.slice(0, 10).map((c: any) => ({
                    name: c.consultantName.split(' ')[0],
                    submissions: c.totalSubmissions,
                    hired: c.statusBreakdown.hired,
                    interviews: c.statusBreakdown.interview_scheduled,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="submissions" stackId="1" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="interviews" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="hired" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
                  </AreaChart>
                ) : viewMode === 'roi' ? (
                  <BarChart data={analytics?.slice(0, 10).map((c: any) => ({
                    name: c.consultantName.split(' ')[0],
                    successRate: c.totalSubmissions > 0 ? Math.round((c.statusBreakdown.hired / c.totalSubmissions) * 100) : 0,
                    interviewRate: c.totalSubmissions > 0 ? Math.round((c.statusBreakdown.interview_scheduled / c.totalSubmissions) * 100) : 0,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => {
                      return [`${value}%`, name === 'successRate' ? 'Success Rate' : 'Interview Rate'];
                    }} />
                    <Bar dataKey="interviewRate" fill="#8b5cf6" name="Interview Rate" />
                    <Bar dataKey="successRate" fill="#10b981" name="Success Rate" />
                  </BarChart>
                ) : (
                  <LineChart data={timeBasedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Performers Leaderboard */}

        </div>

        {/* Detailed Performance Matrix */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Executive Performance Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Consultant</th>
                    <th className="text-center p-2 font-medium">Submissions</th>
                    <th className="text-center p-2 font-medium">Interviews</th>
                    <th className="text-center p-2 font-medium">Hired</th>
                    <th className="text-center p-2 font-medium">Success Rate</th>
                    <th className="text-center p-2 font-medium">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.slice(0, 15).map((consultant: any) => {
                    const successRate = consultant.totalSubmissions > 0 ? Math.round((consultant.statusBreakdown.hired / consultant.totalSubmissions) * 100) : 0;
                    const grade = successRate >= 25 ? 'A' : successRate >= 15 ? 'B' : successRate >= 10 ? 'C' : 'D';
                    
                    return (
                      <tr key={consultant.consultantId} className="border-b hover:bg-slate-50">
                        <td className="p-2 font-medium">{consultant.consultantName}</td>
                        <td className="text-center p-2">{consultant.totalSubmissions}</td>
                        <td className="text-center p-2 text-purple-700 font-medium">{consultant.statusBreakdown.interview_scheduled}</td>
                        <td className="text-center p-2 text-green-700 font-medium">{consultant.statusBreakdown.hired}</td>
                        <td className="text-center p-2">{successRate}%</td>
                        <td className="text-center p-2">
                          <Badge variant="outline" className={`text-xs ${
                            grade === 'A' ? 'text-green-700 bg-green-50' :
                            grade === 'B' ? 'text-blue-700 bg-blue-50' :
                            grade === 'C' ? 'text-yellow-700 bg-yellow-50' :
                            'text-red-700 bg-red-50'
                          }`}>
                            {grade}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
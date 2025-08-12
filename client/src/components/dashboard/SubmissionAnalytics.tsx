import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Area, AreaChart } from "recharts";
import { Send, Clock, TrendingUp, Target, CheckCircle, XCircle, DollarSign, AlertTriangle, Activity } from "lucide-react";

interface SubmissionAnalyticsProps {
  className?: string;
}

const STATUS_COLORS = {
  submitted: '#3b82f6',
  under_review: '#f59e0b', 
  interview_scheduled: '#8b5cf6',
  hired: '#10b981',
  rejected: '#ef4444',
  waiting_for_vendor_update: '#6b7280',
};

export default function SubmissionAnalytics({ className }: SubmissionAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/submissions', { timeframe }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('timeframe', timeframe);
      
      const response = await fetch(`/api/analytics/submissions?${params}`);
      if (!response.ok) throw new Error('Failed to fetch submission analytics');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Submission Analytics & Pipeline
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

  // Prepare chart data
  const progressionData = analytics ? Object.entries(analytics.submissionsProgression)
    .filter(([key]) => key !== 'waiting_for_vendor_update')
    .map(([status, count]) => ({
      status: status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      count: count as number,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
    })) : [];

  const timeBasedData = analytics?.timeBasedSubmissions.map((item: any) => ({
    period: item.period,
    submissions: item.count,
  })) || [];

  // CEO-level business metrics
  const getBusinessMetrics = () => {
    if (!analytics) return null;
    
    const pipelineHealth = Math.round(((analytics.submissionsProgression.interview_scheduled + analytics.submissionsProgression.hired) / analytics.totalSubmissions) * 100);
    const conversionRate = analytics.conversionRates?.overallSuccess || 0;
    
    return {
      pipelineHealth,
      conversionRate,
      avgTimeToHire: analytics.averageTimeToInterview || 0,
      totalActive: analytics.submissionsProgression.interview_scheduled + analytics.submissionsProgression.under_review,
    };
  };

  const businessMetrics = getBusinessMetrics();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Executive Pipeline Intelligence
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
        {/* Executive Business Intelligence */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Total Submissions</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-blue-700">
                {analytics?.totalSubmissions || 0}
              </p>
              <p className="text-xs text-blue-600 mt-1">All time submissions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium">Active Pipeline</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-purple-700">
                {businessMetrics?.totalActive || 0}
              </p>
              <p className="text-xs text-purple-600 mt-1">In progress submissions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Pipeline Health</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-green-700">
                {businessMetrics?.pipelineHealth || 0}%
              </p>
              <p className="text-xs text-green-600 mt-1">Active + Hired rate</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium">Success Rate</span>
              </div>
              <p className="text-2xl font-bold mt-2 text-yellow-700">
                {businessMetrics?.conversionRate || 0}%
              </p>
              <p className="text-xs text-yellow-600 mt-1">Submission to hire</p>
            </CardContent>
          </Card>
        </div>

        {/* Conversion Rates */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-sm">Conversion Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Submission to Interview</span>
                  <span>{analytics?.conversionRates?.submittedToInterview || 0}%</span>
                </div>
                <Progress value={analytics?.conversionRates?.submittedToInterview || 0} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Interview to Hired</span>
                  <span>{analytics?.conversionRates?.interviewToHired || 0}%</span>
                </div>
                <Progress value={analytics?.conversionRates?.interviewToHired || 0} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Overall Success Rate</span>
                  <span>{analytics?.conversionRates?.overallSuccess || 0}%</span>
                </div>
                <Progress value={analytics?.conversionRates?.overallSuccess || 0} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submission Pipeline Trend */}


          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Pipeline Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analytics?.submissionsProgression || {})
                  .filter(([key]) => key !== 'waiting_for_vendor_update')
                  .map(([status, count]) => {
                    const percentage = analytics?.totalSubmissions > 0 
                      ? Math.round(((count as number) / analytics.totalSubmissions) * 100)
                      : 0;
                    
                    const getStatusConfig = (status: string) => {
                      switch (status) {
                        case 'submitted': return { color: 'bg-blue-100 text-blue-800', icon: '📤' };
                        case 'under_review': return { color: 'bg-orange-100 text-orange-800', icon: '👀' };
                        case 'interview_scheduled': return { color: 'bg-purple-100 text-purple-800', icon: '📅' };
                        case 'hired': return { color: 'bg-green-100 text-green-800', icon: '✅' };
                        case 'rejected': return { color: 'bg-red-100 text-red-800', icon: '❌' };
                        default: return { color: 'bg-gray-100 text-gray-800', icon: '📄' };
                      }
                    };
                    
                    const config = getStatusConfig(status);
                    
                    return (
                      <div key={status} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{config.icon}</span>
                          <div>
                            <p className="text-sm font-medium">
                              {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </p>
                            <p className="text-xs text-slate-500">{count as number} submissions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{percentage}%</p>
                          <p className="text-xs text-slate-500">of total</p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Status Breakdown */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Current Pipeline Status (All Time)</CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Shows the current distribution of all submissions across different status stages
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {Object.entries(analytics?.submissionsProgression || {})
                .filter(([key]) => key !== 'waiting_for_vendor_update')
                .map(([status, count]) => {
                  const percentage = analytics?.totalSubmissions > 0 
                    ? Math.round(((count as number) / analytics.totalSubmissions) * 100)
                    : 0;
                    
                  const getIcon = () => {
                    switch (status) {
                      case 'submitted': return <Send className="h-4 w-4 text-blue-600" />;
                      case 'under_review': return <Clock className="h-4 w-4 text-orange-600" />;
                      case 'interview_scheduled': return <Target className="h-4 w-4 text-purple-600" />;
                      case 'hired': return <CheckCircle className="h-4 w-4 text-green-600" />;
                      case 'rejected': return <XCircle className="h-4 w-4 text-red-600" />;
                      default: return <Send className="h-4 w-4" />;
                    }
                  };
                  
                  return (
                    <div key={status} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getIcon()}
                        <span className="text-sm font-medium">
                          {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <p className="text-2xl font-bold">{count as number}</p>
                      <p className="text-xs text-slate-500 mt-1">{percentage}% of total</p>
                    </div>
                  );
                })}
            </div>

            {/* Executive Action Items */}
            <div className="mt-6 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                Executive Action Items
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-xs font-medium text-slate-700 mb-2">IMMEDIATE ATTENTION</h5>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>🔥 <strong>{analytics?.submissionsProgression?.waiting_for_vendor_update || 0}</strong> submissions need vendor follow-up</li>
                    <li>📅 <strong>{analytics?.submissionsProgression?.interview_scheduled || 0}</strong> interviews scheduled - track conversion</li>
                    <li>⚠️ Pipeline health at <strong>{businessMetrics?.pipelineHealth || 0}%</strong> {(businessMetrics?.pipelineHealth || 0) < 30 ? '(CRITICAL)' : '(Good)'}</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-xs font-medium text-slate-700 mb-2">STRATEGIC GOALS</h5>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>🎯 Target: Increase conversion from <strong>{businessMetrics?.conversionRate || 0}%</strong> to <strong>20%+</strong></li>
                    <li>📊 Improve time to interview from <strong>{businessMetrics?.avgTimeToHire || 0}</strong> days</li>
                    <li>📈 Maintain <strong>{businessMetrics?.totalActive || 0}</strong> submissions currently in progress (submitted + under review + interview scheduled)</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}
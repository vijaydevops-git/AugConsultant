import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building2, TrendingUp, Users, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface VendorAnalyticsProps {
  className?: string;
}

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6',
};

export default function VendorAnalytics({ className }: VendorAnalyticsProps) {
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [metricView, setMetricView] = useState<'submissions' | 'placements' | 'performance'>('performance');

  const { data: vendorAnalytics, isLoading } = useQuery({
    queryKey: ['/api/analytics/vendors', timeframe, skillFilter],
  });

  const { data: skillMetrics } = useQuery({
    queryKey: ['/api/analytics/vendor-skills'],
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

  // Top performing vendors by placement rate
  const getTopVendors = () => {
    if (!vendorAnalytics?.vendors) return [];
    
    return (vendorAnalytics as any).vendors
      .map((vendor: any) => ({
        ...vendor,
        placementRate: vendor.totalSubmissions > 0 ? 
          Math.round((vendor.placementsCount / vendor.totalSubmissions) * 100) : 0,
        interviewRate: vendor.totalSubmissions > 0 ?
          Math.round((vendor.interviewsCount / vendor.totalSubmissions) * 100) : 0,
      }))
      .sort((a: any, b: any) => b.placementRate - a.placementRate)
      .slice(0, 5);
  };

  // Vendor-skill performance matrix
  const getVendorSkillMatrix = () => {
    if (!skillMetrics?.vendorSkills) return [];
    
    return (skillMetrics as any).vendorSkills.map((item: any) => ({
      vendor: item.vendorName,
      skill: item.skill,
      submissions: item.submissionCount,
      placements: item.placementCount,
      success_rate: item.submissionCount > 0 ? 
        Math.round((item.placementCount / item.submissionCount) * 100) : 0,
    }));
  };

  const topVendors = getTopVendors();
  const skillMatrix = getVendorSkillMatrix();
  const availableSkills = Array.from(new Set(skillMatrix.map(item => item.skill)));

  // Filtered skill matrix
  const filteredSkillMatrix = skillFilter === 'all' ? 
    skillMatrix : 
    skillMatrix.filter((item: any) => item.skill === skillFilter);

  // Monthly submission trends
  const getSubmissionTrends = () => {
    if (!vendorAnalytics?.monthlyTrends) return [];
    
    return (vendorAnalytics as any).monthlyTrends.map((trend: any) => ({
      month: trend.month,
      submissions: trend.totalSubmissions,
      interviews: trend.totalInterviews,
      placements: trend.totalPlacements,
    }));
  };

  const submissionTrends = getSubmissionTrends();

  // Key performance indicators
  const getKPIs = () => {
    if (!vendorAnalytics?.summary) return null;
    
    const { summary } = vendorAnalytics as any;
    return {
      totalVendors: summary.totalActiveVendors || 0,
      avgPlacementRate: summary.overallPlacementRate || 0,
      topSkill: summary.mostRequestedSkill || 'N/A',
      bestVendor: topVendors[0]?.name || 'N/A',
      monthlyGrowth: summary.monthlyGrowthRate || 0,
    };
  };

  const kpis = getKPIs();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            Vendor Performance Analytics
          </CardTitle>
          
          <div className="flex items-center gap-4">
            <Select value={metricView} onValueChange={(value: 'submissions' | 'placements' | 'performance') => setMetricView(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="submissions">Submissions</SelectItem>
                <SelectItem value="placements">Placements</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeframe} onValueChange={(value: 'weekly' | 'monthly' | 'quarterly') => setTimeframe(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
              </SelectContent>
            </Select>

            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Skills</SelectItem>
                {availableSkills.map((skill: any) => (
                  <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-muted-foreground">Active Vendors</span>
            </div>
            <div className="text-2xl font-bold mt-2">{kpis?.totalVendors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600" />
              <span className="text-sm text-muted-foreground">Avg Success Rate</span>
            </div>
            <div className="text-2xl font-bold mt-2">{kpis?.avgPlacementRate}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-muted-foreground">Top Skill</span>
            </div>
            <div className="text-lg font-bold mt-2">{kpis?.topSkill}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              <span className="text-sm text-muted-foreground">Best Vendor</span>
            </div>
            <div className="text-sm font-bold mt-2 truncate">{kpis?.bestVendor}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {(kpis?.monthlyGrowth || 0) >= 0 ? 
                <ArrowUpRight className="h-4 w-4 text-green-600" /> :
                <ArrowDownRight className="h-4 w-4 text-red-600" />
              }
              <span className="text-sm text-muted-foreground">Monthly Growth</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {(kpis?.monthlyGrowth || 0) >= 0 ? '+' : ''}{kpis?.monthlyGrowth}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Vendors Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            {topVendors.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topVendors}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="placementRate" fill={COLORS.primary} name="Placement Rate %" />
                  <Bar dataKey="interviewRate" fill={COLORS.success} name="Interview Rate %" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No vendor data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Submission Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {submissionTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={submissionTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="submissions" stroke={COLORS.primary} name="Submissions" />
                  <Line type="monotone" dataKey="interviews" stroke={COLORS.warning} name="Interviews" />
                  <Line type="monotone" dataKey="placements" stroke={COLORS.success} name="Placements" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vendor-Skill Performance Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Vendor-Skill Performance Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSkillMatrix.length > 0 ? (
            <div className="space-y-4">
              {/* Skills breakdown chart */}
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={filteredSkillMatrix.slice(0, 10)} margin={{ left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="vendor" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="submissions" fill={COLORS.primary} name="Submissions" />
                  <Bar dataKey="placements" fill={COLORS.success} name="Placements" />
                </BarChart>
              </ResponsiveContainer>

              {/* Performance table */}
              <div className="overflow-auto max-h-64">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2">Vendor</th>
                      <th className="text-left p-2">Skill</th>
                      <th className="text-center p-2">Submissions</th>
                      <th className="text-center p-2">Placements</th>
                      <th className="text-center p-2">Success Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSkillMatrix.slice(0, 20).map((item: any, index: any) => (
                      <tr key={index} className="border-b hover:bg-muted/30">
                        <td className="p-2 font-medium">{item.vendor}</td>
                        <td className="p-2">
                          <Badge variant="outline">{item.skill}</Badge>
                        </td>
                        <td className="text-center p-2">{item.submissions}</td>
                        <td className="text-center p-2">{item.placements}</td>
                        <td className="text-center p-2">
                          <Badge 
                            variant={item.success_rate >= 50 ? "default" : item.success_rate >= 25 ? "secondary" : "destructive"}
                          >
                            {item.success_rate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              No vendor-skill performance data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
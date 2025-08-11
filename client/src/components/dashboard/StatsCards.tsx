import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { DashboardStats, FilterOptions } from "@/lib/types";
import { useLocation } from "wouter";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

export default function StatsCards() {
  const [, setLocation] = useLocation();
  // Calculate current week of the month
  const getCurrentWeekOfMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return Math.ceil((today.getDate() + firstDay.getDay()) / 7);
  };

  const [filters, setFilters] = useState<FilterOptions>({
    timeframe: 'weekly',
    week: getCurrentWeekOfMonth(),
    month: currentMonth,
    year: currentYear,
  });

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.timeframe) params.append('timeframe', filters.timeframe);
      if (filters.week) params.append('week', filters.week.toString());
      if (filters.month) params.append('month', filters.month.toString());
      if (filters.year) params.append('year', filters.year.toString());
      
      const response = await fetch(`/api/dashboard/stats?${params}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  const getWeeksInMonth = (year: number, month: number) => {
    const today = new Date();
    const isCurrentMonth = year === today.getFullYear() && month === (today.getMonth() + 1);
    
    if (isCurrentMonth) {
      // For current month, only show weeks up to current week
      const currentDayOfMonth = today.getDate();
      const firstDay = new Date(year, month - 1, 1);
      const currentWeek = Math.ceil((currentDayOfMonth + firstDay.getDay()) / 7);
      return Array.from({ length: currentWeek }, (_, i) => i + 1);
    } else {
      // For other months, show standard 4 weeks
      return Array.from({ length: 4 }, (_, i) => i + 1);
    }
  };

  const getTimeframeLabel = () => {
    if (filters.timeframe === 'weekly' && filters.week && filters.month && filters.year) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `Week ${filters.week} - ${monthNames[filters.month - 1]} ${filters.year}`;
    } else if (filters.timeframe === 'monthly' && filters.month && filters.year) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${monthNames[filters.month - 1]} ${filters.year}`;
    } else if (filters.timeframe === 'yearly' && filters.year) {
      return `Year ${filters.year}`;
    }
    return 'This Week';
  };

  const handleCardClick = (status?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (filters.timeframe) params.append('timeframe', filters.timeframe);
    if (filters.week) params.append('week', filters.week.toString());
    if (filters.month) params.append('month', filters.month.toString());
    if (filters.year) params.append('year', filters.year.toString());
    
    setLocation(`/submissions?${params}`);
  };

  const statsData = [
    {
      title: 'Submitted',
      value: stats?.submitted || 0,
      icon: Send,
      color: 'bg-blue-100 text-blue-800',
      iconBg: 'bg-blue-100',
      iconColor: 'text-primary',
      change: '+12%',
      trend: 'up',
      onClick: () => handleCardClick('submitted'),
    },
    {
      title: 'Under Review',
      value: stats?.pending || 0,
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-warning',
      change: '-3%',
      trend: 'down',
      onClick: () => handleCardClick('under_review'),
    },
    {
      title: 'Interviews',
      value: stats?.interviews || 0,
      icon: Calendar,
      color: 'bg-purple-100 text-purple-800',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      change: '+8%',
      trend: 'up',
      onClick: () => handleCardClick('interview_scheduled'),
    },
    {
      title: 'Hired',
      value: stats?.hired || 0,
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      change: '+15%',
      trend: 'up',
      onClick: () => handleCardClick('hired'),
    },
    {
      title: 'Rejected',
      value: stats?.rejected || 0,
      icon: XCircle,
      color: 'bg-red-100 text-red-800',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      change: '-5%',
      trend: 'down',
      onClick: () => handleCardClick('rejected'),
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-slate-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-8">
      {/* Filters */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Statistics</h3>
          <p className="text-sm text-slate-500">{getTimeframeLabel()}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select
            value={filters.timeframe}
            onValueChange={(value: 'weekly' | 'monthly' | 'yearly') => 
              setFilters({ ...filters, timeframe: value })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>

          {filters.timeframe === 'weekly' && (
            <>
              <Select
                value={filters.month?.toString()}
                onValueChange={(value) => 
                  setFilters({ ...filters, month: parseInt(value) })
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Month" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(0, i).toLocaleString('default', { month: 'short' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.week?.toString()}
                onValueChange={(value) => 
                  setFilters({ ...filters, week: parseInt(value) })
                }
              >
                <SelectTrigger className="w-24">
                  <SelectValue placeholder="Week" />
                </SelectTrigger>
                <SelectContent>
                  {getWeeksInMonth(filters.year || currentYear, filters.month || currentMonth).map((week) => (
                    <SelectItem key={week} value={week.toString()}>
                      Week {week}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}

          {filters.timeframe === 'monthly' && (
            <Select
              value={filters.month?.toString()}
              onValueChange={(value) => 
                setFilters({ ...filters, month: parseInt(value) })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(0, i).toLocaleString('default', { month: 'short' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {(filters.timeframe === 'monthly' || filters.timeframe === 'weekly') && (
            <Select
              value={filters.year?.toString()}
              onValueChange={(value) => 
                setFilters({ ...filters, year: parseInt(value) })
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {filters.timeframe === 'yearly' && (
            <Select
              value={filters.year?.toString()}
              onValueChange={(value) => 
                setFilters({ ...filters, year: parseInt(value) })
              }
            >
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => currentYear - i).map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statsData.map((stat) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <Card 
              key={stat.title} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={stat.onClick}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${stat.iconBg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>
                  <Badge className={stat.color}>
                    {getTimeframeLabel().split(' ')[0]} {getTimeframeLabel().split(' ')[1]}
                  </Badge>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-800 mb-1">
                  {stat.value}
                </h3>
                <p className="text-sm text-slate-600 mb-3">{stat.title}</p>
                
                <div className="flex items-center text-xs">
                  <TrendIcon className={`h-3 w-3 mr-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`font-medium mr-1 ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                  <span className="text-slate-500">vs last period</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

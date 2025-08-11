import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from "date-fns";
import type { WeeklyActivity } from "@/lib/types";

export default function ActivityChart() {
  const { data: activity = [], isLoading } = useQuery<WeeklyActivity[]>({
    queryKey: ["/api/dashboard/activity"],
  });

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getActivityForDay = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const dayActivity = activity.find(a => a.date === dateString);
    return dayActivity?.count || 0;
  };

  const maxCount = Math.max(...activity.map(a => a.count), 10);
  const totalSubmissions = activity.reduce((sum, a) => sum + a.count, 0);

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-slate-200 rounded w-32"></div>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-slate-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">Weekly Activity</CardTitle>
        <div className="text-sm text-slate-500">
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart Bars */}
          <div className="flex items-end justify-between h-32 space-x-2">
            {weekDays.map((day, index) => {
              const count = getActivityForDay(day);
              const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
              const isCurrentDay = isToday(day);
              
              return (
                <div key={index} className="flex flex-col items-center space-y-1 flex-1">
                  <div 
                    className={`w-full rounded-t transition-all duration-300 ${
                      isCurrentDay 
                        ? 'bg-primary shadow-md' 
                        : count > 0 
                          ? 'bg-primary/80' 
                          : 'bg-slate-300'
                    }`}
                    style={{ height: `${Math.max(height, 4)}%` }}
                    title={`${count} submissions on ${format(day, 'MMM d')}`}
                  />
                  <span className={`text-xs ${isCurrentDay ? 'font-medium text-primary' : 'text-slate-500'}`}>
                    {format(day, 'EEE')}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between text-sm pt-4 border-t">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span className="text-slate-600">Submissions</span>
            </div>
            <span className="font-medium text-slate-800">
              {totalSubmissions} total
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

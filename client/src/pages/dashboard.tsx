import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatsCards from "@/components/dashboard/StatsCards";
import RecentSubmissions from "@/components/dashboard/RecentSubmissions";
import FollowUpReminders from "@/components/dashboard/FollowUpReminders";
import ConsultantAnalytics from "@/components/dashboard/ConsultantAnalytics";
import RecruiterAnalytics from "@/components/dashboard/RecruiterAnalytics";
import VendorAnalytics from "@/components/dashboard/VendorAnalytics";
import ConsultantNotifications from "@/components/dashboard/ConsultantNotifications";
import TestAccountSwitcher from "@/components/TestAccountSwitcher";

export default function Dashboard() {
  const { user } = useAuth();
  
  useEffect(() => {
    document.title = "Dashboard - SVATech Systems LLC";
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-6 space-y-8">
      {/* Test Account Switcher - Development Only */}
      <TestAccountSwitcher />
      
      {/* Stats Cards */}
      <StatsCards />

      {/* Follow-up Reminders */}
      <FollowUpReminders />

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <RecentSubmissions />
      </div>

      {/* Comprehensive Analytics Dashboard */}
      <div className="space-y-8">
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">
            Advanced Analytics Dashboard
          </h2>
          
          <Tabs defaultValue="vendors" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="vendors">Vendor Analytics</TabsTrigger>
              <TabsTrigger value="notifications">Activity Notifications</TabsTrigger>
              <TabsTrigger value="consultants">Consultant Analytics</TabsTrigger>
              <TabsTrigger value="recruiters">Recruiter Performance</TabsTrigger>
            </TabsList>
            
            <TabsContent value="vendors" className="space-y-6">
              <VendorAnalytics />
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-6">
              <ConsultantNotifications />
            </TabsContent>
            
            <TabsContent value="consultants" className="space-y-6">
              <ConsultantAnalytics />
            </TabsContent>
            
            <TabsContent value="recruiters" className="space-y-6">
              <RecruiterAnalytics />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

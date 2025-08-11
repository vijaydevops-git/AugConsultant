import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Settings, Crown, Briefcase } from "lucide-react";

export default function TestAccountSwitcher() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Get current user info to show which account we're using
  const { data: user } = useQuery<any>({
    queryKey: ["/api/auth/user"],
  });

  const getCurrentUserInfo = () => {
    if (user?.id === 'admin-test-123') {
      return {
        type: 'ADMIN',
        email: 'admin@test.com',
        icon: Crown,
        color: 'bg-blue-100 text-blue-800 border-blue-200'
      };
    }
    if (user?.id === 'recruiter-test-456') {
      return {
        type: 'RECRUITER',
        email: 'recruiter@test.com', 
        icon: Briefcase,
        color: 'bg-green-100 text-green-800 border-green-200'
      };
    }
    return {
      type: 'ORIGINAL',
      email: user?.email || 'Unknown',
      icon: UserCheck,
      color: 'bg-gray-100 text-gray-800 border-gray-200'
    };
  };

  const currentUser = getCurrentUserInfo();
  const CurrentIcon = currentUser.icon;

  const switchAccount = async (userType: 'admin' | 'recruiter') => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType }),
        credentials: 'include',
      });
      
      if (response.ok) {
        // Reload the page to refresh all data
        window.location.reload();
      } else {
        console.error('Failed to switch account');
      }
    } catch (error) {
      console.error('Error switching account:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <Settings className="h-5 w-5" />
          Test Account Switcher
          <Badge variant="outline" className="text-orange-700 border-orange-300">
            Development Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current Account Display */}
        <div className="mb-4 p-3 border rounded-lg bg-slate-50">
          <div className="flex items-center gap-2 mb-2">
            <CurrentIcon className="h-5 w-5" />
            <span className="font-medium text-slate-700">Currently viewing as:</span>
            <Badge className={currentUser.color}>
              {currentUser.type} VIEW
            </Badge>
          </div>
          <p className="text-sm text-slate-600">
            Account: <span className="font-mono">{currentUser.email}</span>
          </p>
        </div>
        
        <div className="flex gap-4">
          <Button
            onClick={() => switchAccount('admin')}
            disabled={isLoading || currentUser.type === 'ADMIN'}
            variant="outline"
            className="flex items-center gap-2 border-blue-200 hover:bg-blue-50"
          >
            <Crown className="h-4 w-4" />
            {isLoading ? 'Switching...' : 'Switch to Admin View'}
          </Button>
          
          <Button
            onClick={() => switchAccount('recruiter')}
            disabled={isLoading || currentUser.type === 'RECRUITER'}
            variant="outline"
            className="flex items-center gap-2 border-green-200 hover:bg-green-50"
          >
            <Briefcase className="h-4 w-4" />
            {isLoading ? 'Switching...' : 'Switch to Recruiter View'}
          </Button>
        </div>
        
        <div className="mt-3 text-sm text-orange-700">
          <p><strong>Admin View:</strong> See all consultants, submissions, and vendors company-wide</p>
          <p><strong>Recruiter View:</strong> See only your assigned consultants, submissions, and vendors</p>
        </div>
      </CardContent>
    </Card>
  );
}
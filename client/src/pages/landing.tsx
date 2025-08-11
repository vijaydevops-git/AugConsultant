import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-gray-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            SVATech Systems LLC
          </h1>
          <p className="text-gray-600 mb-6">
            Consultant Tracking System
          </p>
          <Button 
            className="w-full bg-gray-900 hover:bg-gray-800 text-white"
            onClick={() => window.location.href = '/api/login'}
          >
            Sign In
          </Button>
        </div>

        {/* Demo Info */}
        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Demo Access:</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div>
              <strong>Admin:</strong> Use Replit login for full access
            </div>
            <div>
              <strong>Recruiter:</strong> Use Replit login for limited access
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Your role is automatically assigned based on your Replit account
          </p>
        </div>
      </div>
    </div>
  );
}

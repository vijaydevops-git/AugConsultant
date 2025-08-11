import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Download, Search } from "lucide-react";
import SubmissionList from "@/components/submissions/SubmissionList";
import SubmissionForm from "@/components/submissions/SubmissionForm";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export default function Submissions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [initialStatusFilter, setInitialStatusFilter] = useState<string>("");

  useEffect(() => {
    document.title = "Submissions - SVATech Systems LLC";
    
    // Handle URL search parameters
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const statusParam = urlParams.get('status');
    
    if (searchParam) {
      setSearchQuery(decodeURIComponent(searchParam));
    }
    
    if (statusParam) {
      setInitialStatusFilter(statusParam);
    }
  }, []);

  const handleExport = async () => {
    try {
      const response = await fetch('/api/submissions/export', {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'submissions.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Submissions data has been exported to CSV.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting the data.",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmission = (submission: any) => {
    setSelectedSubmission(submission);
    setIsFormOpen(true);
  };

  const handleNewSubmission = () => {
    setSelectedSubmission(null);
    setIsFormOpen(true);
  };

  const handleCloseForm = (open: boolean) => {
    if (!open) {
      setSelectedSubmission(null);
    }
    setIsFormOpen(open);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Submissions</h1>
          <p className="text-slate-500">Track consultant submissions through the recruitment pipeline</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </Button>
          
          <Button 
            onClick={handleNewSubmission}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Submission</span>
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search submissions by consultant name, vendor, or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <SubmissionList 
        searchQuery={searchQuery} 
        onEditSubmission={handleEditSubmission}
        initialStatusFilter={initialStatusFilter}
      />

      <SubmissionForm 
        open={isFormOpen} 
        onOpenChange={handleCloseForm}
        submission={selectedSubmission}
      />
    </div>
  );
}

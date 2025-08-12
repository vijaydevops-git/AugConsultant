import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Download, Building2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ConsultantStatusColors, StatusColors, StatusLabels } from "@/lib/types";
import type { Consultant, ConsultantWithSubmissions } from "@/lib/types";

interface ConsultantDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultant: Consultant | null;
}

export default function ConsultantDetailsModal({ 
  open, 
  onOpenChange, 
  consultant 
}: ConsultantDetailsModalProps) {
  
  const { data: consultantDetails } = useQuery<ConsultantWithSubmissions>({
    queryKey: ["/api/consultants", consultant?.id],
    queryFn: async () => {
      if (!consultant?.id) throw new Error("No consultant ID");
      const response = await fetch(`/api/consultants/${consultant.id}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch consultant details');
      return response.json();
    },
    enabled: !!consultant?.id && open,
  });

  const getInitials = (firstName: string, lastName: string) => {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  const handleDownloadResume = () => {
    if (consultant?.resumeUrl) {
      window.open(consultant.resumeUrl, '_blank');
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  if (!consultant) return null;

  const totalSubmissions = consultantDetails?.submissions?.length || 0;
  const hiredCount = consultantDetails?.submissions?.filter(s => s.status === 'hired').length || 0;
  const successRate = totalSubmissions > 0 ? (hiredCount / totalSubmissions) * 100 : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Consultant Details</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Section */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-50">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-primary rounded-full mx-auto flex items-center justify-center mb-4">
                    <span className="text-white text-2xl font-medium">
                      {getInitials(consultant.firstName, consultant.lastName)}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800">
                    {consultant.firstName} {consultant.lastName}
                  </h4>
                  <p className="text-slate-600">{consultant.position || 'Consultant'}</p>
                  {consultant.experience && (
                    <p className="text-sm text-slate-500">{consultant.experience}</p>
                  )}
                  <div className="mt-2">
                    <Badge className={ConsultantStatusColors[consultant.status as keyof typeof ConsultantStatusColors]}>
                      {consultant.status.charAt(0).toUpperCase() + consultant.status.slice(1)}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-700">{consultant.email}</span>
                  </div>
                  {consultant.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{consultant.phone}</span>
                    </div>
                  )}
                  {consultant.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      <span className="text-sm text-slate-700">{consultant.location}</span>
                    </div>
                  )}
                </div>
                
                {consultant.skills && consultant.skills.length > 0 && (
                  <div className="mt-6">
                    <h5 className="font-medium text-slate-800 mb-3">Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {consultant.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {consultant.resumeUrl && (
                  <div className="mt-6">
                    <Button 
                      className="w-full" 
                      onClick={handleDownloadResume}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Resume
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Performance & History Section */}
          <div className="lg:col-span-2">
            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="bg-blue-50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-primary">{totalSubmissions}</p>
                  <p className="text-sm text-slate-600">Total Submissions</p>
                </CardContent>
              </Card>
              <Card className="bg-green-50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{hiredCount}</p>
                  <p className="text-sm text-slate-600">Successful Hires</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-50">
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">{successRate.toFixed(0)}%</p>
                  <p className="text-sm text-slate-600">Success Rate</p>
                </CardContent>
              </Card>
            </div>
            
            {/* Submission History */}
            <Card>
              <CardContent className="p-6">
                <h5 className="font-medium text-slate-800 mb-4">Submission History</h5>
                {consultantDetails?.submissions && consultantDetails.submissions.length > 0 ? (
                  <div className="space-y-4 max-h-64 overflow-y-auto">
                    {consultantDetails.submissions.map((submission) => (
                      <div key={submission.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <h6 className="font-medium text-slate-800">{submission.vendor.name}</h6>
                          </div>
                          <Badge className={StatusColors[submission.status as keyof typeof StatusColors]}>
                            {StatusLabels[submission.status as keyof typeof StatusLabels]}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">{submission.positionTitle}</p>
                        <div className="flex items-center text-xs text-slate-500">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Submitted: {formatDate(submission.submissionDate.toString())}</span>
                        </div>
                        {submission.notes && (
                          <p className="text-xs text-slate-600 mt-2 italic">{submission.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-500">No submission history available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

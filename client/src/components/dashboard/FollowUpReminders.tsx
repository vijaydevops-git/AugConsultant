import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, AlertTriangle, PhoneCall, Calendar } from "lucide-react";
import { format } from "date-fns";
import FollowUpModal from "../submissions/FollowUpModal";
import type { SubmissionWithRelations } from "@/lib/types";

interface FollowUpReminder {
  id: string;
  consultantName: string;
  vendorName: string;
  positionTitle: string;
  status: string;
  nextFollowUpDate: string;
  lastVendorContact: string | null;
  vendorFeedback: string | null;
  daysSinceContact: number;
  daysPastDue: number;
}

export default function FollowUpReminders() {
  const [selectedFollowUpSubmission, setSelectedFollowUpSubmission] = useState<SubmissionWithRelations | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const { data: allReminders = [], isLoading } = useQuery<FollowUpReminder[]>({
    queryKey: ['/api/dashboard/follow-up-reminders'],
  });

  const { data: overdueReminders = [] } = useQuery<FollowUpReminder[]>({
    queryKey: ['/api/dashboard/follow-up-reminders', { overdue: true }],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/follow-up-reminders?overdue=true');
      if (!response.ok) throw new Error('Failed to fetch overdue reminders');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Follow-up Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const dueToday = allReminders.filter(r => {
    const followUpDate = new Date(r.nextFollowUpDate);
    const followUpDay = new Date(followUpDate.getFullYear(), followUpDate.getMonth(), followUpDate.getDate());
    return followUpDay.getTime() === today.getTime();
  });

  const dueSoon = allReminders.filter(r => {
    const followUpDate = new Date(r.nextFollowUpDate);
    const daysUntilDue = Math.ceil((followUpDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue > 0 && daysUntilDue <= 3;
  });

  const getUrgencyColor = (reminder: FollowUpReminder) => {
    if (reminder.daysPastDue > 0) return "border-red-200 bg-red-50";
    if (reminder.daysPastDue === 0) return "border-yellow-200 bg-yellow-50";
    return "border-blue-200 bg-blue-50";
  };

  const getUrgencyBadge = (reminder: FollowUpReminder) => {
    if (reminder.daysPastDue > 0) {
      return <Badge variant="destructive" className="text-xs">Overdue ({reminder.daysPastDue}d)</Badge>;
    }
    if (reminder.daysPastDue === 0) {
      return <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">Due Today</Badge>;
    }
    const daysUntil = Math.abs(reminder.daysPastDue);
    return <Badge variant="outline" className="text-xs">{daysUntil}d remaining</Badge>;
  };

  const handleUpdateFollowUp = async (submissionId: string) => {
    try {
      // Fetch the full submission data for the modal
      const response = await fetch(`/api/submissions/${submissionId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch submission');
      const submission = await response.json();
      
      setSelectedFollowUpSubmission(submission);
      setIsFollowUpModalOpen(true);
    } catch (error) {
      console.error('Error fetching submission:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PhoneCall className="h-5 w-5 text-blue-600" />
          Vendor Follow-up Reminders
          {overdueReminders.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {overdueReminders.length} Overdue
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allReminders.length === 0 ? (
          <div className="text-center py-6">
            <Clock className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No follow-up reminders set</p>
            <p className="text-sm text-slate-400 mt-1">
              Set follow-up dates when vendors give you timelines
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Overdue Alert */}
            {overdueReminders.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <strong>{overdueReminders.length} follow-up{overdueReminders.length > 1 ? 's' : ''} overdue!</strong>
                  {" "}Contact these vendors immediately.
                </AlertDescription>
              </Alert>
            )}

            {/* Due Today Alert */}
            {dueToday.length > 0 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Calendar className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>{dueToday.length} follow-up{dueToday.length > 1 ? 's' : ''} due today</strong>
                </AlertDescription>
              </Alert>
            )}

            {/* Follow-up List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {allReminders
                .sort((a, b) => b.daysPastDue - a.daysPastDue) // Overdue first
                .slice(0, 10) // Show top 10
                .map((reminder) => (
                  <div
                    key={reminder.id}
                    className={`p-4 rounded-lg border ${getUrgencyColor(reminder)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-sm">
                          {reminder.consultantName} → {reminder.vendorName}
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          {reminder.positionTitle}
                        </p>
                      </div>
                      {getUrgencyBadge(reminder)}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 mb-2">
                      <div>
                        <span className="font-medium">Follow-up due:</span>
                        <p>{format(new Date(reminder.nextFollowUpDate), 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <span className="font-medium">Last contact:</span>
                        <p>
                          {reminder.lastVendorContact 
                            ? `${format(new Date(reminder.lastVendorContact), 'MMM dd')} (${reminder.daysSinceContact}d ago)`
                            : 'Never contacted'
                          }
                        </p>
                      </div>
                    </div>

                    {reminder.vendorFeedback && (
                      <div className="text-xs bg-white rounded p-2 border">
                        <span className="font-medium">Last vendor feedback:</span>
                        <p className="text-slate-600 mt-1 italic">"{reminder.vendorFeedback}"</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="outline" className="text-xs">
                        {reminder.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium h-auto p-1"
                        onClick={() => handleUpdateFollowUp(reminder.id)}
                      >
                        Update Follow-up →
                      </Button>
                    </div>
                  </div>
                ))}
            </div>

            {allReminders.length > 10 && (
              <p className="text-center text-sm text-slate-500 mt-4">
                Showing 10 of {allReminders.length} follow-ups
              </p>
            )}
          </div>
        )}
      </CardContent>
      
      {/* Follow-up Modal */}
      {selectedFollowUpSubmission && (
        <FollowUpModal
          open={isFollowUpModalOpen}
          onOpenChange={(open) => {
            setIsFollowUpModalOpen(open);
            if (!open) {
              setSelectedFollowUpSubmission(null);
            }
          }}
          submission={selectedFollowUpSubmission}
        />
      )}
    </Card>
  );
}
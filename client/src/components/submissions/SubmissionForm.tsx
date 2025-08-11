import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import type { Consultant, Vendor, SubmissionWithRelations } from "@/lib/types";

const submissionSchema = z.object({
  consultantId: z.string().min(1, "Consultant is required"),
  vendorId: z.string().min(1, "Vendor is required"),
  positionTitle: z.string().min(1, "Position title is required"),
  clientName: z.string().optional(),
  endClientName: z.string().optional(),
  submissionDate: z.string().min(1, "Submission date is required"),
  status: z.string().min(1, "Status is required"),
  lastVendorContact: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
  vendorFeedback: z.string().optional(),
  notes: z.string().optional(),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface SubmissionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission?: SubmissionWithRelations | null;
}

export default function SubmissionForm({ open, onOpenChange, submission }: SubmissionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewVendorForm, setShowNewVendorForm] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");

  const { data: consultants = [] } = useQuery<Consultant[]>({
    queryKey: ["/api/consultants"],
    enabled: open,
  });

  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
    enabled: open,
  });

  const createVendorMutation = useMutation({
    mutationFn: async (vendorData: { name: string }) => {
      const response = await apiRequest("POST", "/api/vendors", vendorData);
      return await response.json();
    },
    onSuccess: (newVendor) => {
      queryClient.invalidateQueries({ queryKey: ["/api/vendors"] });
      form.setValue("vendorId", newVendor.id);
      setShowNewVendorForm(false);
      setNewVendorName("");
      toast({
        title: "Success!",
        description: `Vendor "${newVendor.name}" has been created and selected.`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create vendor. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isEditing = !!submission;

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      consultantId: submission?.consultantId || "",
      vendorId: submission?.vendorId || "",
      positionTitle: submission?.positionTitle || "",
      clientName: submission?.clientName || "",
      endClientName: submission?.endClientName || "",
      submissionDate: submission ? new Date(submission.submissionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      status: submission?.status || "submitted",
      lastVendorContact: submission?.lastVendorContact ? new Date(submission.lastVendorContact).toISOString().split('T')[0] : "",
      nextFollowUpDate: submission?.nextFollowUpDate ? new Date(submission.nextFollowUpDate).toISOString().split('T')[0] : "",
      vendorFeedback: submission?.vendorFeedback || "",
      notes: submission?.notes || "",
    },
  });

  const submitSubmissionMutation = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      const url = isEditing ? `/api/submissions/${submission.id}` : '/api/submissions';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Failed to ${isEditing ? 'update' : 'create'} submission`);
      return response.json();
    },
    onSuccess: () => {
      // Force refresh all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/recent-submissions"] });
      
      // Also force refetch immediately
      queryClient.refetchQueries({ queryKey: ["/api/submissions"] });
      
      toast({
        title: isEditing ? "Submission Updated" : "Submission Created",
        description: `The submission has been ${isEditing ? 'updated' : 'created'} successfully.`,
      });
      
      form.reset();
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Submission mutation error:', error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: isEditing ? "Update Failed" : "Creation Failed",
        description: `There was an error ${isEditing ? 'updating' : 'creating'} the submission.`,
        variant: "destructive",
      });
    },
  });

  // Reset form when submission prop changes
  useEffect(() => {
    if (open) {
      const defaultValues = {
        consultantId: submission?.consultantId || "",
        vendorId: submission?.vendorId || "",
        positionTitle: submission?.positionTitle || "",
        submissionDate: submission ? new Date(submission.submissionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        status: submission?.status || "submitted",
        lastVendorContact: submission?.lastVendorContact ? new Date(submission.lastVendorContact).toISOString().split('T')[0] : "",
        nextFollowUpDate: submission?.nextFollowUpDate ? new Date(submission.nextFollowUpDate).toISOString().split('T')[0] : "",
        vendorFeedback: submission?.vendorFeedback || "",
        notes: submission?.notes || "",
      };
      
      form.reset(defaultValues);
    }
  }, [submission, open, form]);

  const onSubmit = (data: SubmissionFormData) => {
    submitSubmissionMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Submission" : "New Submission"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="consultantId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Consultant</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select consultant..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {consultants.map((consultant) => (
                          <SelectItem key={consultant.id} value={consultant.id}>
                            {consultant.firstName} {consultant.lastName} - {consultant.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vendorId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendor</FormLabel>
                    {!showNewVendorForm ? (
                      <Select 
                        onValueChange={(value) => {
                          if (value === "create_new") {
                            setShowNewVendorForm(true);
                          } else {
                            field.onChange(value);
                          }
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select vendor..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="create_new" className="text-blue-600 font-medium">
                            <div className="flex items-center">
                              <Plus className="h-4 w-4 mr-2" />
                              Create New Vendor
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter vendor name..."
                            value={newVendorName}
                            onChange={(e) => setNewVendorName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (newVendorName.trim()) {
                                  createVendorMutation.mutate({ name: newVendorName.trim() });
                                }
                              }
                            }}
                          />
                          <Button 
                            type="button"
                            onClick={() => {
                              if (newVendorName.trim()) {
                                createVendorMutation.mutate({ name: newVendorName.trim() });
                              }
                            }}
                            disabled={!newVendorName.trim() || createVendorMutation.isPending}
                            size="sm"
                          >
                            {createVendorMutation.isPending ? "Creating..." : "Create"}
                          </Button>
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowNewVendorForm(false);
                              setNewVendorName("");
                            }}
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="positionTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Senior React Developer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <FormControl>
                      <Input placeholder="Direct client name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endClientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Client</FormLabel>
                    <FormControl>
                      <Input placeholder="End client name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="submissionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Submission Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="submitted">Submitted</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="pending">Pending Response</SelectItem>
                        <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                        <SelectItem value="interviewed">Interviewed</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="withdrawn">Withdrawn</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Follow-up Tracking Section */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-medium text-slate-700 mb-4">Vendor Follow-up Tracking</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="lastVendorContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Vendor Contact</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nextFollowUpDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Follow-up Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="vendorFeedback"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Vendor Feedback</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Last response or feedback from vendor..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Additional notes about this submission..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitSubmissionMutation.isPending}
              >
                {submitSubmissionMutation.isPending 
                  ? (isEditing ? "Updating..." : "Creating...") 
                  : (isEditing ? "Update Submission" : "Create Submission")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

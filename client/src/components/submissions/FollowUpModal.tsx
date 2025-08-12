import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PhoneCall, Calendar, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import type { SubmissionWithRelations } from "@/lib/types";

const followUpSchema = z.object({
  lastVendorContact: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
  vendorFeedback: z.string().optional(),
});

type FollowUpFormData = z.infer<typeof followUpSchema>;

interface FollowUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submission: SubmissionWithRelations | null;
}

export default function FollowUpModal({ open, onOpenChange, submission }: FollowUpModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FollowUpFormData>({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      lastVendorContact: "",
      nextFollowUpDate: "",
      vendorFeedback: "",
    },
  });

  // Reset form when submission changes
  React.useEffect(() => {
    if (submission && open) {
      form.reset({
        lastVendorContact: submission.lastVendorContact 
          ? format(new Date(submission.lastVendorContact), 'yyyy-MM-dd')
          : "",
        nextFollowUpDate: submission.nextFollowUpDate
          ? format(new Date(submission.nextFollowUpDate), 'yyyy-MM-dd')  
          : "",
        vendorFeedback: submission.vendorFeedback || "",
      });
    }
  }, [submission, open, form]);

  const updateFollowUpMutation = useMutation({
    mutationFn: async (data: FollowUpFormData) => {
      const response = await fetch(`/api/submissions/${submission?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastVendorContact: data.lastVendorContact || null,
          nextFollowUpDate: data.nextFollowUpDate || null,
          vendorFeedback: data.vendorFeedback || null,
        }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to update follow-up info');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/submissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/follow-up-reminders"] });
      
      toast({
        title: "Follow-up Updated",
        description: "Follow-up information has been updated successfully.",
      });
      
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "There was an error updating the follow-up information.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FollowUpFormData) => {
    updateFollowUpMutation.mutate(data);
  };

  const setQuickFollowUp = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    form.setValue("nextFollowUpDate", format(date, 'yyyy-MM-dd'));
    form.setValue("lastVendorContact", format(new Date(), 'yyyy-MM-dd'));
  };

  if (!submission) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneCall className="h-5 w-5 text-blue-600" />
            Update Follow-up
          </DialogTitle>
          <div className="text-sm text-slate-600">
            {submission.consultant.firstName} {submission.consultant.lastName} → {submission.vendor.name}
          </div>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Quick Follow-up Buttons */}
            <div className="flex flex-wrap gap-2 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700 w-full mb-2">Quick set follow-up:</p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => setQuickFollowUp(1)}
              >
                Tomorrow
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => setQuickFollowUp(3)}
              >
                3 days
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => setQuickFollowUp(7)}
              >
                1 week
              </Button>
            </div>

            <FormField
              control={form.control}
              name="lastVendorContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Last Vendor Contact
                  </FormLabel>
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
                  <FormLabel className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Next Follow-up Date
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="vendorFeedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Vendor Feedback
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What did the vendor say?"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateFollowUpMutation.isPending}
              >
                {updateFollowUpMutation.isPending ? "Updating..." : "Update Follow-up"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Upload, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Consultant } from "@/lib/types";

const consultantSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  location: z.string().optional(),
  position: z.string().optional(),
  experience: z.string().optional(),
  status: z.string().min(1, "Status is required"),
});

type ConsultantFormData = z.infer<typeof consultantSchema>;

interface ConsultantFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  consultant?: Consultant | null;
}

export default function ConsultantForm({ open, onOpenChange, consultant }: ConsultantFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!consultant;
  const [skills, setSkills] = useState<string[]>(consultant?.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<ConsultantFormData>({
    resolver: zodResolver(consultantSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      location: "",
      position: "",
      experience: "",
      status: "active",
    },
  });

  // Reset form when consultant changes
  useEffect(() => {
    if (consultant) {
      form.reset({
        firstName: consultant.firstName || "",
        lastName: consultant.lastName || "",
        email: consultant.email || "",
        phone: consultant.phone || "",
        location: consultant.location || "",
        position: consultant.position || "",
        experience: consultant.experience || "",
        status: consultant.status || "active",
      });
      setSkills(consultant.skills || []);
    } else {
      form.reset({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        location: "",
        position: "",
        experience: "",
        status: "active",
      });
      setSkills([]);
    }
    setNewSkill("");
    setSelectedFile(null);
  }, [consultant, form]);

  const saveConsultantMutation = useMutation({
    mutationFn: async (data: ConsultantFormData) => {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      
      formData.append('skills', JSON.stringify(skills));
      
      if (selectedFile) {
        formData.append('resume', selectedFile);
      }

      if (isEditing && consultant) {
        // Update existing consultant
        return await apiRequest("PUT", `/api/consultants/${consultant.id}`, {
          ...data,
          skills,
        });
      } else {
        // Create new consultant
        const response = await fetch('/api/consultants', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
        if (!response.ok) throw new Error('Failed to create consultant');
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consultants"] });
      
      toast({
        title: isEditing ? "Consultant Updated" : "Consultant Created",
        description: isEditing 
          ? "The consultant has been updated successfully."
          : "The consultant has been added successfully.",
      });
      
      form.reset();
      setSkills([]);
      setNewSkill("");
      setSelectedFile(null);
      onOpenChange(false);
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
        title: isEditing ? "Update Failed" : "Creation Failed",
        description: isEditing 
          ? "There was an error updating the consultant."
          : "There was an error creating the consultant.",
        variant: "destructive",
      });
    },
  });

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF, DOC, or DOCX file.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const onSubmit = (data: ConsultantFormData) => {
    saveConsultantMutation.mutate(data);
  };

  const experienceOptions = [
    "1+ years",
    "2+ years",
    "3+ years", 
    "4+ years",
    "5+ years",
    "6+ years",
    "7+ years",
    "8+ years",
    "9+ years",
    "10+ years",
    "11+ years",
    "12+ years",
    "13+ years",
    "14+ years",
    "15+ years",
    "16+ years",
    "17+ years",
    "18+ years",
    "19+ years",
    "20+ years"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Consultant" : "Add New Consultant"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Position</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Senior Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {experienceOptions.map((exp) => (
                          <SelectItem key={exp} value={exp}>
                            {exp}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., San Francisco, CA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Skills Section */}
            <div className="space-y-3">
              <FormLabel>Skills</FormLabel>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a skill..."
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                />
                <Button type="button" onClick={addSkill} disabled={!newSkill.trim()}>
                  Add
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {/* Resume Upload */}
            <div className="space-y-3">
              <FormLabel>Resume</FormLabel>
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6">
                {selectedFile ? (
                  <div className="flex items-center space-x-3">
                    <File className="h-8 w-8 text-slate-400" />
                    <div className="flex-1">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-slate-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-slate-400" />
                    <div className="mt-4">
                      <label htmlFor="resume-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-slate-900">
                          Drop files here or click to upload
                        </span>
                        <span className="mt-1 block text-xs text-slate-500">
                          PDF, DOC, DOCX up to 5MB
                        </span>
                      </label>
                      <input
                        id="resume-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
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
                disabled={saveConsultantMutation.isPending}
              >
                {saveConsultantMutation.isPending ? 
                  (isEditing ? "Updating..." : "Creating...") : 
                  (isEditing ? "Update Consultant" : "Add Consultant")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

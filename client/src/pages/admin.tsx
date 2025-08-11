import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Users, Mail, Settings, Plus, Trash2, Edit, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const userFormSchema = z.object({
  id: z.string().optional(),
  email: z.string().email("Please enter a valid email"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["admin", "recruiter"]),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

const emailReportSchema = z.object({
  reportType: z.enum(["daily", "weekly", "monthly"]),
  recipientEmails: z.string().min(1, "At least one email is required"),
  senderEmail: z.string().email("Please enter a valid sender email"),
});

type UserFormData = z.infer<typeof userFormSchema>;
type EmailReportData = z.infer<typeof emailReportSchema>;

export default function AdminPage() {
  const { toast } = useToast();
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Users query
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      return response.json();
    },
  });

  // User form
  const userForm = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      username: "",
      firstName: "",
      lastName: "",
      role: "recruiter",
      password: "",
    },
  });

  // Email report form
  const reportForm = useForm<EmailReportData>({
    resolver: zodResolver(emailReportSchema),
    defaultValues: {
      reportType: "weekly",
      recipientEmails: "",
      senderEmail: "",
    },
  });

  // Create/Update user mutation
  const userMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const options = {
        method: editingUser ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      };
      
      if (editingUser) {
        return await fetch(`/api/admin/users/${editingUser.id}`, options).then(r => r.json());
      } else {
        return await fetch("/api/admin/users", options).then(r => r.json());
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowUserDialog(false);
      setEditingUser(null);
      userForm.reset();
      toast({
        title: editingUser ? "User updated" : "User created",
        description: `Successfully ${editingUser ? "updated" : "created"} user account.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingUser ? "update" : "create"} user`,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      }).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "User account has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Send report mutation
  const sendReportMutation = useMutation({
    mutationFn: async (data: EmailReportData) => {
      const emailList = data.recipientEmails.split(',').map(email => email.trim()).filter(Boolean);
      return await fetch("/api/reports/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          recipientEmails: emailList,
        }),
      }).then(r => r.json());
    },
    onSuccess: () => {
      toast({
        title: "Report sent",
        description: "Email report has been sent successfully.",
      });
      reportForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send report",
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    userForm.reset({
      id: user.id,
      email: user.email || "",
      username: user.username || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role,
    });
    setShowUserDialog(true);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    userForm.reset({
      email: "",
      username: "",
      firstName: "",
      lastName: "",
      role: "recruiter",
      password: "",
    });
    setShowUserDialog(true);
  };

  const onUserSubmit = async (data: UserFormData) => {
    userMutation.mutate(data);
  };

  const onReportSubmit = async (data: EmailReportData) => {
    sendReportMutation.mutate(data);
  };

  const previewReport = (reportType: string) => {
    window.open(`/api/reports/preview/${reportType}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <p className="text-gray-600 mt-2">Manage users, send reports, and configure system settings</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Reports
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">User Accounts</h2>
            <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateUser} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
                  <DialogDescription>
                    {editingUser ? "Update user account details" : "Create a new recruiter account"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...userForm}>
                  <form onSubmit={userForm.handleSubmit(onUserSubmit)} className="space-y-4">
                    <FormField
                      control={userForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={userForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={userForm.control}
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
                        control={userForm.control}
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
                    <FormField
                      control={userForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="recruiter">Recruiter</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {!editingUser && (
                      <FormField
                        control={userForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowUserDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={userMutation.isPending}>
                        {editingUser ? "Update" : "Create"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              {usersLoading ? (
                <div className="p-6 text-center text-gray-500">Loading users...</div>
              ) : (users as any[]).length === 0 ? (
                <div className="p-6 text-center text-gray-500">No users found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {(users as any[]).map((user: any) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">@{user.username}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditUser(user)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                disabled={deleteUserMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <h2 className="text-xl font-semibold">Email Reports</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Send Report</CardTitle>
                <CardDescription>
                  Send submission reports to specified email addresses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...reportForm}>
                  <form onSubmit={reportForm.handleSubmit(onReportSubmit)} className="space-y-4">
                    <FormField
                      control={reportForm.control}
                      name="reportType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Report Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">Daily Report</SelectItem>
                              <SelectItem value="weekly">Weekly Report</SelectItem>
                              <SelectItem value="monthly">Monthly Report</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={reportForm.control}
                      name="recipientEmails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recipient Emails</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="email1@example.com, email2@example.com"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={reportForm.control}
                      name="senderEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sender Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="reports@company.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" disabled={sendReportMutation.isPending} className="w-full">
                      Send Report
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Preview Reports</CardTitle>
                <CardDescription>
                  Preview how your reports will look before sending
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  onClick={() => previewReport('daily')}
                  className="w-full flex items-center justify-between"
                >
                  <span>Preview Daily Report</span>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => previewReport('weekly')}
                  className="w-full flex items-center justify-between"
                >
                  <span>Preview Weekly Report</span>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => previewReport('monthly')}
                  className="w-full flex items-center justify-between"
                >
                  <span>Preview Monthly Report</span>
                  <Eye className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <h2 className="text-xl font-semibold">System Settings</h2>
          
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>
                Configure AWS SES settings for automated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label>AWS SES Status</Label>
                  <div className="mt-2">
                    <Badge variant="secondary">
                      Configuration Status
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    AWS SES configuration is managed through environment variables. Ensure AWS credentials and verified sender email are configured.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
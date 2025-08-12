import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import ConsultantList from "@/components/consultants/ConsultantList";
import ConsultantForm from "@/components/consultants/ConsultantForm";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import type { Consultant } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Consultants() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<Consultant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  
  const isAdmin = user && user.role === 'admin';

  // Get search parameter from URL (dashboard navigation)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const search = urlParams.get('search');
    if (search) {
      setSearchQuery(search);
    }
  }, [location]);

  useEffect(() => {
    document.title = "Consultants - SVATech Systems LLC";
  }, []);

  const handleEditConsultant = (consultant: Consultant) => {
    setEditingConsultant(consultant);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingConsultant(null);
  };

  const deleteConsultantMutation = useMutation({
    mutationFn: async (consultantId: string) => {
      await apiRequest(`/api/consultants/${consultantId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/consultants'] });
      toast({
        title: "Success",
        description: "Consultant deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete consultant",
        variant: "destructive",
      });
    },
  });

  const handleDeleteConsultant = (consultant: Consultant) => {
    if (window.confirm(`Are you sure you want to delete ${consultant.firstName} ${consultant.lastName}? This action cannot be undone.`)) {
      deleteConsultantMutation.mutate(consultant.id);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Consultants</h1>
          <p className="text-slate-500">Manage consultant profiles, skills, and performance</p>
        </div>
        
        {isAdmin && (
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Consultant</span>
          </Button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search consultants by name, email, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <ConsultantList 
        searchQuery={searchQuery} 
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onEditConsultant={handleEditConsultant}
        onDeleteConsultant={handleDeleteConsultant}
      />

      <ConsultantForm 
        open={isFormOpen} 
        onOpenChange={handleFormClose}
        consultant={editingConsultant}
      />
    </div>
  );
}

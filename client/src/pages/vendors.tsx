import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import VendorList from "@/components/vendors/VendorList";
import VendorForm from "@/components/vendors/VendorForm";
import { useAuth } from "@/hooks/useAuth";
import type { Vendor } from "@/lib/types";

export default function Vendors() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    document.title = "Vendors - SVATech Systems LLC";
  }, []);

  const canAddVendor = user?.role === 'admin' || user?.role === 'recruiter';

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingVendor(null);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vendors</h1>
          <p className="text-slate-500">Manage vendor partnerships and performance metrics</p>
        </div>
        
        {canAddVendor && (
          <Button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Vendor</span>
          </Button>
        )}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search vendors by name, contact person, or specialties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <VendorList 
        searchQuery={searchQuery} 
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onEditVendor={handleEditVendor}
      />

      {canAddVendor && (
        <VendorForm 
          open={isFormOpen} 
          onOpenChange={handleFormClose}
          vendor={editingVendor}
        />
      )}
    </div>
  );
}

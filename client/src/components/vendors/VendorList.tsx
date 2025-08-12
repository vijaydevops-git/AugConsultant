import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2, Mail, Phone, MapPin, Calendar, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { VendorStatusColors } from "@/lib/types";
import type { Vendor } from "@/lib/types";

interface VendorListProps {
  searchQuery: string;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onEditVendor?: (vendor: Vendor) => void;
}

export default function VendorList({ 
  searchQuery, 
  statusFilter, 
  onStatusFilterChange,
  onEditVendor
}: VendorListProps) {
  const { user } = useAuth();
  const canEditVendor = user && (user.role === 'admin' || user.role === 'recruiter');

  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors", { search: searchQuery, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/vendors?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch vendors');
      return response.json();
    },
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse border border-slate-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                  <div>
                    <div className="h-5 bg-slate-200 rounded w-32 mb-2"></div>
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-slate-200 rounded w-40"></div>
                  <div className="h-3 bg-slate-200 rounded w-32"></div>
                  <div className="h-3 bg-slate-200 rounded w-36"></div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-6 bg-slate-200 rounded w-16"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">All Vendors</h3>
          
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {vendors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No vendors found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {vendors.map((vendor) => (
              <div 
                key={vendor.id} 
                className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">{vendor.name}</h4>
                    {vendor.contactPerson && (
                      <p className="text-sm text-slate-500">{vendor.contactPerson}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={VendorStatusColors[vendor.status as keyof typeof VendorStatusColors]}>
                      {vendor.status.charAt(0).toUpperCase() + vendor.status.slice(1)}
                    </Badge>
                    {canEditVendor && onEditVendor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditVendor(vendor)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {vendor.email && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{vendor.email}</span>
                    </div>
                  )}
                  {vendor.phone && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Phone className="h-3 w-3" />
                      <span>{vendor.phone}</span>
                    </div>
                  )}
                  {vendor.location && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{vendor.location}</span>
                    </div>
                  )}
                  {vendor.partnershipDate && (
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Calendar className="h-3 w-3" />
                      <span>Partner since {formatDate(vendor.partnershipDate.toString())}</span>
                    </div>
                  )}
                </div>

                {vendor.notes && (
                  <div className="mb-4 p-3 bg-slate-50 rounded-md border">
                    <h5 className="text-sm font-medium text-slate-700 mb-2">Notes</h5>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-3">
                      {vendor.notes}
                    </p>
                  </div>
                )}
                
                {vendor.specialties && vendor.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {vendor.specialties.slice(0, 3).map((specialty, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                    {vendor.specialties.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{vendor.specialties.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

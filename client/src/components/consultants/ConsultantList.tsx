import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mail, Phone, MapPin, Download, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { ConsultantStatusColors } from "@/lib/types";
import type { Consultant } from "@/lib/types";
import ConsultantDetailsModal from "./ConsultantDetailsModal";
import { useAuth } from "@/hooks/useAuth";

interface ConsultantListProps {
  searchQuery: string;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  onEditConsultant?: (consultant: Consultant) => void;
  onDeleteConsultant?: (consultant: Consultant) => void;
}

export default function ConsultantList({ 
  searchQuery, 
  statusFilter, 
  onStatusFilterChange,
  onEditConsultant,
  onDeleteConsultant
}: ConsultantListProps) {
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin';
  const canEditConsultant = user && (user.role === 'admin' || user.role === 'recruiter');
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { data: consultants = [], isLoading } = useQuery<Consultant[]>({
    queryKey: ["/api/consultants", { search: searchQuery, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/consultants?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch consultants');
      return response.json();
    },
  });

  const getInitials = (firstName: string, lastName: string) => {
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  };

  const getColorByIndex = (index: number) => {
    const colors = [
      'bg-blue-600',
      'bg-green-600', 
      'bg-purple-600',
      'bg-yellow-600',
      'bg-red-600',
      'bg-indigo-600'
    ];
    return colors[index % colors.length];
  };

  const handleViewDetails = (consultant: Consultant) => {
    setSelectedConsultant(consultant);
    setIsDetailsModalOpen(true);
  };

  const handleDownloadResume = (consultant: Consultant) => {
    if (consultant.resumeUrl) {
      window.open(consultant.resumeUrl, '_blank');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse border border-slate-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-slate-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-slate-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-slate-200 rounded w-32"></div>
                  <div className="h-3 bg-slate-200 rounded w-28"></div>
                  <div className="h-3 bg-slate-200 rounded w-36"></div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-6 bg-slate-200 rounded w-12"></div>
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
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">All Consultants</h3>
            
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {consultants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500">No consultants found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {consultants.map((consultant, index) => (
                <div 
                  key={consultant.id} 
                  className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 ${getColorByIndex(index)} rounded-full flex items-center justify-center`}>
                        <span className="text-white font-medium">
                          {getInitials(consultant.firstName, consultant.lastName)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-800">
                          {consultant.firstName} {consultant.lastName}
                        </h4>
                        <p className="text-sm text-slate-500">
                          {consultant.position || 'Consultant'}
                        </p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(consultant)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {canEditConsultant && onEditConsultant && (
                          <DropdownMenuItem onClick={() => onEditConsultant(consultant)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Consultant
                          </DropdownMenuItem>
                        )}
                        {isAdmin && onDeleteConsultant && (
                          <DropdownMenuItem 
                            onClick={() => onDeleteConsultant(consultant)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Consultant
                          </DropdownMenuItem>
                        )}
                        {consultant.resumeUrl && (
                          <DropdownMenuItem onClick={() => handleDownloadResume(consultant)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Resume
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{consultant.email}</span>
                    </div>
                    {consultant.phone && (
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <Phone className="h-3 w-3" />
                        <span>{consultant.phone}</span>
                      </div>
                    )}
                    {consultant.location && (
                      <div className="flex items-center space-x-2 text-sm text-slate-600">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{consultant.location}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={ConsultantStatusColors[consultant.status as keyof typeof ConsultantStatusColors]}>
                      {consultant.status.charAt(0).toUpperCase() + consultant.status.slice(1)}
                    </Badge>
                    {consultant.experience && (
                      <span className="text-xs text-slate-500">{consultant.experience}</span>
                    )}
                  </div>
                  
                  {consultant.skills && consultant.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {consultant.skills.slice(0, 3).map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {consultant.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{consultant.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  {consultant.resumeUrl && (
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => handleDownloadResume(consultant)}
                      >
                        <Download className="h-3 w-3 mr-2" />
                        {consultant.resumeFileName || 'Resume'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConsultantDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        consultant={selectedConsultant}
      />
    </>
  );
}

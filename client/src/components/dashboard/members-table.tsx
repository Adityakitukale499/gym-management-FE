import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Member } from "@shared/schema";
import { format } from "date-fns";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface MembersTableProps {
  onViewMember: (member: Member) => void;
}

export default function MembersTable({ onViewMember }: MembersTableProps) {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  
  // Construct query parameter string
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (searchTerm) {
    if (searchTerm.match(/^\d+$/)) {
      queryParams.append("phone", searchTerm);
    } else {
      queryParams.append("name", searchTerm);
    }
  }
  
  if (filter) {
    queryParams.append("status", filter);
  }
  
  // Fetch members
  const { data, isLoading } = useQuery({
    queryKey: [`/api/members?${queryParams.toString()}`],
  });
  
  const members = data?.members || [];
  const total = data?.pagination?.total || 0;
  const totalPages = data?.pagination?.totalPages || 0;
  
  // Get member status badge
  const getMemberStatusBadge = (member: Member) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (!member.isActive) {
      return <Badge variant="outline">Inactive</Badge>;
    } else if (member.nextBillDate < today) {
      return <Badge variant="destructive">Expired</Badge>;
    } else {
      const nextBillDate = new Date(member.nextBillDate);
      const currentDate = new Date();
      const daysDifference = Math.ceil((nextBillDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDifference <= 3) {
        return <Badge variant="warning">Expiring Soon</Badge>;
      } else {
        return <Badge variant="success">Active</Badge>;
      }
    }
  };

  // Generate pagination links
  const renderPaginationLinks = () => {
    const links = [];
    
    // Always show first page
    links.push(
      <PaginationItem key="first">
        <PaginationLink
          isActive={page === 1}
          onClick={() => setPage(1)}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );
    
    // Add ellipsis if needed
    if (page > 3) {
      links.push(
        <PaginationItem key="ellipsis1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Add previous page if not first page
    if (page > 2) {
      links.push(
        <PaginationItem key={page - 1}>
          <PaginationLink onClick={() => setPage(page - 1)}>
            {page - 1}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add current page if not first page
    if (page > 1 && page < totalPages) {
      links.push(
        <PaginationItem key={page}>
          <PaginationLink isActive onClick={() => setPage(page)}>
            {page}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add next page if not last page
    if (page < totalPages - 1) {
      links.push(
        <PaginationItem key={page + 1}>
          <PaginationLink onClick={() => setPage(page + 1)}>
            {page + 1}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Add ellipsis if needed
    if (page < totalPages - 2) {
      links.push(
        <PaginationItem key="ellipsis2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      links.push(
        <PaginationItem key="last">
          <PaginationLink
            isActive={page === totalPages}
            onClick={() => setPage(totalPages)}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return links;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members List</CardTitle>
        <CardDescription>Manage your gym members</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Input
              placeholder="Search by name, mobile or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(null)}
            >
              All
            </Button>
            <Button
              variant={filter === "active" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={filter === "expired" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("expired")}
            >
              Expired
            </Button>
            <Button
              variant={filter === "inactive" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("inactive")}
            >
              Inactive
            </Button>
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Joining Date</TableHead>
                <TableHead>Next Bill</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id} className="cursor-pointer hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {member.photo ? (
                            <img
                              src={member.photo}
                              alt={`${member.name}`}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">GYM-{member.id.toString().padStart(4, '0')}</TableCell>
                    <TableCell className="text-sm text-gray-500">{member.phone}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {format(new Date(member.joiningDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className={cn(
                      "text-sm",
                      new Date(member.nextBillDate) < new Date() ? "text-red-500 font-medium" : "text-gray-500"
                    )}>
                      {format(new Date(member.nextBillDate), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{getMemberStatusBadge(member)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        className="text-primary-600 hover:text-primary-900"
                        onClick={() => onViewMember(member)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {!isLoading && totalPages > 0 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(page * limit, total)}
              </span>{" "}
              of <span className="font-medium">{total}</span> results
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    isDisabled={page === 1}
                  />
                </PaginationItem>
                
                {renderPaginationLinks()}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    isDisabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

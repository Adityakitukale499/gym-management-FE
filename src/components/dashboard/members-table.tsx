import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Member } from "@shared/schema";
import { format } from "date-fns";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { JSX } from "react/jsx-runtime";

interface MembersTableProps {
  onViewMember: (member: Member) => void;
}

export default function MembersTable({ onViewMember }: MembersTableProps) {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "members"),
        orderBy("joiningDate", "desc")
      );
      const snapshot = await getDocs(q);
      const allMembers: Member[] = [];

      snapshot.forEach((doc) => {
        allMembers.push({ id: doc.id, ...doc.data() } as unknown as Member);
      });

      let filtered = allMembers;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter((member) => {
          return /^\d+$/.test(term)
            ? member.phone?.includes(term)
            : member.name?.toLowerCase().includes(term);
        });
      }

      const today = new Date().toISOString().split("T")[0];
      if (filter === "active") {
        filtered = filtered.filter(
          (m) => m.isActive && m.nextBillDate >= today
        );
      } else if (filter === "expired") {
        filtered = filtered.filter((m) => m.isActive && m.nextBillDate < today);
      } else if (filter === "inactive") {
        filtered = filtered.filter((m) => !m.isActive);
      }

      setMembers(filtered);
    } catch (error) {
      console.error("Failed to fetch members:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [searchTerm, filter]);

  const paginatedMembers = members.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(members.length / limit);

  const getMemberStatusBadge = (member: Member) => {
    const today = new Date().toISOString().split("T")[0];
    if (!member.isActive) {
      return <Badge variant="outline">Inactive</Badge>;
    } else if (member.nextBillDate < today) {
      return <Badge variant="destructive">Expired</Badge>;
    } else {
      const nextBillDate = new Date(member.nextBillDate);
      const currentDate = new Date();
      const daysDiff = Math.ceil(
        (nextBillDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysDiff <= 3) {
        return <Badge variant="destructive">Expiring Soon</Badge>;
      } else {
        return <Badge variant="secondary">Active</Badge>;
      }
    }
  };

  const renderPaginationLinks = () => {
    const links: JSX.Element[] = [];
    if (totalPages <= 1) return links;

    for (let i = 1; i <= totalPages; i++) {
      links.push(
        <PaginationItem key={i}>
          <PaginationLink isActive={i === page} onClick={() => setPage(i)}>
            {i}
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="relative flex-1">
            <Input
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {["All", "active", "expired", "inactive"].map((status) => (
              <Button
                key={status}
                variant={
                  filter === (status === "All" ? null : status)
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => setFilter(status === "All" ? null : status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Button>
            ))}
          </div>
        </div>

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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : paginatedMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-10 text-muted-foreground"
                  >
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMembers.map((member) => (
                  <TableRow
                    key={member.id}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {member.photo ? (
                            <img
                              src={member.photo}
                              alt={member.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {member.name?.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.name}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      GYM-{member.id?.toString().padStart(4, "0")}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {member.phone}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {member.joiningDate
                        ? format(new Date(member.joiningDate), "MMM dd, yyyy")
                        : "-"}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-sm",
                        new Date(member.nextBillDate) < new Date()
                          ? "text-red-500 font-medium"
                          : "text-gray-500"
                      )}
                    >
                      {format(new Date(member.nextBillDate), "MMM dd, yyyy")}
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
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">{(page - 1) * limit + 1}</span> to{" "}
              <span className="font-medium">
                {Math.min(page * limit, members.length)}
              </span>{" "}
              of <span className="font-medium">{members.length}</span>
            </p>
            <Pagination>
              <PaginationContent>{renderPaginationLinks()}</PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

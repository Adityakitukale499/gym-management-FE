import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Member } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, MessageSquare, Pencil } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLocation } from "wouter";

interface MemberDetailsModalProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MemberDetailsModal({
  member,
  open,
  onOpenChange,
}: MemberDetailsModalProps) {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(member?.isActive || false);
  const [membershipPlan, setMembershipPlan] = useState<{
    name: string;
    durationMonths: number;
  } | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(false);
  const [, navigate] = useLocation();

  // Update member status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/members/${id}/status`, {
        isActive,
      });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Status updated",
        description: `Member status updated to ${
          data.isActive ? "active" : "inactive"
        }.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
      setIsActive(member?.isActive || false);
    },
  });

  // Handle status toggle
  const handleStatusChange = (checked: boolean) => {
    if (!member) return;
    setIsActive(checked);
    updateStatusMutation.mutate({
      id: member.id,
      isActive: checked,
    });
  };

  // Reset active state when modal opens with a new member
  useEffect(() => {
    if (
      member &&
      member.isActive !== isActive &&
      !updateStatusMutation.isPending
    ) {
      setIsActive(member.isActive);
    }
  }, [member]);

  // Fetch membership plan from Firestore
  useEffect(() => {
    const fetchMembershipPlan = async () => {
      if (!member?.membershipPlanId) {
        setMembershipPlan(null);
        return;
      }

      setIsLoadingPlan(true);
      try {
        const planRef = doc(
          db,
          "MEMBERSHIP_PLANS",
          String(member.membershipPlanId)
        );
        console.log({ planId: member.membershipPlanId });
        const planSnap = await getDoc(planRef);

        console.log({ planSnap });

        if (planSnap.exists()) {
          const data = planSnap.data();
          setMembershipPlan({
            name: data.name,
            durationMonths: data.durationMonths,
          });
        } else {
          setMembershipPlan(null);
        }
      } catch (error) {
        console.error("Error fetching membership plan:", error);
        setMembershipPlan(null);
      } finally {
        setIsLoadingPlan(false);
      }
    };

    fetchMembershipPlan();
  }, [member?.membershipPlanId]);

  const handleEditMember = () => {
    if (!member) return;
    navigate(`/add-member?id=${member.id}&mode=edit`);
    onOpenChange(false);
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Member Details</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row">
          <div className="mb-6 md:mb-0 md:mr-6 flex-shrink-0">
            {member.photo ? (
              <img
                className="h-32 w-32 rounded-full object-cover border-4 border-gray-200"
                src={member.photo}
                alt={member.name}
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                <span className="text-gray-500 text-4xl font-medium">
                  {member.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              {member.name}
            </h2>
            <p className="text-gray-600 mb-4">
              ID: {member.id.toString().padStart(4, "0")}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium">{member.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Joined Date</p>
                <p className="font-medium">
                  {format(new Date(member.joiningDate), "MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Bill Date</p>
                <p className="font-medium">
                  {format(new Date(member.nextBillDate), "MMMM d, yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Membership</p>
                {isLoadingPlan ? (
                  <div className="flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading...</span>
                  </div>
                ) : membershipPlan ? (
                  <p className="font-medium">
                    {membershipPlan.name} ({membershipPlan.durationMonths} Month
                    {membershipPlan.durationMonths !== 1 ? "s" : ""})
                  </p>
                ) : (
                  <p className="text-muted-foreground">No membership plan</p>
                )}
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">
                  {member.address || "No address provided"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <p className="font-medium">
                  {member.isPaid ? "Paid" : "Not Paid"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <div className="flex items-center mt-1">
                  <Switch
                    checked={isActive}
                    onCheckedChange={handleStatusChange}
                    disabled={updateStatusMutation.isPending}
                    id="member-status-toggle"
                  />
                  <Label
                    htmlFor="member-status-toggle"
                    className="ml-2 text-sm font-medium text-gray-700"
                  >
                    {isActive ? "Active" : "Inactive"}
                    {updateStatusMutation.isPending && (
                      <Loader2 className="inline-block ml-2 h-3 w-3 animate-spin" />
                    )}
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Send Message
          </Button>
          <Button className="gap-2" onClick={handleEditMember}>
            <Pencil className="h-4 w-4" />
            Edit Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  getMembershipPlans,
  addMembershipPlan,
  updateMembershipPlan,
} from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";
import MembershipPlanForm from "@/components/membership/membership-plan-form";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Loader2 } from "lucide-react";

interface MembershipPlan {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  description?: string;
  gymId: string;
  isActive?: boolean;
}

export default function MembershipPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPlans = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const plansData = await getMembershipPlans();
      setPlans(plansData);
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to load plans: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchPlans();
    }
  }, [user?.id]);

  const handleSubmit = async (data: any) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create plans",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingPlan) {
        await updateMembershipPlan(editingPlan.id, {
          ...data,
          gymId: user.id,
        });
        toast({
          title: "Plan updated",
          description: "Successfully updated plan",
        });
      } else {
        await addMembershipPlan({
          ...data,
          gymId: user.id,
          isActive: data.isActive !== undefined ? data.isActive : true,
        });
        toast({
          title: "Plan created",
          description: "Successfully added new plan",
        });
      }
      fetchPlans();
      setEditingPlan(null);
      setShowForm(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to save plan: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to update plans",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateMembershipPlan(id, {
        isActive: !currentStatus,
      });
      toast({
        title: "Status updated",
        description: `Plan is now ${!currentStatus ? "active" : "inactive"}`,
      });
      fetchPlans();
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to update plan status: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="p-2 md:p-6 text-xs md:text-base">
        <header className="mb-4 md:mb-6">
          <h1 className="text-lg md:text-2xl font-bold">Membership Plans</h1>
          <p className="text-xs md:text-gray-600">Manage your gym's plans</p>
        </header>

        <Card className="mb-6">
          <CardHeader className="flex flex-col md:flex-row md:items-center justify-between p-2 md:p-6 gap-2 md:gap-0">
            <div>
              <CardTitle className="text-base md:text-xl">Existing Plans</CardTitle>
              <CardDescription className="text-xs md:text-sm">List of all plans</CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingPlan(null);
                setShowForm(true);
              }}
              className="text-xs md:text-base px-2 md:px-4 py-1 md:py-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </Button>
          </CardHeader>
          <CardContent className="p-2 md:p-6">
            {loading ? (
              <div className="py-4 md:py-6 flex justify-center">
                <Loader2 className="animate-spin h-8 w-8" />
              </div>
            ) : plans.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 md:py-6 text-xs md:text-base">
                No plans found.
              </p>
            ) : (
              <Table className="text-xs md:text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>{plan.name}</TableCell>
                      <TableCell>{plan.durationMonths} month(s)</TableCell>
                      <TableCell>₹{Math.round(plan.price)}</TableCell>
                      <TableCell>{plan.description || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="mr-2">
                            <div
                              className={`h-3 w-3 rounded-full ${
                                plan.isActive !== false
                                  ? "bg-green-500"
                                  : "bg-red-400"
                              }`}
                            ></div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant={
                                  plan.isActive !== false
                                    ? "outline"
                                    : "secondary"
                                }
                                size="sm"
                              >
                                {plan.isActive !== false
                                  ? "Active"
                                  : "Inactive"}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  {plan.isActive !== false
                                    ? "Deactivate"
                                    : "Activate"}{" "}
                                  plan?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  {plan.isActive !== false
                                    ? "This plan will no longer be available for  members."
                                    : "This plan will become available for members."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    toggleActive(
                                      plan.id,
                                      plan.isActive !== false
                                    )
                                  }
                                >
                                  {plan.isActive !== false
                                    ? "Deactivate"
                                    : "Activate"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setEditingPlan(plan);
                            setShowForm(true);
                          }}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {/* <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost">
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete "{plan.name}"?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDelete(plan.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog> */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingPlan ? "Edit Plan" : "Create Plan"}</CardTitle>
            </CardHeader>
            <CardContent>
              <MembershipPlanForm
                plan={editingPlan}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setEditingPlan(null);
                  setShowForm(false);
                }}
                isSubmitting={submitting}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

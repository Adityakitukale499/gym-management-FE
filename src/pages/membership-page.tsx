import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  getDoc,
} from "firebase/firestore";
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
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

interface MembershipPlan {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  description?: string;
  gymId: string;
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
      const plansData = await getMembershipPlans(user.id);
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

  const handleDelete = async (id: string) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to delete plans",
        variant: "destructive",
      });
      return;
    }

    try {
      const planRef = doc(db, "MEMBERSHIP_PLANS", id);
      const planDoc = await getDoc(planRef);
      
      if (planDoc.exists() && planDoc.data().gymId === user.id) {
        await deleteDoc(planRef);
        toast({ 
          title: "Deleted", 
          description: "Plan deleted successfully" 
        });
        fetchPlans();
      } else {
        toast({
          title: "Error",
          description: "You don't have permission to delete this plan",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: `Failed to delete plan: ${err.message}`,
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Membership Plans</h1>
          <p className="text-gray-600">Manage your gym's plans</p>
        </header>

        <Card className="mb-6">
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>Existing Plans</CardTitle>
              <CardDescription>List of all plans</CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingPlan(null);
                setShowForm(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-6 flex justify-center">
                <Loader2 className="animate-spin h-8 w-8" />
              </div>
            ) : plans.length === 0 ? (
              <p className="text-muted-foreground text-center py-6">
                No plans found.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>{plan.name}</TableCell>
                      <TableCell>{plan.durationMonths} month(s)</TableCell>
                      <TableCell>${plan.price.toFixed(2)}</TableCell>
                      <TableCell>{plan.description || "-"}</TableCell>
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
                        <AlertDialog>
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
                        </AlertDialog>
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

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AppLayout from "@/components/layout/app-layout";
import MembershipPlanForm from "@/components/membership/membership-plan-form";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Loader2, Plus } from "lucide-react";
import { MembershipPlan, InsertMembershipPlan } from "@shared/schema";

export default function MembershipPage() {
  const { toast } = useToast();
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);

  // Fetch membership plans
  const { data: plans = [], isLoading } = useQuery<MembershipPlan[]>({
    queryKey: ["/api/membership-plans"],
  });

  // Create membership plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (planData: InsertMembershipPlan) => {
      const res = await apiRequest("POST", "/api/membership-plans", planData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan created",
        description: "Membership plan created successfully",
      });
      setShowNewPlanForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/membership-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update membership plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: InsertMembershipPlan }) => {
      const res = await apiRequest("PUT", `/api/membership-plans/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan updated",
        description: "Membership plan updated successfully",
      });
      setEditingPlan(null);
      queryClient.invalidateQueries({ queryKey: ["/api/membership-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Delete membership plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/membership-plans/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Plan deleted",
        description: "Membership plan deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/membership-plans"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const handleSubmit = (data: InsertMembershipPlan) => {
    if (editingPlan) {
      updatePlanMutation.mutate({ id: editingPlan.id, data });
    } else {
      createPlanMutation.mutate(data);
    }
  };

  return (
    <AppLayout>
      <div className="p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Membership Plans</h1>
          <p className="text-gray-600">Create and manage your gym's membership plans</p>
        </header>

        {/* Existing Plans */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Existing Plans</CardTitle>
              <CardDescription>Manage your membership plans</CardDescription>
            </div>
            <Button onClick={() => {
              setEditingPlan(null);
              setShowNewPlanForm(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              New Plan
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No membership plans found. Create your first plan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan Name</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <TableRow key={plan.id}>
                        <TableCell className="font-medium">{plan.name}</TableCell>
                        <TableCell>{plan.durationMonths} Month{plan.durationMonths > 1 ? 's' : ''}</TableCell>
                        <TableCell>${plan.price.toFixed(2)}</TableCell>
                        <TableCell className="max-w-xs truncate">{plan.description || '-'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingPlan(plan);
                              setShowNewPlanForm(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Membership Plan</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the "{plan.name}" plan? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => deletePlanMutation.mutate(plan.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Plan Form */}
        {showNewPlanForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingPlan ? 'Edit Membership Plan' : 'Create New Membership Plan'}</CardTitle>
            </CardHeader>
            <CardContent>
              <MembershipPlanForm 
                plan={editingPlan}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowNewPlanForm(false);
                  setEditingPlan(null);
                }}
                isSubmitting={createPlanMutation.isPending || updatePlanMutation.isPending}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

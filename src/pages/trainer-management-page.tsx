import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import {
  getTrainers,
  addTrainer,
  updateTrainer,
  deleteTrainer,
  Trainer,
} from "@/lib/firestore";
import { TrainerPermissions } from "@/lib/types";
import AppLayout from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Search, Trash2, Edit, ArrowLeft } from "lucide-react";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Trainer schema for form validation
const trainerSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
    isActive: z.boolean(),
    permissions: z.object({
      canViewMembers: z.boolean(),
      canEditMembers: z.boolean(),
      canViewAttendance: z.boolean(),
      canEditAttendance: z.boolean(),
      canViewProducts: z.boolean(),
      canEditProducts: z.boolean(),
      canViewPayments: z.boolean(),
      canEditPayments: z.boolean(),
      canViewTrainers: z.boolean(),
      canEditTrainers: z.boolean(),
      canViewDashboard: z.boolean(),
      canViewReports: z.boolean(),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type TrainerFormData = z.infer<typeof trainerSchema>;

const defaultPermissions: TrainerPermissions = {
  canViewMembers: false,
  canEditMembers: false,
  canViewProducts: false,
  canEditProducts: false,
  canViewTrainers: false,
  canEditTrainers: false,
  canViewDashboard: false,
  canViewReports: false,
};

type ViewMode = "list" | "add" | "edit";

export default function TrainerManagementPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isAdmin, hasPermission } = usePermissions();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize the form
  const form = useForm<TrainerFormData>({
    resolver: zodResolver(trainerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      isActive: true,
      permissions: defaultPermissions,
    },
  });

  // Fetch trainers
  const { data: trainers = [], isLoading } = useQuery<Trainer[]>({
    queryKey: ["trainers"],
    queryFn: () => getTrainers(),
    enabled: !!user?.id,
  });

  // Filter trainers based on search query
  const filteredTrainers = trainers.filter(
    (trainer) =>
      trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addTrainerMutation = useMutation({
    mutationFn: async (data: TrainerFormData) => {
      if (!user?.id) throw new Error("User not authenticated");
      return addTrainer({
        ...data,
        gymId: user.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Trainer added",
        description: "The new trainer has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["trainers"] });
      form.reset();
      setViewMode("list");
    },
    onError: (error) => {
      toast({
        title: "Failed to add trainer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateTrainerMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TrainerFormData>;
    }) => {
      return updateTrainer(id, data);
    },
    onSuccess: () => {
      toast({
        title: "Trainer updated",
        description: "The trainer has been updated successfully.",
      });
      setViewMode("list");
      setSelectedTrainer(null);
      queryClient.invalidateQueries({ queryKey: ["trainers"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to update trainer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTrainerMutation = useMutation({
    mutationFn: async (id: string) => {
      return deleteTrainer(id);
    },
    onSuccess: () => {
      toast({
        title: "Trainer deleted",
        description: "The trainer has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["trainers"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete trainer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    form.reset({
      name: trainer.name,
      email: trainer.email,
      phone: trainer.phone,
      isActive: trainer.isActive,
      permissions: trainer.permissions,
    });
    setViewMode("edit");
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedTrainer(null);
    form.reset();
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this trainer?")) {
      deleteTrainerMutation.mutate(id);
    }
  };

  const onSubmit = (values: TrainerFormData) => {
    if (viewMode === "edit" && selectedTrainer) {
      updateTrainerMutation.mutate({
        id: selectedTrainer.id,
        data: values,
      });
    } else {
      addTrainerMutation.mutate(values);
    }
  };

  if (!isAdmin && !hasPermission("canViewTrainers")) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-lg text-muted-foreground">
          You don't have permission to view this page.
        </p>
      </div>
    );
  }

  const renderListView = () => (
    <>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg md:text-2xl font-bold text-gray-900">
          Trainer Management
        </h1>
        <Button onClick={() => setViewMode("add")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Trainer
        </Button>
      </div>

      <Card>
        <CardHeader className="p-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search trainers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredTrainers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No trainers found
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredTrainers.map((trainer) => (
                <Card key={trainer.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {trainer.name}
                        </h3>
                        <p className="text-sm text-gray-500">{trainer.email}</p>
                        <p className="text-sm text-gray-500">{trainer.phone}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={trainer.isActive}
                          onCheckedChange={(checked) =>
                            updateTrainerMutation.mutate({
                              id: trainer.id,
                              data: { isActive: checked },
                            })
                          }
                        />
                        {hasPermission("canEditTrainers") && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(trainer)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Are you sure you want to delete this
                                    trainer?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete the trainer and their
                                    account.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(trainer.id)}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <h4 className="font-medium text-sm">Permissions:</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(trainer.permissions).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex items-center space-x-2 text-sm"
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  value ? "bg-green-500" : "bg-gray-300"
                                }`}
                              />
                              <span className="text-gray-600">
                                {key
                                  .replace(/([A-Z])/g, " $1")
                                  .replace(/^./, (str) => str.toUpperCase())}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );

  const renderFormView = () => (
    <>
      <div className="flex items-center mb-4">
        <Button variant="ghost" onClick={handleCancel} className="mr-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-lg md:text-2xl font-bold text-gray-900">
          {viewMode === "edit" ? "Edit Trainer" : "Add New Trainer"}
        </h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter trainer's name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Enter trainer's email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter trainer's phone number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {viewMode === "add" && (
                    <>
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Enter password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Confirm password"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Trainer Status</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            {field.value ? "Active" : "Inactive"}
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Permissions Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Permissions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="permissions.canViewMembers"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>View Members</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Can view member information
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.canEditMembers"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Edit Members</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Can edit member information
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.canViewProducts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>View Products</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Can view product catalog
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.canEditProducts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>Edit Products</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Can edit product catalog
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.canViewDashboard"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>View Dashboard</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Can view dashboard
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="permissions.canViewReports"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel>View Reports</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Can view reports
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    addTrainerMutation.isPending ||
                    updateTrainerMutation.isPending
                  }
                >
                  {(addTrainerMutation.isPending ||
                    updateTrainerMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {viewMode === "edit" ? "Save Changes" : "Add Trainer"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );

  return (
    <AppLayout>
      <div className="p-2 md:p-6 text-xs md:text-base">
        {viewMode === "list" ? renderListView() : renderFormView()}
      </div>
    </AppLayout>
  );
}

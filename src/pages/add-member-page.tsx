import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { getMembershipPlans, addMember } from "@/lib/firestore";
<<<<<<< HEAD
=======
import { uploadToCloudinary } from "@/lib/cloudinary";
>>>>>>> master
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  insertMemberSchema,
  InsertMember,
  MembershipPlan,
} from "@shared/schema";
import { z } from "zod";
<<<<<<< HEAD
=======
import { Checkbox } from "@/components/ui/checkbox";
>>>>>>> master

// Extend the schema for form validation
const formSchema = insertMemberSchema
  .extend({
<<<<<<< HEAD
    joiningDate: z.date(),
    nextBillDate: z.date().optional(),
=======
    joiningDate: z.date({
      required_error: "Joining date is required",
    }),
    nextBillDate: z.date({
      required_error: "Next bill date is required",
    }),
    membershipPlanId: z.string({
      required_error: "Please select a membership plan",
    }),
    dateOfBirth: z.date({
      required_error: "Date of birth is required",
    }),
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(1, "Phone number is required"),
    address: z.string().min(1, "Address is required"),
    isActive: z.boolean(),
    isPaid: z.boolean(),
    photo: z.string().optional(),
>>>>>>> master
  })
  .omit({ gymId: true });

type FormValues = z.infer<typeof formSchema>;

export default function AddMemberPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isPhotoUploaded, setIsPhotoUploaded] = useState(false);
<<<<<<< HEAD
=======
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [checkboxKey, setCheckboxKey] = useState(0);
>>>>>>> master

  // Fetch membership plans
  const { data: membershipPlans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ["membershipPlans"],
    queryFn: () => getMembershipPlans(user?.id || ""),
    enabled: !!user?.id,
  });

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      address: "",
      photo: "",
      joiningDate: new Date(),
      isActive: true,
<<<<<<< HEAD
      isPaid: true,
    },
=======
      isPaid: false,
      membershipPlanId: undefined,
      dateOfBirth: new Date(),
    },
    mode: "onChange",
>>>>>>> master
  });

  // Handle membership plan change
  const handleMembershipChange = (value: string) => {
<<<<<<< HEAD
    const planId = parseInt(value);
    form.setValue("membershipPlanId", planId);

    // Find the selected plan
    const selectedPlan = membershipPlans.find((plan) => plan.id === planId);
=======
    form.setValue("membershipPlanId", value);

    // Find the selected plan
    const selectedPlan = membershipPlans.find((plan) => plan.id === value);
>>>>>>> master
    if (selectedPlan) {
      const joiningDate = form.getValues("joiningDate");
      const nextBillDate = new Date(joiningDate);
      nextBillDate.setMonth(
        nextBillDate.getMonth() + selectedPlan.durationMonths
      );
      form.setValue("nextBillDate", nextBillDate);
    }
  };

<<<<<<< HEAD
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsPhotoUploaded(true);
      form.setValue("photo", "dummy-photo-url");
      toast({
        title: "Photo uploaded",
        description: "Profile photo has been uploaded successfully.",
      });
    }
  };

=======
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);

      try {
        // Create a temporary preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setPhotoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        // Upload to Cloudinary
        const cloudinaryUrl = await uploadToCloudinary(file);
        form.setValue("photo", cloudinaryUrl);
        setIsPhotoUploaded(true);

        toast({
          title: "Photo uploaded",
          description: "Profile photo has been uploaded successfully.",
        });
      } catch (error) {
        console.error("Error uploading image:", error);
        toast({
          title: "Failed to upload photo",
          description: "There was an error uploading the photo. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Add cancel handler
  const handleCancel = () => {
    form.reset({
      name: "",
      phone: "",
      address: "",
      photo: "",
      joiningDate: new Date(),
      isActive: true,
      isPaid: false,
      membershipPlanId: undefined,
      nextBillDate: undefined,
      dateOfBirth: new Date(),
    });
    setIsPhotoUploaded(false);
    setPhotoPreview(null);
    setFormKey(prev => prev + 1);
    setCheckboxKey(prev => prev + 1);
  };

>>>>>>> master
  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: InsertMember) => {
      return addMember({
        ...data,
        gymId: user?.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Member added",
        description: "The new member has been added successfully.",
      });
<<<<<<< HEAD
      // Reset form
=======
      // Reset form with all fields including membership type and payment date
>>>>>>> master
      form.reset({
        name: "",
        phone: "",
        address: "",
        photo: "",
        joiningDate: new Date(),
        isActive: true,
<<<<<<< HEAD
        isPaid: true,
      });
      setIsPhotoUploaded(false);
=======
        isPaid: false,
        membershipPlanId: undefined,
        nextBillDate: undefined,
        dateOfBirth: new Date(),
      });
      setIsPhotoUploaded(false);
      setPhotoPreview(null);
      setFormKey(prev => prev + 1);
      setCheckboxKey(prev => prev + 1);
>>>>>>> master
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["members"] });
    },
    onError: (error) => {
      console.log(error);
      toast({
        title: "Failed to add member",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: FormValues) => {
    const memberData: InsertMember = {
      ...values,
      gymId: user?.id || "",
      joiningDate: format(values.joiningDate, "yyyy-MM-dd"),
      nextBillDate: values.nextBillDate
        ? format(values.nextBillDate, "yyyy-MM-dd")
        : format(values.joiningDate, "yyyy-MM-dd"),
    };
    addMemberMutation.mutate(memberData);
  };

  return (
    <AppLayout>
      <div className="p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Member</h1>
          <p className="text-gray-600">Register a new member to your gym</p>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Member Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
<<<<<<< HEAD
=======
                key={formKey}
>>>>>>> master
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Profile Photo */}
                <div className="md:col-span-2">
                  <FormLabel>Profile Photo</FormLabel>
                  <div className="flex items-center mt-2">
                    <div
<<<<<<< HEAD
                      className={`w-20 h-20 rounded-full ${
                        isPhotoUploaded ? "bg-primary-100" : "bg-gray-200"
                      } flex items-center justify-center overflow-hidden mr-4`}
                    >
                      {isPhotoUploaded ? (
=======
                      className={`w-20 h-20 rounded-full ${isPhotoUploaded ? "bg-primary-100" : "bg-gray-200"
                        } flex items-center justify-center overflow-hidden mr-4`}
                    >
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : isPhotoUploaded ? (
>>>>>>> master
                        <div className="text-primary-600">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <label
                          htmlFor="photo-upload"
                          className="cursor-pointer"
                        >
                          <div className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3">
<<<<<<< HEAD
                            Upload Photo
=======
                            {isUploading ? (
                              <div className="flex items-center">
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </div>
                            ) : (
                              "Upload Photo"
                            )}
>>>>>>> master
                          </div>
                          <input
                            id="photo-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handlePhotoUpload}
<<<<<<< HEAD
                          />
                        </label>
                        <Button type="button" variant="ghost" size="sm">
=======
                            disabled={isUploading}
                          />
                        </label>
                        <Button type="button" variant="ghost" size="sm" disabled={isUploading}>
>>>>>>> master
                          Take Photo
                        </Button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        JPG, PNG or GIF. Max size 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter member's full name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. +1 234-567-8900"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

<<<<<<< HEAD
                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter member's address"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Joining Date */}
                  <FormField
                    control={form.control}
                    name="joiningDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Joining Date</FormLabel>
=======
                  {/* Date of Birth */}
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth</FormLabel>
>>>>>>> master
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

<<<<<<< HEAD
                  {/* Membership Type */}
                  <FormField
                    control={form.control}
                    name="membershipPlanId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Membership Type</FormLabel>
                        <Select
                          onValueChange={handleMembershipChange}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a membership plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLoadingPlans ? (
                              <div className="flex justify-center p-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                              </div>
                            ) : membershipPlans.length === 0 ? (
                              <div className="p-2 text-sm text-muted-foreground">
                                No membership plans found
                              </div>
                            ) : (
                              membershipPlans.map((plan) => (
                                <SelectItem
                                  key={plan.id}
                                  value={plan.id.toString()}
                                >
                                  {plan.name} ({plan.durationMonths} Month
                                  {plan.durationMonths > 1 ? "s" : ""}) - $
                                  {plan.price}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
=======
                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter member's address"
                            {...field}
                            value={field.value ?? ""}
                          />
                        </FormControl>
>>>>>>> master
                        <FormMessage />
                      </FormItem>
                    )}
                  />

<<<<<<< HEAD
=======
                  {/* Membership Type with Payment Date */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="membershipPlanId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Membership Type</FormLabel>
                          <Select
                            onValueChange={handleMembershipChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a membership plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {isLoadingPlans ? (
                                <div className="flex justify-center p-2">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                              ) : membershipPlans.length === 0 ? (
                                <div className="p-2 text-sm text-muted-foreground">
                                  No membership plans found
                                </div>
                              ) : (
                                membershipPlans.map((plan) => (
                                  <SelectItem
                                    key={plan.id}
                                    value={plan.id}
                                  >
                                    {plan.name} ({plan.durationMonths} Month
                                    {plan.durationMonths > 1 ? "s" : ""}) - ${plan.price}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Payment Date Display */}
                    <div className="rounded-md border p-4">
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">Payment Date</span>
                        <span className="text-sm">
                          {form.watch("nextBillDate")
                            ? format(form.watch("nextBillDate") as Date, "PPP")
                            : "Select a membership plan to see payment date"}
                        </span>
                      </div>
                    </div>
                  </div>

>>>>>>> master
                  {/* Payment Status */}
                  <FormField
                    control={form.control}
                    name="isPaid"
                    render={({ field }) => (
<<<<<<< HEAD
                      <FormItem className="space-y-3">
                        <FormLabel>Payment Status</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) =>
                              field.onChange(value === "true")
                            }
                            defaultValue={field.value ? "true" : "false"}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="paid" />
                              <label
                                htmlFor="paid"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Paid
                              </label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="not-paid" />
                              <label
                                htmlFor="not-paid"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Not Paid
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
=======
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            key={checkboxKey}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Payment Status</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            {field.value ? "Paid" : "Not Paid"}
                          </p>
                        </div>
>>>>>>> master
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-8 flex justify-end">
<<<<<<< HEAD
                  <Button type="button" variant="outline" className="mr-3">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addMemberMutation.isPending}>
=======
                  <Button
                    type="button"
                    variant="outline"
                    className="mr-3"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addMemberMutation.isPending || !form.formState.isValid}
                  >
>>>>>>> master
                    {addMemberMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Add Member
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> master

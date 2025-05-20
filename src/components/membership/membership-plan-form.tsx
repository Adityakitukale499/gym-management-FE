import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { insertMembershipPlanSchema } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  durationMonths: z.number().min(1, "Duration must be at least 1 month"),
  price: z.preprocess(
    (val) => (val === '' || val === null ? undefined : Number(val)),
    z.number().min(0, "Price cannot be negative").optional()
  ),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

interface MembershipPlanProps {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  description?: string;
  gymId: string;
  isActive?: boolean;
}

interface MembershipPlanFormProps {
  plan: MembershipPlanProps | null;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export default function MembershipPlanForm({
  plan,
  onSubmit,
  onCancel,
  isSubmitting,
}: MembershipPlanFormProps) {
  // Initialize the form with the current plan's values or defaults
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: plan?.name || "",
      durationMonths: plan?.durationMonths || 1,
      price: plan?.price || undefined,
      description: plan?.description ?? "",
      isActive: plan?.isActive !== false, // default to true if undefined
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Basic, Premium, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="durationMonths"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (Months)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 1, 3, 6, 12"
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : 1
                      )
                    }
                  />
                </FormControl>
                <FormDescription>
                  Number of months this plan will be valid for
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (₹)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 49.99"
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  value={field.value === undefined ? "" : field.value}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? undefined : parseFloat(e.target.value)
                    )
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Any additional details about this plan..."
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Status</FormLabel>
                <FormDescription>
                  Only active plans will be shown in the membership selection
                </FormDescription>
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

        <div className="flex justify-end pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="mr-3"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {plan ? "Update Plan" : "Save Plan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
<<<<<<< HEAD
=======
import { FirebaseError } from "firebase/app";
import { useToast } from "@/hooks/use-toast";
>>>>>>> master

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onForgotPassword: () => void;
}

export default function LoginForm({ onForgotPassword }: LoginFormProps) {
  const { loginMutation } = useAuth();
<<<<<<< HEAD
=======
  const { toast } = useToast();
>>>>>>> master

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

<<<<<<< HEAD
  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
=======
  const getErrorMessage = (error: FirebaseError): string => {
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      case 'auth/wrong-password':
        return 'Invalid email or password';
      case 'auth/invalid-email':
        return 'Please enter a valid email address';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      default:
        return 'Unable to sign in. Please check your credentials and try again';
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    try {
      await loginMutation.mutate(data);
    } catch (error) {
      if (error instanceof FirebaseError) {
        toast({
          title: "Login Failed",
          description: getErrorMessage(error),
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Failed",
          description: "Unable to sign in. Please try again",
          variant: "destructive",
        });
      }
    }
>>>>>>> master
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Your password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Sign In
        </Button>

        <div className="text-center">
          <Button
            type="button"
            variant="link"
            onClick={onForgotPassword}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Forgot Password?
          </Button>
        </div>
      </form>
    </Form>
  );
}

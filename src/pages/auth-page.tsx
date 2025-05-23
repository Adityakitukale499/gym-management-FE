import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import LoginForm from "@/components/auth/login-form";
import ForgotPasswordModal from "@/components/auth/forgot-password-modal";
import "./auth-page.css";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  useEffect(() => {
    if (user && !isLoading) {
      setLocation("/");
    }
  }, [user, isLoading, setLocation]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative auth-bg-container">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>

      {/* Auth Forms Section */}
      <div className="w-full sm:w-[90%] md:w-[70%] lg:w-[50%] flex flex-col justify-center p-4 md:p-8 z-10 relative">
        <div className="max-w-md mx-auto w-full bg-white/40 backdrop-blur-sm p-6 md:p-8 rounded-lg shadow-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Royal GYM</h1>
            <p className="text-gray-700 mt-2">Manage your gym efficiently</p>
          </div>
          <LoginForm onForgotPassword={() => setForgotPasswordOpen(true)} />
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={forgotPasswordOpen}
        onOpenChange={setForgotPasswordOpen}
      />
    </div>
  );
}

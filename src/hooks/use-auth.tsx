import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
  ActionCodeSettings,
} from "firebase/auth";
import { getDocs, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/lib/types";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  loginMutation: {
    mutate: (data: { email: string; password: string }) => Promise<void>;
    isPending: boolean;
  };
  logoutMutation: {
    mutate: () => Promise<void>;
    isPending: boolean;
  };
  registerMutation: {
    mutate: (data: Omit<User, "id" | "createdAt">) => Promise<void>;
    isPending: boolean;
  };
  forgotPasswordMutation: {
    mutate: (data: { email: string }) => Promise<void>;
    isPending: boolean;
  };
  resetPasswordMutation: {
    mutate: (data: { code: string; password: string }) => Promise<void>;
    isPending: boolean;
  };
};

interface UserData {
  email: string;
  username: string;
  password: string;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginPending, setIsLoginPending] = useState(false);
  const [isLogoutPending, setIsLogoutPending] = useState(false);
  const [isRegisterPending, setIsRegisterPending] = useState(false);
  const [isForgotPasswordPending, setIsForgotPasswordPending] = useState(false);
  const [isResetPasswordPending, setIsResetPasswordPending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const gymsSnapshot = await getDocs(
          collection(db, FIRESTORE_COLLECTIONS.GYMS)
        );

        if (!gymsSnapshot.empty) {
          const firstGym = gymsSnapshot.docs[0].data() as User;
          setUser(firstGym);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const loginTime = new Date().getTime();
      const checkSession = () => {
        const currentTime = new Date().getTime();
        const hoursSinceLogin = (currentTime - loginTime) / (1000 * 60 * 60);

        if (hoursSinceLogin >= 24) {
          logoutMutation.mutate();
          toast({
            title: "Session expired",
            description:
              "You have been automatically logged out after 24 hours.",
          });
        }
      };

      const intervalId = setInterval(checkSession, 60000);

      return () => clearInterval(intervalId);
    }
  }, [user]);

  const loginMutation = {
    mutate: async (data: { email: string; password: string }) => {
      try {
        setIsLoginPending(true);
        const res = await signInWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );
        console.log({ res });
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
      } catch (error) {
        // Don't show toast for login errors, let the form handle them
        throw error;
      } finally {
        setIsLoginPending(false);
      }
    },
    isPending: isLoginPending,
  };

  const registerMutation = {
    mutate: async (data: UserData) => {
      try {
        setIsRegisterPending(true);

        await createUserWithEmailAndPassword(auth, data.email, data.password);

        toast({
          title: "Trainer Registration successful",
          description: `Welcome to Gym Management System`,
        });
      } catch (error) {
        toast({
          title: "Registration failed",
          description:
            error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsRegisterPending(false);
      }
    },
    isPending: isRegisterPending,
  };

  const logoutMutation = {
    mutate: async () => {
      try {
        setIsLogoutPending(true);
        await signOut(auth);
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
      } catch (error) {
        toast({
          title: "Logout failed",
          description:
            error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsLogoutPending(false);
      }
    },
    isPending: isLogoutPending,
  };

  const forgotPasswordMutation = {
    mutate: async (data: { email: string }) => {
      try {
        setIsForgotPasswordPending(true);
        const actionCodeSettings: ActionCodeSettings = {
          url: `${window.location.origin}/reset-password`,
          handleCodeInApp: true,
        };
        await sendPasswordResetEmail(auth, data.email, actionCodeSettings);
        toast({
          title: "Password Reset Email Sent",
          description: "Check your email for password reset instructions.",
        });
      } catch (error) {
        toast({
          title: "Failed to send reset email",
          description:
            error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsForgotPasswordPending(false);
      }
    },
    isPending: isForgotPasswordPending,
  };

  const resetPasswordMutation = {
    mutate: async (data: { code: string; password: string }) => {
      try {
        setIsResetPasswordPending(true);
        await confirmPasswordReset(auth, data.code, data.password);
        toast({
          title: "Password Reset Successful",
          description: "Your password has been reset successfully.",
        });
      } catch (error) {
        toast({
          title: "Password Reset Failed",
          description:
            error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsResetPasswordPending(false);
      }
    },
    isPending: isResetPasswordPending,
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginMutation,
        logoutMutation,
        registerMutation,
        forgotPasswordMutation,
        resetPasswordMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

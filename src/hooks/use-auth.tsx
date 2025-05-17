import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
  ActionCodeSettings,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Gym } from "@shared/schema";

type AuthContextType = {
  user: Gym | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: {
    mutate: (data: { email: string; password: string }) => Promise<void>;
    isPending: boolean;
  };
  logoutMutation: {
    mutate: () => Promise<void>;
    isPending: boolean;
  };
  registerMutation: {
    mutate: (data: Omit<Gym, "id" | "createdAt">) => Promise<void>;
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

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [user, setUser] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isLoginPending, setIsLoginPending] = useState(false);
  const [isLogoutPending, setIsLogoutPending] = useState(false);
  const [isRegisterPending, setIsRegisterPending] = useState(false);
  const [isForgotPasswordPending, setIsForgotPasswordPending] = useState(false);
  const [isResetPasswordPending, setIsResetPasswordPending] = useState(false);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
<<<<<<< HEAD
        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userDoc.exists()) {
          setUser(userDoc.data() as Gym);
=======
        // Get gym data from Firestore
        const gymDoc = await getDoc(doc(db, "gyms", firebaseUser.uid));
        if (gymDoc.exists()) {
          setUser(gymDoc.data() as Gym);
>>>>>>> master
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginMutation = {
    mutate: async (data: { email: string; password: string }) => {
      try {
        setIsLoginPending(true);
        await signInWithEmailAndPassword(auth, data.email, data.password);
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
      } catch (error) {
<<<<<<< HEAD
        toast({
          title: "Login failed",
          description:
            error instanceof Error ? error.message : "An error occurred",
          variant: "destructive",
        });
=======
        // Don't show toast for login errors, let the form handle them
>>>>>>> master
        throw error;
      } finally {
        setIsLoginPending(false);
      }
    },
    isPending: isLoginPending,
  };

  const registerMutation = {
    mutate: async (data: Omit<Gym, "id" | "createdAt">) => {
      try {
        setIsRegisterPending(true);
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          data.email,
          data.password
        );

<<<<<<< HEAD
        // Create user document in Firestore
        const userData: Gym = {
=======
        // Create gym document in Firestore
        const gymData: Gym = {
>>>>>>> master
          ...data,
          id: userCredential.user.uid,
          createdAt: new Date(),
        };

<<<<<<< HEAD
        await setDoc(doc(db, "users", userCredential.user.uid), {
          ...userData,
=======
        await setDoc(doc(db, "gyms", userCredential.user.uid), {
          ...gymData,
>>>>>>> master
          createdAt: serverTimestamp(),
        });

        toast({
          title: "Registration successful",
          description: `Welcome to Gym Management System, ${data.gymName}!`,
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
        error,
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

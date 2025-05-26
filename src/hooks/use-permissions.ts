import { useAuth } from "./use-auth";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore";
import { TrainerPermissions } from "@/lib/types";

export function usePermissions() {
  const { user } = useAuth();

  const { data: permissions } = useQuery({
    queryKey: ["trainer-permissions", user?.trainerId],
    queryFn: async () => {
      if (!user?.trainerId) return null;

      const trainerRef = doc(
        db,
        FIRESTORE_COLLECTIONS.TRAINERS,
        user.trainerId
      );
      const trainerSnap = await getDoc(trainerRef);

      if (!trainerSnap.exists()) return null;

      return trainerSnap.data().permissions as TrainerPermissions;
    },
    enabled: !!user?.trainerId,
  });

  const hasPermission = (permission: keyof TrainerPermissions) => {
    if (user?.role === "admin") return true;
    if (!permissions) return false;
    return permissions[permission] || false;
  };

  return {
    permissions,
    hasPermission,
    isAdmin: true,
    isTrainer: user?.role === "trainer",
  };
}

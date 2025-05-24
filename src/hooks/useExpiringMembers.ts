import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import dayjs from "dayjs";
import { FIRESTORE_COLLECTIONS } from "@/lib/firestore";

export const useExpiringMembers = () => {
  return useQuery({
    queryKey: ["expiring-members"],
    queryFn: async () => {
      const membersRef = collection(db, FIRESTORE_COLLECTIONS.MEMBERS);
      const q = query(membersRef);
      const snapshot = await getDocs(q);

      const members = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      const now = dayjs();
      return members.filter((member) => {
        const nextBill = dayjs(member.nextBillDate);
        const diff = nextBill.diff(now, "day");
        return diff >= 0 && diff <= 3;
      });
    },
  });
};

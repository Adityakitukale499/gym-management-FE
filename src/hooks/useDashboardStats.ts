import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import dayjs from "dayjs";

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const membersRef = collection(db, "members");
      const q = query(membersRef);
      const snapshot = await getDocs(q);

      const members = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as any[];

      const now = dayjs();
      const totalMembers = members.length;

      const monthlyJoined = members.filter((member) =>
        dayjs(member.createdAt.toDate()).isSame(now, "month")
      ).length;

      const expiringThreeDays = members.filter((member) => {
        const nextBill = dayjs(member.nextBillDate);
        const diff = nextBill.diff(now, "day");
        return diff >= 0 && diff <= 3;
      }).length;

      const expiredMembers = members.filter((member) => {
        const nextBill = dayjs(member.nextBillDate);
        return nextBill.isBefore(now, "day");
      }).length;

      return {
        totalMembers,
        monthlyJoined,
        expiringThreeDays,
        expiredMembers,
      };
    },
  });
};

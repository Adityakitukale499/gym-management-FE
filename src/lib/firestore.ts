import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  getDoc,
  DocumentData,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export const FIRESTORE_COLLECTIONS = {
  MEMBERS: "members",
  MEMBERSHIP_PLANS: "membershipPlans",
  GYMS: "gyms",
  USERS: "users",
  PAYMENTS: "payments",
  ATTENDANCE: "attendance",
} as const;

export const addMember = async (memberData: DocumentData) => {
  const membersRef = collection(db, FIRESTORE_COLLECTIONS.MEMBERS);
  const docRef = await addDoc(membersRef, {
    ...memberData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return { id: docRef.id, ...memberData };
};

export const getMembers = async (gymId: string, filters: any = {}) => {
  const membersRef = collection(db, FIRESTORE_COLLECTIONS.MEMBERS);
  let q = query(membersRef, where("gymId", "==", gymId));

  if (filters.name) {
    q = query(
      q,
      where("name", ">=", filters.name),
      where("name", "<=", filters.name + "\uf8ff")
    );
  }
  if (filters.status) {
    q = query(q, where("isActive", "==", filters.status === "active"));
  }
  if (filters.paymentStatus) {
    q = query(q, where("isPaid", "==", filters.paymentStatus === "paid"));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const updateMember = async (
  memberId: string,
  data: Partial<DocumentData>
) => {
  const memberRef = doc(db, FIRESTORE_COLLECTIONS.MEMBERS, memberId);
  await updateDoc(memberRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
  return { id: memberId, ...data };
};

export const deleteMember = async (memberId: string) => {
  const memberRef = doc(db, FIRESTORE_COLLECTIONS.MEMBERS, memberId);
  await deleteDoc(memberRef);
  return memberId;
};

export const addMembershipPlan = async (planData: DocumentData) => {
  const plansRef = collection(db, FIRESTORE_COLLECTIONS.MEMBERSHIP_PLANS);
  const docRef = await addDoc(plansRef, {
    ...planData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return { id: docRef.id, ...planData };
};

export const getMembershipPlans = async (gymId: string) => {
  const plansRef = collection(db, FIRESTORE_COLLECTIONS.MEMBERSHIP_PLANS);
  const q = query(plansRef, where("gymId", "==", gymId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const updateMembershipPlan = async (
  planId: string,
  data: Partial<DocumentData>
) => {
  const planRef = doc(db, FIRESTORE_COLLECTIONS.MEMBERSHIP_PLANS, planId);
  await updateDoc(planRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
  return { id: planId, ...data };
};

export const deleteMembershipPlan = async (planId: string) => {
  const planRef = doc(db, FIRESTORE_COLLECTIONS.MEMBERSHIP_PLANS, planId);
  await deleteDoc(planRef);
  return planId;
};

export const addGym = async (gymData: DocumentData) => {
  const gymsRef = collection(db, FIRESTORE_COLLECTIONS.GYMS);
  const docRef = await addDoc(gymsRef, {
    ...gymData,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return { id: docRef.id, ...gymData };
};

export const getGym = async (gymId: string) => {
  const gymRef = doc(db, FIRESTORE_COLLECTIONS.GYMS, gymId);
  const docSnap = await getDoc(gymRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  }
  return null;
};

export const updateGym = async (gymId: string, data: Partial<DocumentData>) => {
  const gymRef = doc(db, FIRESTORE_COLLECTIONS.GYMS, gymId);
  await updateDoc(gymRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
  return { id: gymId, ...data };
};
s;
export const addPayment = async (paymentData: DocumentData) => {
  const paymentsRef = collection(db, FIRESTORE_COLLECTIONS.PAYMENTS);
  const docRef = await addDoc(paymentsRef, {
    ...paymentData,
    createdAt: Timestamp.now(),
  });
  return { id: docRef.id, ...paymentData };
};

export const getPayments = async (memberId: string) => {
  const paymentsRef = collection(db, FIRESTORE_COLLECTIONS.PAYMENTS);
  const q = query(paymentsRef, where("memberId", "==", memberId));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const addAttendance = async (attendanceData: DocumentData) => {
  const attendanceRef = collection(db, FIRESTORE_COLLECTIONS.ATTENDANCE);
  const docRef = await addDoc(attendanceRef, {
    ...attendanceData,
    createdAt: Timestamp.now(),
  });
  return { id: docRef.id, ...attendanceData };
};

export const getAttendance = async (
  memberId: string,
  startDate: Date,
  endDate: Date
) => {
  const attendanceRef = collection(db, FIRESTORE_COLLECTIONS.ATTENDANCE);
  const q = query(
    attendanceRef,
    where("memberId", "==", memberId),
    where("date", ">=", Timestamp.fromDate(startDate)),
    where("date", "<=", Timestamp.fromDate(endDate))
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

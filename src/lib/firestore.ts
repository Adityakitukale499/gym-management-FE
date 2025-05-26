import { TrainerPermissions } from "@/lib/types";
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
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

export interface MembershipPlan {
  id: string;
  name: string;
  durationMonths: number;
  price: number;
  description?: string;
  gymId: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const PRODUCT_CATEGORIES = {
  SUPPLEMENTS: "Supplements",
  EQUIPMENT: "Equipment",
  CLOTHING: "Clothing",
  ACCESSORIES: "Accessories",
  NUTRITION: "Nutrition",
  FITNESS_GEAR: "Fitness Gear",
} as const;

export type ProductCategory = keyof typeof PRODUCT_CATEGORIES;

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  isActive: boolean;
  gymId: string;
  category: ProductCategory;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
  permissions: TrainerPermissions;
  gymId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const FIRESTORE_COLLECTIONS = {
  MEMBERS: "members",
  MEMBERSHIP_PLANS: "membershipPlans",
  GYMS: "gyms",
  USERS: "users",
  PAYMENTS: "payments",
  ATTENDANCE: "attendance",
  PRODUCTS: "products",
  TRAINERS: "trainers",
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

export const getMembers = async (filters: any = {}) => {
  const membersRef = collection(db, FIRESTORE_COLLECTIONS.MEMBERS);
  let q = query(membersRef);

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

export const addMembershipPlan = async (data: Omit<MembershipPlan, "id">) => {
  const plansRef = collection(db, FIRESTORE_COLLECTIONS.MEMBERSHIP_PLANS);
  const docRef = await addDoc(plansRef, {
    ...data,
    createdAt: new Date(),
  });
  return docRef.id;
};

export const getMembershipPlans = async () => {
  const plansRef = collection(db, FIRESTORE_COLLECTIONS.MEMBERSHIP_PLANS);
  const q = query(plansRef);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as MembershipPlan[];
};

export const updateMembershipPlan = async (
  id: string,
  data: Partial<MembershipPlan>
) => {
  const planRef = doc(db, FIRESTORE_COLLECTIONS.MEMBERSHIP_PLANS, id);
  await updateDoc(planRef, {
    ...data,
    updatedAt: new Date(),
  });
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

export const getProducts = async (): Promise<Product[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const productsRef = collection(db, FIRESTORE_COLLECTIONS.PRODUCTS);
  const q = query(productsRef);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];
};

export const addProduct = async (data: {
  name: string;
  description: string;
  price: number;
  image?: string;
  isActive: boolean;
  gymId: string;
  category: ProductCategory;
}) => {
  const productsRef = collection(db, FIRESTORE_COLLECTIONS.PRODUCTS);
  const docRef = await addDoc(productsRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateProduct = async (
  id: string,
  data: Partial<{
    name: string;
    description: string;
    price: number;
    image?: string;
    isActive: boolean;
  }>
) => {
  const productRef = doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, id);
  await updateDoc(productRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteProduct = async (id: string) => {
  const productRef = doc(db, FIRESTORE_COLLECTIONS.PRODUCTS, id);
  await deleteDoc(productRef);
};

export const getTrainers = async (): Promise<Trainer[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const trainersRef = collection(db, FIRESTORE_COLLECTIONS.TRAINERS);
  const q = query(trainersRef);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    updatedAt: doc.data().updatedAt?.toDate(),
  })) as Trainer[];
};

export const addTrainer = async (
  data: Omit<Trainer, "id" | "createdAt" | "updatedAt"> & { password: string }
): Promise<Trainer> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  try {
    // Create Firebase Authentication account for trainer
    const trainerAuth = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    // Remove password from trainer data before storing in Firestore
    const { password, ...trainerData } = data;

    const trainerDoc = {
      ...trainerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const trainerRef = await addDoc(
      collection(db, FIRESTORE_COLLECTIONS.TRAINERS),
      trainerDoc
    );

    // Create user document with trainer role
    const userData = {
      id: trainerAuth.user.uid,
      email: data.email,
      role: "trainer" as const,
      gymId: user.uid,
      trainerId: trainerRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await addDoc(collection(db, FIRESTORE_COLLECTIONS.USERS), userData);

    return {
      id: trainerRef.id,
      ...trainerData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Trainer;
  } catch (error: any) {
    // If Firebase Auth fails, throw a more user-friendly error
    if (error.code === "auth/email-already-in-use") {
      throw new Error(
        "This email is already registered. Please use a different email address."
      );
    }
    throw error;
  }
};

export const updateTrainer = async (
  id: string,
  data: Partial<Trainer>
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const trainerRef = doc(db, FIRESTORE_COLLECTIONS.TRAINERS, id);
  await updateDoc(trainerRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteTrainer = async (id: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  // Delete trainer profile
  const trainerRef = doc(db, FIRESTORE_COLLECTIONS.TRAINERS, id);
  await deleteDoc(trainerRef);

  // Delete associated user account
  const usersRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
  const q = query(usersRef, where("trainerId", "==", id));
  const snapshot = await getDocs(q);

  const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
};

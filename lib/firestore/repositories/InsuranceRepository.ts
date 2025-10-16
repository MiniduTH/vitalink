import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { InsurancePolicy, InsuranceClaim } from "@/lib/types";

export class InsurancePolicyRepository {
    private collectionName = "insurancePolicies";

    async create(data: Omit<InsurancePolicy, "id" | "createdAt" | "updatedAt">): Promise<string> {
        const docRef = await addDoc(collection(db, this.collectionName), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    }

    async update(id: string, data: Partial<Omit<InsurancePolicy, "id" | "createdAt" | "updatedAt">>): Promise<void> {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now(),
        });
    }

    async findById(id: string): Promise<InsurancePolicy | null> {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return { id: docSnap.id, ...docSnap.data() } as InsurancePolicy;
    }

    async findByPatientId(patientId: string): Promise<InsurancePolicy[]> {
        const q = query(collection(db, this.collectionName), where("patientId", "==", patientId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as InsurancePolicy));
    }

    async findActivePolicyByPatientId(patientId: string): Promise<InsurancePolicy | null> {
        const q = query(collection(db, this.collectionName), where("patientId", "==", patientId), where("status", "==", "Active"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const docData = querySnapshot.docs[0];
        return { id: docData.id, ...docData.data() } as InsurancePolicy;
    }

    async findByPolicyNumber(policyNumber: string): Promise<InsurancePolicy | null> {
        const q = query(collection(db, this.collectionName), where("policyNumber", "==", policyNumber));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const docData = querySnapshot.docs[0];
        return { id: docData.id, ...docData.data() } as InsurancePolicy;
    }
}

export class InsuranceClaimRepository {
    private collectionName = "insuranceClaims";

    async findById(id: string): Promise<InsuranceClaim | null> {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return { id: docSnap.id, ...docSnap.data() } as InsuranceClaim;
    }

    async create(data: Omit<InsuranceClaim, "id">): Promise<string> {
        const docRef = await addDoc(collection(db, this.collectionName), {
            ...data,
            submittedAt: Timestamp.now(),
        });
        return docRef.id;
    }

    async findByPaymentId(paymentId: string): Promise<InsuranceClaim | null> {
        const q = query(collection(db, this.collectionName), where("paymentId", "==", paymentId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const docData = querySnapshot.docs[0];
        return { id: docData.id, ...docData.data() } as InsuranceClaim;
    }
}

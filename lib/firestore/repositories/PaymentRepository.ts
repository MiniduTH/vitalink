import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, Timestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Payment, CreatePaymentDTO } from "@/lib/types";

export class PaymentRepository {
    private collectionName = "payments";

    async findById(id: string): Promise<Payment | null> {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return { id: docSnap.id, ...docSnap.data() } as Payment;
    }

    async findAll(): Promise<Payment[]> {
        const q = query(collection(db, this.collectionName), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Payment));
    }

    async findByPatientId(patientId: string): Promise<Payment[]> {
        // Query without orderBy to avoid requiring composite index
        const q = query(collection(db, this.collectionName), where("patientId", "==", patientId));
        const querySnapshot = await getDocs(q);
        const payments = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Payment));

        // Sort client-side by createdAt descending
        return payments.sort((a, b) => {
            const dateA = a.createdAt.toMillis();
            const dateB = b.createdAt.toMillis();
            return dateB - dateA; // Descending order (newest first)
        });
    }

    async findByAppointmentId(appointmentId: string): Promise<Payment | null> {
        const q = query(collection(db, this.collectionName), where("appointmentId", "==", appointmentId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const docData = querySnapshot.docs[0];
        return { id: docData.id, ...docData.data() } as Payment;
    }

    async findByDateRange(startDate: Timestamp, endDate: Timestamp): Promise<Payment[]> {
        const q = query(
            collection(db, this.collectionName),
            where("createdAt", ">=", startDate),
            where("createdAt", "<=", endDate),
            orderBy("createdAt", "asc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Payment));
    }

    async create(data: CreatePaymentDTO): Promise<string> {
        const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`;

        const docRef = await addDoc(collection(db, this.collectionName), {
            ...data,
            insuranceCoverage: data.insuranceCoverage || 0,
            status: "Pending",
            transactionId,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    }

    async update(id: string, data: Partial<Payment>): Promise<void> {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, data);
    }

    async markAsPaid(id: string): Promise<void> {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, {
            status: "Completed",
            paidAt: Timestamp.now(),
        });
    }

    async markAsFailed(id: string): Promise<void> {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, {
            status: "Failed",
        });
    }
}

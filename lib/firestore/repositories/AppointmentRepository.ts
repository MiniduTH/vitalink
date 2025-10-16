import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    Timestamp,
    orderBy,
    limit as firestoreLimit,
    QueryConstraint,
    and,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Appointment, CreateAppointmentDTO } from "@/lib/types";

export class AppointmentRepository {
    private collectionName = "appointments";

    async findById(id: string): Promise<Appointment | null> {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return { id: docSnap.id, ...docSnap.data() } as Appointment;
    }

    async findAll(filters?: { limit?: number; status?: string }): Promise<Appointment[]> {
        const collectionRef = collection(db, this.collectionName);
        const constraints: QueryConstraint[] = [orderBy("appointmentDate", "desc")];

        if (filters?.status) {
            constraints.push(where("status", "==", filters.status));
        }

        if (filters?.limit) {
            constraints.push(firestoreLimit(filters.limit));
        }

        const q = query(collectionRef, ...constraints);
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Appointment));
    }

    async findByPatientId(patientId: string): Promise<Appointment[]> {
        // Query without orderBy to avoid requiring composite index
        const q = query(collection(db, this.collectionName), where("patientId", "==", patientId));
        const querySnapshot = await getDocs(q);
        const appointments = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Appointment));

        // Sort client-side by appointmentDate descending
        return appointments.sort((a, b) => {
            const dateA = a.appointmentDate.toMillis();
            const dateB = b.appointmentDate.toMillis();
            return dateB - dateA; // Descending order (newest first)
        });
    }

    async findByDoctorId(doctorId: string, date?: Timestamp): Promise<Appointment[]> {
        const constraints: QueryConstraint[] = [where("doctorId", "==", doctorId)];

        if (date) {
            constraints.push(where("appointmentDate", "==", date));
        }

        // Query without orderBy to avoid composite index requirement
        const q = query(collection(db, this.collectionName), ...constraints);
        const querySnapshot = await getDocs(q);
        const appointments = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Appointment));

        // Sort client-side by appointmentDate ascending
        return appointments.sort((a, b) => {
            const dateA = a.appointmentDate.toMillis();
            const dateB = b.appointmentDate.toMillis();
            return dateA - dateB; // Ascending order (oldest first)
        });
    }

    async findByDateRange(startDate: Timestamp, endDate: Timestamp): Promise<Appointment[]> {
        const q = query(
            collection(db, this.collectionName),
            where("appointmentDate", ">=", startDate),
            where("appointmentDate", "<=", endDate),
            orderBy("appointmentDate", "asc")
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Appointment));
    }

    async create(data: CreateAppointmentDTO): Promise<string> {
        const docRef = await addDoc(collection(db, this.collectionName), {
            ...data,
            status: "Scheduled",
            notes: data.notes || "",
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    }

    async update(id: string, data: Partial<Appointment>): Promise<void> {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now(),
        });
    }

    async delete(id: string): Promise<void> {
        const docRef = doc(db, this.collectionName, id);
        await deleteDoc(docRef);
    }

    async checkSlotAvailability(doctorId: string, appointmentDate: Timestamp, timeSlot: string): Promise<boolean> {
        const q = query(
            collection(db, this.collectionName),
            where("doctorId", "==", doctorId),
            where("appointmentDate", "==", appointmentDate),
            where("timeSlot", "==", timeSlot),
            where("status", "in", ["Scheduled", "Confirmed", "CheckedIn"])
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty;
    }
}

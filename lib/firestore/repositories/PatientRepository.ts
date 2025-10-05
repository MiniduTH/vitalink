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
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Patient, CreatePatientDTO } from "@/lib/types";

export class PatientRepository {
    private collectionName = "patients";

    async findById(id: string): Promise<Patient | null> {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return { id: docSnap.id, ...docSnap.data() } as Patient;
    }

    async findAll(filters?: { limit?: number }): Promise<Patient[]> {
        const collectionRef = collection(db, this.collectionName);
        const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];

        if (filters?.limit) {
            constraints.push(firestoreLimit(filters.limit));
        }

        const q = query(collectionRef, ...constraints);
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Patient));
    }

    async findByEmail(email: string): Promise<Patient | null> {
        const q = query(collection(db, this.collectionName), where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const docData = querySnapshot.docs[0];
        return { id: docData.id, ...docData.data() } as Patient;
    }

    async create(data: CreatePatientDTO): Promise<string> {
        const docRef = await addDoc(collection(db, this.collectionName), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    }

    async update(id: string, data: Partial<CreatePatientDTO>): Promise<void> {
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

    async search(searchTerm: string): Promise<Patient[]> {
        const allPatients = await this.findAll();
        const lowerSearch = searchTerm.toLowerCase();

        return allPatients.filter(
            (patient) =>
                patient.firstName.toLowerCase().includes(lowerSearch) ||
                patient.lastName.toLowerCase().includes(lowerSearch) ||
                patient.email.toLowerCase().includes(lowerSearch) ||
                patient.contactNumber.includes(searchTerm)
        );
    }
}

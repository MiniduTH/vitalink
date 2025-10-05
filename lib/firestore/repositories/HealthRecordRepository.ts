import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, Timestamp, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { HealthRecord, CreateHealthRecordDTO, Encounter } from "@/lib/types";

export class HealthRecordRepository {
    private collectionName = "healthRecords";

    async findById(id: string): Promise<HealthRecord | null> {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return { id: docSnap.id, ...docSnap.data() } as HealthRecord;
    }

    async findByPatientId(patientId: string): Promise<HealthRecord | null> {
        const q = query(collection(db, this.collectionName), where("patientId", "==", patientId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const docData = querySnapshot.docs[0];
        return { id: docData.id, ...docData.data() } as HealthRecord;
    }

    async create(data: CreateHealthRecordDTO): Promise<string> {
        const docRef = await addDoc(collection(db, this.collectionName), {
            ...data,
            encounters: data.encounters || [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        });
        return docRef.id;
    }

    async update(id: string, data: Partial<CreateHealthRecordDTO>): Promise<void> {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now(),
        });
    }

    async addEncounter(id: string, encounter: Encounter): Promise<void> {
        const docRef = doc(db, this.collectionName, id);
        await updateDoc(docRef, {
            encounters: arrayUnion(encounter),
            updatedAt: Timestamp.now(),
        });
    }

    async updateMedicalNotes(id: string, encounterId: string, notes: string): Promise<void> {
        const record = await this.findById(id);
        if (!record) throw new Error("Health record not found");

        const updatedEncounters = record.encounters.map((enc) => (enc.encounterId === encounterId ? { ...enc, medicalNotes: notes } : enc));

        await this.update(id, { encounters: updatedEncounters } as any);
    }
}

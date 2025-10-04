import { collection, doc, getDoc, getDocs, addDoc, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Staff, CreateStaffDTO, Department, Hospital } from "@/lib/types";

export class StaffRepository {
    private collectionName = "staff";

    async findById(id: string): Promise<Staff | null> {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return { id: docSnap.id, ...docSnap.data() } as Staff;
    }

    async findByFirebaseUid(firebaseUid: string): Promise<Staff | null> {
        const q = query(collection(db, this.collectionName), where("firebaseUid", "==", firebaseUid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const docData = querySnapshot.docs[0];
        return { id: docData.id, ...docData.data() } as Staff;
    }

    async findByRole(role: string): Promise<Staff[]> {
        const q = query(collection(db, this.collectionName), where("role", "==", role));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Staff));
    }

    async findDoctors(): Promise<Staff[]> {
        return this.findByRole("Doctor");
    }

    async create(data: CreateStaffDTO): Promise<string> {
        const docRef = await addDoc(collection(db, this.collectionName), {
            ...data,
            createdAt: Timestamp.now(),
        });
        return docRef.id;
    }
}

export class DepartmentRepository {
    private collectionName = "departments";

    async findById(id: string): Promise<Department | null> {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return { id: docSnap.id, ...docSnap.data() } as Department;
    }

    async findAll(): Promise<Department[]> {
        const querySnapshot = await getDocs(collection(db, this.collectionName));
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Department));
    }

    async findByHospitalId(hospitalId: string): Promise<Department[]> {
        const q = query(collection(db, this.collectionName), where("hospitalId", "==", hospitalId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Department));
    }
}

export class HospitalRepository {
    private collectionName = "hospitals";

    async findById(id: string): Promise<Hospital | null> {
        const docRef = doc(db, this.collectionName, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return null;
        }

        return { id: docSnap.id, ...docSnap.data() } as Hospital;
    }

    async findAll(): Promise<Hospital[]> {
        const querySnapshot = await getDocs(collection(db, this.collectionName));
        return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Hospital));
    }
}

import { HealthRecordRepository } from "@/lib/firestore/repositories/HealthRecordRepository";
import { Timestamp } from "firebase/firestore";
import { HealthRecord, CreateHealthRecordDTO, Encounter, Medication } from "@/lib/types";

// Mock Firebase
jest.mock("@/lib/firebase/config", () => ({
    db: {},
}));

jest.mock("firebase/firestore", () => ({
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    arrayUnion: jest.fn(),
    Timestamp: {
        now: jest.fn(() => ({ toMillis: () => Date.now() })),
    },
}));

const mockFirestore = require("firebase/firestore");

describe("HealthRecordRepository", () => {
    let repository: HealthRecordRepository;
    let mockDocSnap: any;
    let mockQuerySnapshot: any;

    beforeEach(() => {
        repository = new HealthRecordRepository();
        jest.clearAllMocks();

        mockDocSnap = {
            exists: jest.fn(),
            id: "test-id",
            data: jest.fn(),
        };

        mockQuerySnapshot = {
            docs: [],
            empty: true,
        };
    });

    describe("findById", () => {
        it("should return health record when document exists", async () => {
            const mockRecord = {
                patientId: "patient-1",
                bloodType: "A+",
                allergies: ["Peanuts"],
            };

            mockDocSnap.exists.mockReturnValue(true);
            mockDocSnap.data.mockReturnValue(mockRecord);
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("test-id");

            expect(result).toEqual({ id: "test-id", ...mockRecord });
        });

        it("should return null when document does not exist", async () => {
            mockDocSnap.exists.mockReturnValue(false);
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("non-existent-id");

            expect(result).toBeNull();
        });
    });

    describe("findByPatientId", () => {
        it("should return health record for patient", async () => {
            const mockRecord = {
                patientId: "patient-1",
                bloodType: "O+",
            };

            mockQuerySnapshot.docs = [
                {
                    id: "record-1",
                    data: () => mockRecord,
                },
            ];
            mockQuerySnapshot.empty = false;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByPatientId("patient-1");

            expect(result).toEqual({ id: "record-1", ...mockRecord });
            expect(mockFirestore.where).toHaveBeenCalledWith("patientId", "==", "patient-1");
        });

        it("should return null when no record found", async () => {
            mockQuerySnapshot.empty = true;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByPatientId("patient-1");

            expect(result).toBeNull();
        });
    });

    describe("create", () => {
        it("should create health record", async () => {
            const createData: CreateHealthRecordDTO = {
                patientId: "patient-1",
                bloodType: "A+",
                allergies: ["Peanuts"],
                chronicConditions: ["Diabetes"],
            };

            mockFirestore.addDoc.mockResolvedValue({ id: "new-id" });

            const result = await repository.create(createData);

            expect(result).toBe("new-id");
            expect(mockFirestore.addDoc).toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("should update health record", async () => {
            const updateData = { bloodType: "B+" };

            await repository.update("test-id", updateData);

            expect(mockFirestore.updateDoc).toHaveBeenCalled();
        });
    });

    describe("addEncounter", () => {
        it("should add encounter to health record", async () => {
            const encounter: Encounter = {
                encounterId: "enc-1",
                date: Timestamp.now(),
                diagnosis: "Flu",
                labResults: ["Blood test normal"],
                medicalNotes: "Patient recovering well",
                doctorId: "doctor-1",
            };

            mockFirestore.arrayUnion.mockReturnValue("mocked-array-union");

            await repository.addEncounter("record-1", encounter);

            expect(mockFirestore.arrayUnion).toHaveBeenCalledWith(encounter);
            expect(mockFirestore.updateDoc).toHaveBeenCalled();
        });
    });

    describe("updateMedicalNotes", () => {
        it("should update medical notes for specific encounter", async () => {
            const mockRecord: HealthRecord = {
                id: "record-1",
                patientId: "patient-1",
                bloodType: "A+",
                allergies: [],
                chronicConditions: [],
                encounters: [
                    {
                        encounterId: "enc-1",
                        date: Timestamp.now(),
                        diagnosis: "Flu",
                        labResults: [],
                        medicalNotes: "Old notes",
                        doctorId: "doctor-1",
                    },
                ],
                medications: [],
                digitalHealthCardId: "card-1",
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            mockDocSnap.exists.mockReturnValue(true);
            mockDocSnap.data.mockReturnValue(mockRecord);
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            await repository.updateMedicalNotes("record-1", "enc-1", "Updated notes");

            expect(mockFirestore.updateDoc).toHaveBeenCalled();
        });

        it("should throw error when health record not found", async () => {
            mockDocSnap.exists.mockReturnValue(false);
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            await expect(
                repository.updateMedicalNotes("non-existent", "enc-1", "notes")
            ).rejects.toThrow("Health record not found");
        });
    });

    describe("addMedication", () => {
        it("should add medication to health record", async () => {
            const medication: Medication = {
                medicationId: "med-1",
                name: "Ibuprofen",
                dosage: "200mg",
                frequency: "Three times daily",
                startDate: Timestamp.now(),
                status: "Active",
                prescribedBy: "doctor-1",
                notes: "Take with food",
            };

            mockFirestore.arrayUnion.mockReturnValue("mocked-array-union");

            await repository.addMedication("record-1", medication);

            expect(mockFirestore.arrayUnion).toHaveBeenCalledWith(medication);
            expect(mockFirestore.updateDoc).toHaveBeenCalled();
        });
    });

    describe("updateMedication", () => {
        it("should update specific medication", async () => {
            const mockRecord: HealthRecord = {
                id: "record-1",
                patientId: "patient-1",
                bloodType: "A+",
                allergies: [],
                chronicConditions: [],
                encounters: [],
                medications: [
                    {
                        medicationId: "med-1",
                        name: "Aspirin",
                        dosage: "500mg",
                        frequency: "Daily",
                        startDate: Timestamp.now(),
                        status: "Active",
                        prescribedBy: "doctor-1",
                    },
                ],
                digitalHealthCardId: "card-1",
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            mockDocSnap.exists.mockReturnValue(true);
            mockDocSnap.data.mockReturnValue(mockRecord);
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const updates = { status: "Discontinued" as const, notes: "Side effects" };

            await repository.updateMedication("record-1", "med-1", updates);

            expect(mockFirestore.updateDoc).toHaveBeenCalled();
        });

        it("should throw error when health record not found", async () => {
            mockDocSnap.exists.mockReturnValue(false);
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            await expect(
                repository.updateMedication("non-existent", "med-1", { status: "Discontinued" })
            ).rejects.toThrow("Health record not found");
        });
    });
});
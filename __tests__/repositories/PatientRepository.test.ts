import { PatientRepository } from "@/lib/firestore/repositories/PatientRepository";
import { Timestamp } from "firebase/firestore";
import { Patient, CreatePatientDTO } from "@/lib/types";

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
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    Timestamp: {
        now: jest.fn(() => ({ toMillis: () => Date.now() })),
    },
}));

const mockFirestore = require("firebase/firestore");

describe("PatientRepository", () => {
    let repository: PatientRepository;
    let mockDocSnap: any;
    let mockQuerySnapshot: any;

    beforeEach(() => {
        repository = new PatientRepository();
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
        it("should return patient when document exists", async () => {
            const mockPatient = {
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@example.com",
                contactNumber: "1234567890",
            };

            const mockDocSnap = {
                exists: jest.fn().mockReturnValue(true),
                id: "patient-1",
                data: jest.fn().mockReturnValue(mockPatient),
            };
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("patient-1");

            expect(result).toEqual({ id: "patient-1", ...mockPatient });
            expect(mockFirestore.doc).toHaveBeenCalled();
        });

        it("should return null when document does not exist", async () => {
            mockDocSnap.exists.mockReturnValue(false);
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("non-existent");

            expect(result).toBeNull();
        });
    });

    describe("findAll", () => {
        it("should return all patients with default ordering", async () => {
            const mockPatients = [
                { id: "1", firstName: "John", lastName: "Doe" },
                { id: "2", firstName: "Jane", lastName: "Smith" },
            ];

            mockQuerySnapshot.docs = mockPatients.map((patient) => ({
                id: patient.id,
                data: () => patient,
            }));

            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findAll();

            expect(result).toHaveLength(2);
            expect(mockFirestore.orderBy).toHaveBeenCalledWith("createdAt", "desc");
        });

        it("should apply limit when provided", async () => {
            mockQuerySnapshot.docs = [];
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            await repository.findAll({ limit: 5 });

            expect(mockFirestore.limit).toHaveBeenCalledWith(5);
        });
    });

    describe("findByEmail", () => {
        it("should return patient by email", async () => {
            const mockPatient = {
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@example.com",
            };

            mockQuerySnapshot.docs = [
                {
                    id: "patient-1",
                    data: () => mockPatient,
                },
            ];
            mockQuerySnapshot.empty = false;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByEmail("john.doe@example.com");

            expect(result).toEqual({ id: "patient-1", ...mockPatient });
            expect(mockFirestore.where).toHaveBeenCalledWith("email", "==", "john.doe@example.com");
        });

        it("should return null when patient not found", async () => {
            mockQuerySnapshot.empty = true;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByEmail("nonexistent@example.com");

            expect(result).toBeNull();
        });
    });

    describe("create", () => {
        it("should create patient", async () => {
            const createData: CreatePatientDTO = {
                firstName: "John",
                lastName: "Doe",
                dateOfBirth: Timestamp.now(),
                gender: "Male",
                contactNumber: "1234567890",
                email: "john.doe@example.com",
                address: "123 Main St",
                emergencyContact: {
                    name: "Jane Doe",
                    relationship: "Spouse",
                    phone: "0987654321",
                },
            };

            mockFirestore.addDoc.mockResolvedValue({ id: "new-patient-id" });

            const result = await repository.create(createData);

            expect(result).toBe("new-patient-id");
            expect(mockFirestore.addDoc).toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("should update patient", async () => {
            const updateData = {
                firstName: "Johnny",
                contactNumber: "9876543210",
            };

            await repository.update("patient-1", updateData);

            expect(mockFirestore.updateDoc).toHaveBeenCalled();
            expect(mockFirestore.doc).toHaveBeenCalled();
        });
    });

    describe("delete", () => {
        it("should delete patient", async () => {
            await repository.delete("patient-1");

            expect(mockFirestore.deleteDoc).toHaveBeenCalled();
            expect(mockFirestore.doc).toHaveBeenCalled();
        });
    });

    describe("search", () => {
        beforeEach(() => {
            const mockPatients = [
                {
                    id: "1",
                    firstName: "John",
                    lastName: "Doe",
                    email: "john.doe@example.com",
                    contactNumber: "1234567890",
                },
                {
                    id: "2",
                    firstName: "Jane",
                    lastName: "Smith",
                    email: "jane.smith@example.com",
                    contactNumber: "0987654321",
                },
                {
                    id: "3",
                    firstName: "Bob",
                    lastName: "Johnson",
                    email: "bob.johnson@example.com",
                    contactNumber: "5555555555",
                },
            ];

            mockQuerySnapshot.docs = mockPatients.map((patient) => ({
                id: patient.id,
                data: () => patient,
            }));

            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);
        });

        it("should search by first name", async () => {
            const result = await repository.search("john");

            expect(result).toHaveLength(2); // Matches "John" and "Johnson"
            expect(result.some(p => p.firstName === "John")).toBe(true);
        });

        it("should search by last name", async () => {
            const result = await repository.search("smith");

            expect(result).toHaveLength(1);
            expect(result[0].lastName).toBe("Smith");
        });

        it("should search by email", async () => {
            const result = await repository.search("bob.johnson");

            expect(result).toHaveLength(1);
            expect(result[0].email).toBe("bob.johnson@example.com");
        });

        it("should search by contact number", async () => {
            const result = await repository.search("5555555555");

            expect(result).toHaveLength(1);
            expect(result[0].contactNumber).toBe("5555555555");
        });

        it("should return empty array when no matches found", async () => {
            const result = await repository.search("nonexistent");

            expect(result).toHaveLength(0);
        });

        it("should be case insensitive", async () => {
            const result = await repository.search("JOHN");

            expect(result).toHaveLength(2); // Matches "John" and "Johnson"
            expect(result.some(p => p.firstName === "John")).toBe(true);
        });

        it("should find partial matches", async () => {
            const result = await repository.search("jo");

            expect(result).toHaveLength(2); // John and Johnson
        });
    });
});
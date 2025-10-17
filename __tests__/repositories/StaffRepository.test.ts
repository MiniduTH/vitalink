import {
    StaffRepository,
    DepartmentRepository,
    HospitalRepository,
} from "@/lib/firestore/repositories/StaffRepository";
import { Timestamp } from "firebase/firestore";
import { Staff, CreateStaffDTO, Department, Hospital } from "@/lib/types";

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
    query: jest.fn(),
    where: jest.fn(),
    Timestamp: {
        now: jest.fn(() => ({ toMillis: () => Date.now() })),
    },
}));

const mockFirestore = require("firebase/firestore");

describe("StaffRepository", () => {
    let repository: StaffRepository;
    let mockDocSnap: any;
    let mockQuerySnapshot: any;

    beforeEach(() => {
        repository = new StaffRepository();
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
        it("should return staff when document exists", async () => {
            const mockStaff = {
                firstName: "Dr. John",
                lastName: "Smith",
                email: "john.smith@hospital.com",
                role: "Doctor",
            };

            const mockDocSnap = {
                exists: jest.fn().mockReturnValue(true),
                id: "staff-1",
                data: jest.fn().mockReturnValue(mockStaff),
            };
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("staff-1");

            expect(result).toEqual({ id: "staff-1", ...mockStaff });
            expect(mockFirestore.doc).toHaveBeenCalled();
        });

        it("should return null when document does not exist", async () => {
            mockDocSnap.exists.mockReturnValue(false);
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("non-existent");

            expect(result).toBeNull();
        });
    });

    describe("findByFirebaseUid", () => {
        it("should return staff by Firebase UID", async () => {
            const mockStaff = {
                firstName: "John",
                lastName: "Doe",
                firebaseUid: "firebase-uid-123",
                role: "Staff",
            };

            mockQuerySnapshot.docs = [
                {
                    id: "staff-1",
                    data: () => mockStaff,
                },
            ];
            mockQuerySnapshot.empty = false;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByFirebaseUid("firebase-uid-123");

            expect(result).toEqual({ id: "staff-1", ...mockStaff });
            expect(mockFirestore.where).toHaveBeenCalledWith("firebaseUid", "==", "firebase-uid-123");
        });

        it("should return null when staff not found", async () => {
            mockQuerySnapshot.empty = true;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByFirebaseUid("non-existent-uid");

            expect(result).toBeNull();
        });
    });

    describe("findByRole", () => {
        it("should return staff members by role", async () => {
            const mockStaff = [
                { id: "1", firstName: "John", lastName: "Doe", role: "Doctor" },
                { id: "2", firstName: "Jane", lastName: "Smith", role: "Doctor" },
            ];

            mockQuerySnapshot.docs = mockStaff.map((staff) => ({
                id: staff.id,
                data: () => staff,
            }));

            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByRole("Doctor");

            expect(result).toHaveLength(2);
            expect(mockFirestore.where).toHaveBeenCalledWith("role", "==", "Doctor");
        });
    });

    describe("findDoctors", () => {
        it("should return all doctors", async () => {
            const mockDoctors = [
                { id: "1", firstName: "Dr. John", lastName: "Smith", role: "Doctor" },
                { id: "2", firstName: "Dr. Jane", lastName: "Doe", role: "Doctor" },
            ];

            mockQuerySnapshot.docs = mockDoctors.map((doctor) => ({
                id: doctor.id,
                data: () => doctor,
            }));

            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findDoctors();

            expect(result).toHaveLength(2);
            expect(mockFirestore.where).toHaveBeenCalledWith("role", "==", "Doctor");
        });
    });

    describe("create", () => {
        it("should create staff", async () => {
            const createData: CreateStaffDTO = {
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@hospital.com",
                firebaseUid: "firebase-uid-123",
                role: "Doctor",
                departmentId: "dept-1",
                specialization: "Cardiology",
                licenseNumber: "LIC123456",
            };

            mockFirestore.addDoc.mockResolvedValue({ id: "new-staff-id" });

            const result = await repository.create(createData);

            expect(result).toBe("new-staff-id");
            expect(mockFirestore.addDoc).toHaveBeenCalled();
        });

        it("should create staff without optional fields", async () => {
            const createData: CreateStaffDTO = {
                firstName: "Jane",
                lastName: "Smith",
                email: "jane.smith@hospital.com",
                firebaseUid: "firebase-uid-456",
                role: "Staff",
            };

            mockFirestore.addDoc.mockResolvedValue({ id: "new-staff-id" });

            await repository.create(createData);

            expect(mockFirestore.addDoc).toHaveBeenCalled();
        });
    });
});

describe("DepartmentRepository", () => {
    let repository: DepartmentRepository;
    let mockDocSnap: any;
    let mockQuerySnapshot: any;

    beforeEach(() => {
        repository = new DepartmentRepository();
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
        it("should return department when document exists", async () => {
            const mockDepartment = {
                name: "Cardiology",
                hospitalId: "hospital-1",
                description: "Heart and cardiovascular care",
            };

            const mockDocSnap = {
                exists: jest.fn().mockReturnValue(true),
                id: "dept-1",
                data: jest.fn().mockReturnValue(mockDepartment),
            };
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("dept-1");

            expect(result).toEqual({ id: "dept-1", ...mockDepartment });
        });

        it("should return null when document does not exist", async () => {
            mockDocSnap.exists.mockReturnValue(false);
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("non-existent");

            expect(result).toBeNull();
        });
    });

    describe("findAll", () => {
        it("should return all departments", async () => {
            const mockDepartments = [
                { id: "1", name: "Cardiology", hospitalId: "hospital-1" },
                { id: "2", name: "Neurology", hospitalId: "hospital-1" },
            ];

            mockQuerySnapshot.docs = mockDepartments.map((dept) => ({
                id: dept.id,
                data: () => dept,
            }));

            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findAll();

            expect(result).toHaveLength(2);
            expect(mockFirestore.getDocs).toHaveBeenCalled();
        });
    });

    describe("findByHospitalId", () => {
        it("should return departments for a hospital", async () => {
            const mockDepartments = [
                { id: "1", name: "Cardiology", hospitalId: "hospital-1" },
                { id: "2", name: "Neurology", hospitalId: "hospital-1" },
            ];

            mockQuerySnapshot.docs = mockDepartments.map((dept) => ({
                id: dept.id,
                data: () => dept,
            }));

            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByHospitalId("hospital-1");

            expect(result).toHaveLength(2);
            expect(mockFirestore.where).toHaveBeenCalledWith("hospitalId", "==", "hospital-1");
        });
    });
});

describe("HospitalRepository", () => {
    let repository: HospitalRepository;
    let mockDocSnap: any;
    let mockQuerySnapshot: any;

    beforeEach(() => {
        repository = new HospitalRepository();
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
        it("should return hospital when document exists", async () => {
            const mockHospital = {
                name: "General Hospital",
                type: "Public",
                address: "123 Health St",
                contactNumber: "555-0123",
            };

            const mockDocSnap = {
                exists: jest.fn().mockReturnValue(true),
                id: "hospital-1",
                data: jest.fn().mockReturnValue(mockHospital),
            };
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("hospital-1");

            expect(result).toEqual({ id: "hospital-1", ...mockHospital });
        });

        it("should return null when document does not exist", async () => {
            mockDocSnap.exists.mockReturnValue(false);
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("non-existent");

            expect(result).toBeNull();
        });
    });

    describe("findAll", () => {
        it("should return all hospitals", async () => {
            const mockHospitals = [
                { id: "1", name: "General Hospital", type: "Public" },
                { id: "2", name: "Private Clinic", type: "Private" },
            ];

            mockQuerySnapshot.docs = mockHospitals.map((hospital) => ({
                id: hospital.id,
                data: () => hospital,
            }));

            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findAll();

            expect(result).toHaveLength(2);
            expect(mockFirestore.getDocs).toHaveBeenCalled();
        });
    });
});
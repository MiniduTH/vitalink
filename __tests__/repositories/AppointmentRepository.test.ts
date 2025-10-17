import { AppointmentRepository } from "@/lib/firestore/repositories/AppointmentRepository";
import { Timestamp } from "firebase/firestore";
import { Appointment, CreateAppointmentDTO } from "@/lib/types";

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
        fromDate: jest.fn((date: Date) => ({ toMillis: () => date.getTime() })),
    },
}));

const mockFirestore = require("firebase/firestore");

describe("AppointmentRepository", () => {
    let repository: AppointmentRepository;
    let mockDocSnap: any;
    let mockQuerySnapshot: any;

    beforeEach(() => {
        repository = new AppointmentRepository();
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
        it("should return appointment when document exists", async () => {
            const mockAppointment = {
                patientId: "patient-1",
                doctorId: "doctor-1",
                status: "Scheduled",
            };

            mockDocSnap.exists.mockReturnValue(true);
            mockDocSnap.data.mockReturnValue(mockAppointment);
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("test-id");

            expect(result).toEqual({ id: "test-id", ...mockAppointment });
            expect(mockFirestore.doc).toHaveBeenCalled();
        });

        it("should return null when document does not exist", async () => {
            mockDocSnap.exists.mockReturnValue(false);
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("non-existent-id");

            expect(result).toBeNull();
        });
    });

    describe("findAll", () => {
        it("should return all appointments with default ordering", async () => {
            const mockAppointments = [
                { id: "1", patientId: "patient-1", status: "Scheduled" },
                { id: "2", patientId: "patient-2", status: "Completed" },
            ];

            mockQuerySnapshot.docs = mockAppointments.map((apt) => ({
                id: apt.id,
                data: () => apt,
            }));

            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findAll();

            expect(result).toHaveLength(2);
            expect(mockFirestore.orderBy).toHaveBeenCalledWith("appointmentDate", "desc");
        });

        it("should apply status filter when provided", async () => {
            mockQuerySnapshot.docs = [];
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            await repository.findAll({ status: "Scheduled" });

            expect(mockFirestore.where).toHaveBeenCalledWith("status", "==", "Scheduled");
        });

        it("should apply limit when provided", async () => {
            mockQuerySnapshot.docs = [];
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            await repository.findAll({ limit: 10 });

            expect(mockFirestore.limit).toHaveBeenCalledWith(10);
        });
    });

    describe("findByPatientId", () => {
        it("should return appointments for a patient sorted by date", async () => {
            const mockAppointments = [
                {
                    id: "1",
                    patientId: "patient-1",
                    appointmentDate: { toMillis: () => 1000 },
                },
                {
                    id: "2",
                    patientId: "patient-1",
                    appointmentDate: { toMillis: () => 2000 },
                },
            ];

            mockQuerySnapshot.docs = mockAppointments.map((apt) => ({
                id: apt.id,
                data: () => apt,
            }));

            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByPatientId("patient-1");

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe("2"); // Newer appointment first
            expect(mockFirestore.where).toHaveBeenCalledWith("patientId", "==", "patient-1");
        });
    });

    describe("findByDoctorId", () => {
        it("should return appointments for a doctor", async () => {
            const mockAppointments = [
                {
                    id: "1",
                    doctorId: "doctor-1",
                    appointmentDate: { toMillis: () => 1000 },
                },
            ];

            mockQuerySnapshot.docs = mockAppointments.map((apt) => ({
                id: apt.id,
                data: () => apt,
            }));

            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByDoctorId("doctor-1");

            expect(result).toHaveLength(1);
            expect(mockFirestore.where).toHaveBeenCalledWith("doctorId", "==", "doctor-1");
        });

        it("should filter by date when provided", async () => {
            const testDate = Timestamp.now();
            mockQuerySnapshot.docs = [];
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            await repository.findByDoctorId("doctor-1", testDate);

            expect(mockFirestore.where).toHaveBeenCalledWith("doctorId", "==", "doctor-1");
            expect(mockFirestore.where).toHaveBeenCalledWith("appointmentDate", "==", testDate);
        });
    });

    describe("findByDateRange", () => {
        it("should return appointments within date range", async () => {
            const startDate = Timestamp.now();
            const endDate = Timestamp.now();
            mockQuerySnapshot.docs = [];
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            await repository.findByDateRange(startDate, endDate);

            expect(mockFirestore.where).toHaveBeenCalledWith("appointmentDate", ">=", startDate);
            expect(mockFirestore.where).toHaveBeenCalledWith("appointmentDate", "<=", endDate);
            expect(mockFirestore.orderBy).toHaveBeenCalledWith("appointmentDate", "asc");
        });
    });

    describe("create", () => {
        it("should create a new appointment", async () => {
            const createData: CreateAppointmentDTO = {
                patientId: "patient-1",
                doctorId: "doctor-1",
                departmentId: "dept-1",
                appointmentDate: Timestamp.now(),
                timeSlot: "09:00",
                reason: "Checkup",
            };

            mockFirestore.addDoc.mockResolvedValue({ id: "new-id" });

            const result = await repository.create(createData);

            expect(result).toBe("new-id");
            expect(mockFirestore.addDoc).toHaveBeenCalled();
        });

        it("should preserve notes when provided", async () => {
            const createData: CreateAppointmentDTO = {
                patientId: "patient-1",
                doctorId: "doctor-1",
                departmentId: "dept-1",
                appointmentDate: Timestamp.now(),
                timeSlot: "09:00",
                reason: "Checkup",
                notes: "Special instructions",
            };

            mockFirestore.addDoc.mockResolvedValue({ id: "new-id" });

            await repository.create(createData);

            expect(mockFirestore.addDoc).toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("should update appointment", async () => {
            const updateData = { status: "Completed" as const };

            await repository.update("test-id", updateData);

            expect(mockFirestore.updateDoc).toHaveBeenCalled();
        });
    });

    describe("delete", () => {
        it("should delete appointment", async () => {
            await repository.delete("test-id");

            expect(mockFirestore.deleteDoc).toHaveBeenCalled();
            expect(mockFirestore.doc).toHaveBeenCalled();
        });
    });

    describe("checkSlotAvailability", () => {
        it("should return true when slot is available", async () => {
            mockQuerySnapshot.empty = true;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.checkSlotAvailability(
                "doctor-1",
                Timestamp.now(),
                "09:00"
            );

            expect(result).toBe(true);
            expect(mockFirestore.where).toHaveBeenCalledWith("doctorId", "==", "doctor-1");
            expect(mockFirestore.where).toHaveBeenCalledWith("timeSlot", "==", "09:00");
            expect(mockFirestore.where).toHaveBeenCalledWith(
                "status",
                "in",
                ["Scheduled", "Confirmed", "CheckedIn"]
            );
        });

        it("should return false when slot is not available", async () => {
            mockQuerySnapshot.empty = false;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.checkSlotAvailability(
                "doctor-1",
                Timestamp.now(),
                "09:00"
            );

            expect(result).toBe(false);
        });
    });
});
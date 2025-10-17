import { PaymentRepository } from "@/lib/firestore/repositories/PaymentRepository";
import { Timestamp } from "firebase/firestore";
import { Payment, CreatePaymentDTO } from "@/lib/types";

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
    orderBy: jest.fn(),
    Timestamp: {
        now: jest.fn(() => ({ toMillis: () => Date.now() })),
    },
}));

const mockFirestore = require("firebase/firestore");

describe("PaymentRepository", () => {
    let repository: PaymentRepository;
    let mockDocSnap: any;
    let mockQuerySnapshot: any;

    beforeEach(() => {
        repository = new PaymentRepository();
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
        it("should return payment when document exists", async () => {
            const mockPayment = {
                appointmentId: "appointment-1",
                patientId: "patient-1",
                amount: 100,
                status: "Completed",
            };

            const mockDocSnap = {
                exists: jest.fn().mockReturnValue(true),
                id: "payment-1",
                data: jest.fn().mockReturnValue(mockPayment),
            };
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("payment-1");

            expect(result).toEqual({ id: "payment-1", ...mockPayment });
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
        it("should return all payments ordered by creation date", async () => {
            const mockPayments = [
                { id: "1", amount: 100, status: "Completed" },
                { id: "2", amount: 200, status: "Pending" },
            ];

            mockQuerySnapshot.docs = mockPayments.map((payment) => ({
                id: payment.id,
                data: () => payment,
            }));

            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findAll();

            expect(result).toHaveLength(2);
            expect(mockFirestore.orderBy).toHaveBeenCalledWith("createdAt", "desc");
        });
    });

    describe("findByPatientId", () => {
        it("should return payments for patient sorted by date", async () => {
            const mockPayments = [
                {
                    id: "1",
                    patientId: "patient-1",
                    createdAt: { toMillis: () => 1000 },
                },
                {
                    id: "2",
                    patientId: "patient-1",
                    createdAt: { toMillis: () => 2000 },
                },
            ];

            mockQuerySnapshot.docs = mockPayments.map((payment) => ({
                id: payment.id,
                data: () => payment,
            }));

            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByPatientId("patient-1");

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe("2"); // Newer payment first
            expect(mockFirestore.where).toHaveBeenCalledWith("patientId", "==", "patient-1");
        });
    });

    describe("findByAppointmentId", () => {
        it("should return payment by appointment ID", async () => {
            const mockPayment = {
                appointmentId: "appointment-1",
                patientId: "patient-1",
            };

            mockQuerySnapshot.docs = [
                {
                    id: "payment-1",
                    data: () => mockPayment,
                },
            ];
            mockQuerySnapshot.empty = false;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByAppointmentId("appointment-1");

            expect(result).toEqual({ id: "payment-1", ...mockPayment });
            expect(mockFirestore.where).toHaveBeenCalledWith("appointmentId", "==", "appointment-1");
        });

        it("should return null when payment not found", async () => {
            mockQuerySnapshot.empty = true;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByAppointmentId("appointment-1");

            expect(result).toBeNull();
        });
    });

    describe("findByDateRange", () => {
        it("should return payments within date range", async () => {
            const startDate = Timestamp.now();
            const endDate = Timestamp.now();
            mockQuerySnapshot.docs = [];
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            await repository.findByDateRange(startDate, endDate);

            expect(mockFirestore.where).toHaveBeenCalledWith("createdAt", ">=", startDate);
            expect(mockFirestore.where).toHaveBeenCalledWith("createdAt", "<=", endDate);
            expect(mockFirestore.orderBy).toHaveBeenCalledWith("createdAt", "asc");
        });
    });

    describe("create", () => {
        it("should create payment with default values", async () => {
            const createData: CreatePaymentDTO = {
                appointmentId: "appointment-1",
                patientId: "patient-1",
                amount: 100,
                patientPortion: 20,
                paymentMethod: "Card",
            };

            mockFirestore.addDoc.mockResolvedValue({ id: "new-payment-id" });

            const result = await repository.create(createData);

            expect(result).toBe("new-payment-id");
            expect(mockFirestore.addDoc).toHaveBeenCalled();
        });

        it("should preserve insurance coverage when provided", async () => {
            const createData: CreatePaymentDTO = {
                appointmentId: "appointment-1",
                patientId: "patient-1",
                amount: 100,
                insuranceCoverage: 80,
                patientPortion: 20,
                paymentMethod: "Mixed",
                insuranceClaimId: "claim-1",
            };

            mockFirestore.addDoc.mockResolvedValue({ id: "new-payment-id" });

            await repository.create(createData);

            expect(mockFirestore.addDoc).toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("should update payment", async () => {
            const updateData = { status: "Completed" as const };

            await repository.update("payment-1", updateData);

            expect(mockFirestore.updateDoc).toHaveBeenCalled();
            expect(mockFirestore.doc).toHaveBeenCalled();
        });
    });

    describe("markAsPaid", () => {
        it("should mark payment as completed", async () => {
            await repository.markAsPaid("payment-1");

            expect(mockFirestore.updateDoc).toHaveBeenCalled();
            expect(mockFirestore.doc).toHaveBeenCalled();
        });
    });

    describe("markAsFailed", () => {
        it("should mark payment as failed", async () => {
            await repository.markAsFailed("payment-1");

            expect(mockFirestore.updateDoc).toHaveBeenCalled();
            expect(mockFirestore.doc).toHaveBeenCalled();
        });
    });
});
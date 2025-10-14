/**
 * @jest-environment node
 */
import { BillingService } from "@/lib/services/BillingService";
import { PaymentRepository } from "@/lib/firestore/repositories/PaymentRepository";
import { InsuranceService } from "@/lib/services/InsuranceService";
import { NotificationService } from "@/lib/services/NotificationService";
import { Payment, CreatePaymentDTO, ValidationError, NotFoundError } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

// Mock repositories and services
jest.mock("@/lib/firestore/repositories/PaymentRepository");
jest.mock("@/lib/services/InsuranceService");
jest.mock("@/lib/services/NotificationService");

describe("BillingService", () => {
    let billingService: BillingService;
    let mockPaymentRepo: jest.Mocked<PaymentRepository>;
    let mockInsuranceService: jest.Mocked<InsuranceService>;
    let mockNotificationService: jest.Mocked<NotificationService>;

    const mockPayment: Payment = {
        id: "payment123",
        appointmentId: "appt123",
        patientId: "patient123",
        amount: 5000,
        insuranceCoverage: 3500,
        patientPortion: 1500,
        status: "Pending",
        paymentMethod: "Mixed",
        transactionId: "txn123",
        createdAt: Timestamp.now(),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockPaymentRepo = new PaymentRepository() as jest.Mocked<PaymentRepository>;
        mockInsuranceService = new InsuranceService(null as any, null as any, null as any) as jest.Mocked<InsuranceService>;
        mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

        billingService = new BillingService(mockPaymentRepo, mockInsuranceService, mockNotificationService);
    });

    describe("calculateBill", () => {
        it("should calculate bill with insurance coverage", async () => {
            mockInsuranceService.checkEligibility.mockResolvedValue({
                eligible: true,
                coveragePercentage: 70,
                approvedAmount: 3500,
                claimId: "claim123",
            });

            const result = await billingService.calculateBill("appt123", 5000, "patient123");

            expect(result.amount).toBe(5000);
            expect(result.insuranceCoverage).toBe(3500);
            expect(result.patientPortion).toBe(1500);
        });

        it("should calculate bill without insurance when no coverage", async () => {
            mockInsuranceService.checkEligibility.mockRejectedValue(new Error("No insurance"));

            const result = await billingService.calculateBill("appt123", 5000, "patient123");

            expect(result.amount).toBe(5000);
            expect(result.insuranceCoverage).toBe(0);
            expect(result.patientPortion).toBe(5000);
        });
    });

    describe("generateBill", () => {
        const validBillData: CreatePaymentDTO = {
            appointmentId: "appt123",
            patientId: "patient123",
            amount: 5000,
            patientPortion: 1500,
            paymentMethod: "Mixed",
        };

        it("should successfully generate a bill", async () => {
            mockPaymentRepo.create.mockResolvedValue("payment123");
            mockPaymentRepo.findById.mockResolvedValue(mockPayment);

            const result = await billingService.generateBill(validBillData);

            expect(result).toEqual(mockPayment);
            expect(mockPaymentRepo.create).toHaveBeenCalledWith(validBillData);
        });

        it("should throw ValidationError for invalid amount", async () => {
            const invalidData = { ...validBillData, amount: -100 };

            await expect(billingService.generateBill(invalidData)).rejects.toThrow(ValidationError);
        });

        it("should throw ValidationError for zero amount", async () => {
            const invalidData = { ...validBillData, amount: 0 };

            await expect(billingService.generateBill(invalidData)).rejects.toThrow(ValidationError);
        });

        it("should throw ValidationError for negative patient portion", async () => {
            const invalidData = { ...validBillData, patientPortion: -100 };

            await expect(billingService.generateBill(invalidData)).rejects.toThrow(ValidationError);
        });
    });

    describe("processPayment", () => {
        it("should successfully process a cash payment", async () => {
            const processedPayment = {
                ...mockPayment,
                status: "Completed" as const,
                paidAt: Timestamp.now(),
            };
            mockPaymentRepo.findById.mockResolvedValueOnce(mockPayment);
            mockPaymentRepo.markAsPaid.mockResolvedValue(undefined);
            mockPaymentRepo.update.mockResolvedValue(undefined);
            mockPaymentRepo.findById.mockResolvedValueOnce(processedPayment);

            const result = await billingService.processPayment("payment123", "Cash");

            expect(result.status).toBe("Completed");
            expect(mockPaymentRepo.markAsPaid).toHaveBeenCalledWith("payment123");
            expect(mockNotificationService.sendPaymentConfirmation).toHaveBeenCalled();
        });

        it("should successfully process a card payment", async () => {
            const cardDetails = { cardNumber: "4111111111111111", cvv: "123" };
            const processedPayment = {
                ...mockPayment,
                status: "Completed" as const,
            };
            mockPaymentRepo.findById.mockResolvedValueOnce(mockPayment);
            mockPaymentRepo.markAsPaid.mockResolvedValue(undefined);
            mockPaymentRepo.update.mockResolvedValue(undefined);
            mockPaymentRepo.findById.mockResolvedValueOnce(processedPayment);

            const result = await billingService.processPayment("payment123", "Card", cardDetails);

            expect(result.status).toBe("Completed");
        });

        it("should throw NotFoundError when payment does not exist", async () => {
            mockPaymentRepo.findById.mockResolvedValue(null);

            await expect(billingService.processPayment("nonexistent", "Cash")).rejects.toThrow(NotFoundError);
        });

        it("should throw ValidationError when payment already completed", async () => {
            const completedPayment = { ...mockPayment, status: "Completed" as const };
            mockPaymentRepo.findById.mockResolvedValue(completedPayment);

            await expect(billingService.processPayment("payment123", "Cash")).rejects.toThrow(ValidationError);
        });
    });

    describe("getPayment", () => {
        it("should return payment when found", async () => {
            mockPaymentRepo.findById.mockResolvedValue(mockPayment);

            const result = await billingService.getPayment("payment123");

            expect(result).toEqual(mockPayment);
        });

        it("should throw NotFoundError when payment does not exist", async () => {
            mockPaymentRepo.findById.mockResolvedValue(null);

            await expect(billingService.getPayment("nonexistent")).rejects.toThrow(NotFoundError);
        });
    });

    describe("getPatientPayments", () => {
        it("should return all patient payments", async () => {
            const payments = [mockPayment, { ...mockPayment, id: "payment456" }];
            mockPaymentRepo.findByPatientId.mockResolvedValue(payments);

            const result = await billingService.getPatientPayments("patient123");

            expect(result).toEqual(payments);
            expect(result.length).toBe(2);
        });

        it("should return empty array when patient has no payments", async () => {
            mockPaymentRepo.findByPatientId.mockResolvedValue([]);

            const result = await billingService.getPatientPayments("patient123");

            expect(result).toEqual([]);
        });
    });

    describe("Edge Cases", () => {
        it("should handle full insurance coverage", async () => {
            mockInsuranceService.checkEligibility.mockResolvedValue({
                eligible: true,
                coveragePercentage: 100,
                approvedAmount: 5000,
                claimId: "claim456",
            });

            const result = await billingService.calculateBill("appt123", 5000, "patient123");

            expect(result.insuranceCoverage).toBe(5000);
            expect(result.patientPortion).toBe(0);
        });

        it("should handle payment failure and mark as failed", async () => {
            mockPaymentRepo.findById.mockResolvedValue(mockPayment);
            mockPaymentRepo.markAsFailed.mockResolvedValue(undefined);

            await billingService.handlePaymentFailure("payment123");

            expect(mockPaymentRepo.markAsFailed).toHaveBeenCalledWith("payment123");
            expect(mockNotificationService.sendPaymentFailureNotification).toHaveBeenCalled();
        });
    });
});

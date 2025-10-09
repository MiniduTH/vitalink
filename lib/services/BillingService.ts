import { PaymentRepository } from "@/lib/firestore/repositories/PaymentRepository";
import { InsuranceService } from "@/lib/services/InsuranceService";
import { NotificationService } from "@/lib/services/NotificationService";
import { Payment, CreatePaymentDTO, NotFoundError, ValidationError } from "@/lib/types";

export class BillingService {
    constructor(
        private paymentRepo: PaymentRepository,
        private insuranceService: InsuranceService,
        private notificationService: NotificationService
    ) {}

    async calculateBill(
        appointmentId: string,
        baseAmount: number,
        patientId: string
    ): Promise<{
        amount: number;
        insuranceCoverage: number;
        patientPortion: number;
    }> {
        // Check for active insurance
        try {
            const eligibility = await this.insuranceService.checkEligibility({
                patientId,
                amount: baseAmount,
                policyNumber: "", // Will be fetched by service
            });

            const insuranceCoverage = eligibility.approvedAmount;
            const patientPortion = baseAmount - insuranceCoverage;

            return {
                amount: baseAmount,
                insuranceCoverage,
                patientPortion,
            };
        } catch (error) {
            // No insurance coverage
            return {
                amount: baseAmount,
                insuranceCoverage: 0,
                patientPortion: baseAmount,
            };
        }
    }

    async generateBill(data: CreatePaymentDTO): Promise<Payment> {
        // Validate input
        this.validatePaymentData(data);

        // Create payment record
        const paymentId = await this.paymentRepo.create(data);

        const payment = await this.paymentRepo.findById(paymentId);
        if (!payment) throw new Error("Failed to create payment");

        return payment;
    }

    async processPayment(paymentId: string, paymentMethod: "Cash" | "Card", paymentDetails?: any): Promise<Payment> {
        const payment = await this.paymentRepo.findById(paymentId);
        if (!payment) {
            throw new NotFoundError("Payment not found");
        }

        if (payment.status === "Completed") {
            throw new ValidationError("Payment already completed");
        }

        try {
            // Process payment through mock gateway
            let success = true;
            if (paymentMethod === "Card" && paymentDetails) {
                const result = await this.processCardPayment(payment.patientPortion, paymentDetails);
                success = result.success;
            }

            if (success) {
                await this.paymentRepo.markAsPaid(paymentId);
                await this.paymentRepo.update(paymentId, { paymentMethod });

                const updatedPayment = await this.paymentRepo.findById(paymentId);
                if (updatedPayment) {
                    await this.notificationService.sendPaymentConfirmation(updatedPayment);
                }
                return updatedPayment!;
            } else {
                await this.handlePaymentFailure(paymentId);
                throw new ValidationError("Payment processing failed");
            }
        } catch (error) {
            await this.handlePaymentFailure(paymentId);
            throw error;
        }
    }

    async handlePaymentFailure(paymentId: string): Promise<void> {
        await this.paymentRepo.markAsFailed(paymentId);
        const payment = await this.paymentRepo.findById(paymentId);
        if (payment) {
            await this.notificationService.sendPaymentFailureNotification(payment);
        }
    }

    async getPayment(id: string): Promise<Payment> {
        const payment = await this.paymentRepo.findById(id);
        if (!payment) {
            throw new NotFoundError("Payment not found");
        }
        return payment;
    }

    async getPatientPayments(patientId: string): Promise<Payment[]> {
        return this.paymentRepo.findByPatientId(patientId);
    }

    private async processCardPayment(amount: number, cardDetails: any): Promise<{ success: boolean; transactionId?: string; error?: string }> {
        // Mock payment gateway call
        // In production, this would call an actual payment processor
        const success = Math.random() > 0.1; // 90% success rate

        return success ? { success: true, transactionId: `TXN${Date.now()}` } : { success: false, error: "Payment declined" };
    }

    private validatePaymentData(data: CreatePaymentDTO): void {
        if (!data.appointmentId || !data.patientId) {
            throw new ValidationError("Appointment and Patient are required");
        }
        if (!data.amount || data.amount <= 0) {
            throw new ValidationError("Valid amount is required");
        }
        if (!data.patientPortion || data.patientPortion < 0) {
            throw new ValidationError("Valid patient portion is required");
        }
    }
}

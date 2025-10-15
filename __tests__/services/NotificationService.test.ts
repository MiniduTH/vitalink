/**
 * @jest-environment node
 */
import { NotificationService } from "@/lib/services/NotificationService";
import { Appointment, Payment } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

describe("NotificationService", () => {
    let notificationService: NotificationService;
    let consoleLogSpy: jest.SpyInstance;

    const mockAppointment: Appointment = {
        id: "appt123",
        patientId: "patient123",
        doctorId: "doctor456",
        departmentId: "dept789",
        appointmentDate: Timestamp.now(),
        timeSlot: "09:00 AM",
        status: "Scheduled",
        reason: "Annual checkup",
        notes: "First visit",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const mockPayment: Payment = {
        id: "pay123",
        appointmentId: "appt123",
        patientId: "patient123",
        amount: 5000,
        insuranceCoverage: 3000,
        patientPortion: 2000,
        status: "Completed",
        paymentMethod: "Card",
        transactionId: "TXN123",
        createdAt: Timestamp.now(),
    };

    beforeEach(() => {
        notificationService = new NotificationService();
        consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe("sendAppointmentConfirmation", () => {
        it("should log appointment confirmation message with appointment details", async () => {
            await notificationService.sendAppointmentConfirmation(mockAppointment);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Appointment confirmation sent for appointment appt123"));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Patient: patient123"));
        });
    });

    describe("sendCheckInNotification", () => {
        it("should log check-in notification message", async () => {
            await notificationService.sendCheckInNotification(mockAppointment);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Check-in notification sent for appointment appt123"));
        });
    });

    describe("sendCancellationNotification", () => {
        it("should log cancellation notification message", async () => {
            await notificationService.sendCancellationNotification(mockAppointment);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Cancellation notification sent for appointment appt123"));
        });
    });

    describe("sendRescheduleNotification", () => {
        it("should log reschedule notification message", async () => {
            await notificationService.sendRescheduleNotification(mockAppointment);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Reschedule notification sent for appointment appt123"));
        });
    });

    describe("sendPaymentConfirmation", () => {
        it("should log payment confirmation message with amount and status", async () => {
            await notificationService.sendPaymentConfirmation(mockPayment);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Payment confirmation sent for payment pay123"));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Amount: 5000"));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Status: Completed"));
        });
    });

    describe("sendPaymentFailureNotification", () => {
        it("should log payment failure notification message", async () => {
            const failedPayment = { ...mockPayment, status: "Failed" as const };
            await notificationService.sendPaymentFailureNotification(failedPayment);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Payment failure notification sent for payment pay123"));
        });
    });

    describe("sendInsuranceClaimUpdate", () => {
        it("should log insurance claim update message", async () => {
            await notificationService.sendInsuranceClaimUpdate("CLAIM789", "Approved");

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Insurance claim CLAIM789 status updated to: Approved"));
        });

        it("should handle different claim statuses", async () => {
            await notificationService.sendInsuranceClaimUpdate("CLAIM456", "Pending");

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("CLAIM456"));
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Pending"));
        });
    });

    describe("Edge Cases", () => {
        it("should handle multiple notifications in sequence", async () => {
            await notificationService.sendAppointmentConfirmation(mockAppointment);
            await notificationService.sendPaymentConfirmation(mockPayment);
            await notificationService.sendInsuranceClaimUpdate("CLAIM1", "Pending");

            expect(consoleLogSpy.mock.calls.length).toBeGreaterThan(3);
        });

        it("should handle appointments with different statuses", async () => {
            const completedAppt = { ...mockAppointment, status: "Completed" as const };
            await notificationService.sendAppointmentConfirmation(completedAppt);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("appt123"));
        });

        it("should handle large payment amounts", async () => {
            const largePayment = { ...mockPayment, amount: 999999.99 };
            await notificationService.sendPaymentConfirmation(largePayment);

            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("999999.99"));
        });

        it("should return promises for all notification methods", async () => {
            await expect(notificationService.sendAppointmentConfirmation(mockAppointment)).resolves.toBeUndefined();

            await expect(notificationService.sendPaymentConfirmation(mockPayment)).resolves.toBeUndefined();

            await expect(notificationService.sendInsuranceClaimUpdate("CLAIM1", "Rejected")).resolves.toBeUndefined();
        });
    });
});

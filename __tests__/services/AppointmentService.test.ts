/**
 * @jest-environment node
 */
import { AppointmentService } from "@/lib/services/AppointmentService";
import { AppointmentRepository } from "@/lib/firestore/repositories/AppointmentRepository";
import { NotificationService } from "@/lib/services/NotificationService";
import { Appointment, BookAppointmentDTO, ValidationError, NotFoundError, ConflictError } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

// Mock repositories and services
jest.mock("@/lib/firestore/repositories/AppointmentRepository");
jest.mock("@/lib/services/NotificationService");

describe("AppointmentService", () => {
    let appointmentService: AppointmentService;
    let mockAppointmentRepo: jest.Mocked<AppointmentRepository>;
    let mockNotificationService: jest.Mocked<NotificationService>;

    // Shared test data
    const validAppointmentData: BookAppointmentDTO = {
        patientId: "patient123",
        doctorId: "doctor456",
        departmentId: "dept789",
        appointmentDate: Timestamp.fromDate(new Date("2025-12-20T10:00:00")),
        timeSlot: "10:00",
        reason: "Annual checkup",
        notes: "Patient requested morning slot",
        status: "Scheduled",
    };

    const mockAppointment: Appointment = {
        id: "appt123",
        patientId: "patient123",
        doctorId: "doctor456",
        departmentId: "dept789",
        appointmentDate: Timestamp.fromDate(new Date("2025-12-20T10:00:00")),
        timeSlot: "10:00",
        reason: "Annual checkup",
        notes: "Patient requested morning slot",
        status: "Scheduled",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockAppointmentRepo = new AppointmentRepository() as jest.Mocked<AppointmentRepository>;
        mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

        appointmentService = new AppointmentService(mockAppointmentRepo, mockNotificationService);
    });

    describe("bookAppointment", () => {
        it("should successfully book an appointment when slot is available", async () => {
            mockAppointmentRepo.checkSlotAvailability.mockResolvedValue(true);
            mockAppointmentRepo.create.mockResolvedValue("appt123");
            mockAppointmentRepo.findById.mockResolvedValue(mockAppointment);

            const result = await appointmentService.bookAppointment(validAppointmentData);

            expect(result).toEqual(mockAppointment);
            expect(mockAppointmentRepo.checkSlotAvailability).toHaveBeenCalledWith("doctor456", validAppointmentData.appointmentDate, "10:00");
            expect(mockAppointmentRepo.create).toHaveBeenCalled();
            expect(mockNotificationService.sendAppointmentConfirmation).toHaveBeenCalledWith(mockAppointment);
        });

        it("should throw ConflictError when slot is not available", async () => {
            mockAppointmentRepo.checkSlotAvailability.mockResolvedValue(false);

            await expect(appointmentService.bookAppointment(validAppointmentData)).rejects.toThrow(ConflictError);
        });

        it("should throw ValidationError for missing required fields", async () => {
            const invalidData: any = {
                ...validAppointmentData,
                patientId: "",
            };

            await expect(appointmentService.bookAppointment(invalidData)).rejects.toThrow(ValidationError);
        });

        it("should throw ValidationError for appointment date in the past", async () => {
            const pastData = {
                ...validAppointmentData,
                appointmentDate: Timestamp.fromDate(new Date("2020-01-01T10:00:00")),
            };

            await expect(appointmentService.bookAppointment(pastData)).rejects.toThrow(ValidationError);
        });
    });

    describe("checkIn", () => {
        it("should successfully check in a scheduled appointment", async () => {
            const checkedInAppointment = {
                ...mockAppointment,
                status: "CheckedIn" as const,
            };
            mockAppointmentRepo.findById.mockResolvedValueOnce(mockAppointment);
            mockAppointmentRepo.update.mockResolvedValue(undefined);
            mockAppointmentRepo.findById.mockResolvedValueOnce(checkedInAppointment);

            const result = await appointmentService.checkIn("appt123");

            expect(result.status).toBe("CheckedIn");
            expect(mockNotificationService.sendCheckInNotification).toHaveBeenCalled();
        });

        it("should throw NotFoundError when appointment does not exist", async () => {
            mockAppointmentRepo.findById.mockResolvedValue(null);

            await expect(appointmentService.checkIn("nonexistent")).rejects.toThrow(NotFoundError);
        });

        it("should throw ValidationError when checking in cancelled appointment", async () => {
            const cancelledAppointment = {
                ...mockAppointment,
                status: "Cancelled" as const,
            };
            mockAppointmentRepo.findById.mockResolvedValue(cancelledAppointment);

            await expect(appointmentService.checkIn("appt123")).rejects.toThrow(ValidationError);
        });
    });

    describe("completeAppointment", () => {
        it("should successfully complete a checked-in appointment", async () => {
            const checkedInAppointment = {
                ...mockAppointment,
                status: "CheckedIn" as const,
            };
            const completedAppointment = {
                ...mockAppointment,
                status: "Completed" as const,
            };
            mockAppointmentRepo.findById.mockResolvedValueOnce(checkedInAppointment);
            mockAppointmentRepo.update.mockResolvedValue(undefined);
            mockAppointmentRepo.findById.mockResolvedValueOnce(completedAppointment);

            const result = await appointmentService.completeAppointment("appt123");

            expect(result.status).toBe("Completed");
        });

        it("should throw ValidationError when completing non-checked-in appointment", async () => {
            mockAppointmentRepo.findById.mockResolvedValue(mockAppointment);

            await expect(appointmentService.completeAppointment("appt123")).rejects.toThrow(ValidationError);
        });
    });

    describe("cancelAppointment", () => {
        it("should successfully cancel a scheduled appointment", async () => {
            const cancelledAppointment = {
                ...mockAppointment,
                status: "Cancelled" as const,
            };
            mockAppointmentRepo.findById.mockResolvedValueOnce(mockAppointment);
            mockAppointmentRepo.update.mockResolvedValue(undefined);
            mockAppointmentRepo.findById.mockResolvedValueOnce(cancelledAppointment);

            const result = await appointmentService.cancelAppointment("appt123");

            expect(result.status).toBe("Cancelled");
            expect(mockNotificationService.sendCancellationNotification).toHaveBeenCalled();
        });

        it("should throw ValidationError when cancelling completed appointment", async () => {
            const completedAppointment = {
                ...mockAppointment,
                status: "Completed" as const,
            };
            mockAppointmentRepo.findById.mockResolvedValue(completedAppointment);

            await expect(appointmentService.cancelAppointment("appt123")).rejects.toThrow(ValidationError);
        });
    });

    describe("rescheduleAppointment", () => {
        const newDate = Timestamp.fromDate(new Date("2025-10-21T14:00:00"));
        const newTimeSlot = "14:00";

        it("should successfully reschedule an appointment", async () => {
            const rescheduledAppointment = {
                ...mockAppointment,
                appointmentDate: newDate,
                timeSlot: newTimeSlot,
            };
            mockAppointmentRepo.findById.mockResolvedValueOnce(mockAppointment);
            mockAppointmentRepo.checkSlotAvailability.mockResolvedValue(true);
            mockAppointmentRepo.update.mockResolvedValue(undefined);
            mockAppointmentRepo.findById.mockResolvedValueOnce(rescheduledAppointment);

            const result = await appointmentService.rescheduleAppointment("appt123", newDate, newTimeSlot);

            expect(result.appointmentDate).toEqual(newDate);
            expect(mockNotificationService.sendRescheduleNotification).toHaveBeenCalled();
        });

        it("should throw ConflictError when new slot is not available", async () => {
            mockAppointmentRepo.findById.mockResolvedValue(mockAppointment);
            mockAppointmentRepo.checkSlotAvailability.mockResolvedValue(false);

            await expect(appointmentService.rescheduleAppointment("appt123", newDate, newTimeSlot)).rejects.toThrow(ConflictError);
        });
    });

    describe("getAvailableSlots", () => {
        it("should return all slots when none are booked", async () => {
            mockAppointmentRepo.findByDoctorId.mockResolvedValue([]);

            const slots = await appointmentService.getAvailableSlots("doctor456", Timestamp.fromDate(new Date("2025-12-20")));

            expect(slots.length).toBeGreaterThan(0);
            expect(slots).toContain("09:00");
        });

        it("should exclude booked slots from available slots", async () => {
            const bookedAppointments = [{ ...mockAppointment, timeSlot: "10:00", status: "Scheduled" as const }];
            mockAppointmentRepo.findByDoctorId.mockResolvedValue(bookedAppointments);

            const slots = await appointmentService.getAvailableSlots("doctor456", Timestamp.fromDate(new Date("2025-12-20")));

            expect(slots).not.toContain("10:00");
            expect(slots).toContain("09:00");
        });
    });
});

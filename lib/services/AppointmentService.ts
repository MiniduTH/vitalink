import { AppointmentRepository } from "@/lib/firestore/repositories/AppointmentRepository";
import { NotificationService } from "@/lib/services/NotificationService";
import { Appointment, BookAppointmentDTO, NotFoundError, ValidationError, ConflictError } from "@/lib/types";
import { Timestamp, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export class AppointmentService {
    constructor(private appointmentRepo: AppointmentRepository, private notificationService: NotificationService) {}

    async bookAppointment(data: BookAppointmentDTO): Promise<Appointment> {
        // 1. Validate input
        this.validateAppointmentData(data);

        // 2. Check slot availability
        const isAvailable = await this.appointmentRepo.checkSlotAvailability(data.doctorId, data.appointmentDate, data.timeSlot);

        if (!isAvailable) {
            throw new ConflictError("Selected time slot is not available");
        }

        // 3. Create appointment
        const appointmentId = await this.appointmentRepo.create({
            ...data,
            notes: data.notes || "",
        });

        // 4. Fetch created appointment
        const appointment = await this.appointmentRepo.findById(appointmentId);
        if (!appointment) throw new Error("Failed to create appointment");

        // 5. Send notification
        await this.notificationService.sendAppointmentConfirmation(appointment);

        return appointment;
    }

    async getAppointment(id: string): Promise<Appointment> {
        const appointment = await this.appointmentRepo.findById(id);
        if (!appointment) {
            throw new NotFoundError("Appointment not found");
        }
        return appointment;
    }

    async getPatientAppointments(patientId: string): Promise<Appointment[]> {
        return this.appointmentRepo.findByPatientId(patientId);
    }

    async getDoctorAppointments(doctorId: string, date?: Timestamp): Promise<Appointment[]> {
        return this.appointmentRepo.findByDoctorId(doctorId, date);
    }

    async checkIn(id: string): Promise<Appointment> {
        const appointment = await this.getAppointment(id);

        if (appointment.status !== "Scheduled" && appointment.status !== "Confirmed") {
            throw new ValidationError("Appointment cannot be checked in");
        }

        await this.appointmentRepo.update(id, { status: "CheckedIn" });

        const updatedAppointment = await this.getAppointment(id);
        await this.notificationService.sendCheckInNotification(updatedAppointment);

        return updatedAppointment;
    }

    async cancelAppointment(id: string): Promise<Appointment> {
        const appointment = await this.getAppointment(id);

        if (appointment.status === "Completed" || appointment.status === "Cancelled") {
            throw new ValidationError("Appointment cannot be cancelled");
        }

        await this.appointmentRepo.update(id, { status: "Cancelled" });

        const updatedAppointment = await this.getAppointment(id);
        await this.notificationService.sendCancellationNotification(updatedAppointment);

        return updatedAppointment;
    }

    async rescheduleAppointment(id: string, newDate: Timestamp, newTimeSlot: string): Promise<Appointment> {
        const appointment = await this.getAppointment(id);

        if (appointment.status === "Completed" || appointment.status === "Cancelled") {
            throw new ValidationError("Appointment cannot be rescheduled");
        }

        // Check new slot availability
        const isAvailable = await this.appointmentRepo.checkSlotAvailability(appointment.doctorId, newDate, newTimeSlot);

        if (!isAvailable) {
            throw new ConflictError("Selected time slot is not available");
        }

        await this.appointmentRepo.update(id, {
            appointmentDate: newDate,
            timeSlot: newTimeSlot,
            status: "Scheduled",
        });

        const updatedAppointment = await this.getAppointment(id);
        await this.notificationService.sendRescheduleNotification(updatedAppointment);

        return updatedAppointment;
    }

    async completeAppointment(id: string): Promise<Appointment> {
        const appointment = await this.getAppointment(id);

        if (appointment.status !== "CheckedIn") {
            throw new ValidationError("Only checked-in appointments can be completed");
        }

        await this.appointmentRepo.update(id, { status: "Completed" });
        return this.getAppointment(id);
    }

    async getAvailableSlots(doctorId: string, date: Timestamp): Promise<string[]> {
        const allSlots = this.generateTimeSlots();
        const bookedAppointments = await this.appointmentRepo.findByDoctorId(doctorId, date);

        const bookedSlots = bookedAppointments
            .filter((apt) => apt.status === "Scheduled" || apt.status === "Confirmed" || apt.status === "CheckedIn")
            .map((apt) => apt.timeSlot);

        return allSlots.filter((slot) => !bookedSlots.includes(slot));
    }

    private generateTimeSlots(): string[] {
        const slots: string[] = [];
        const startHour = 9; // 9 AM
        const endHour = 17; // 5 PM

        for (let hour = startHour; hour < endHour; hour++) {
            slots.push(`${hour.toString().padStart(2, "0")}:00`);
            slots.push(`${hour.toString().padStart(2, "0")}:30`);
        }

        return slots;
    }

    private validateAppointmentData(data: BookAppointmentDTO): void {
        if (!data.patientId || !data.doctorId || !data.departmentId) {
            throw new ValidationError("Patient, Doctor, and Department are required");
        }
        if (!data.appointmentDate) {
            throw new ValidationError("Appointment date is required");
        }
        if (!data.timeSlot) {
            throw new ValidationError("Time slot is required");
        }
        if (!data.reason || data.reason.trim().length === 0) {
            throw new ValidationError("Reason for appointment is required");
        }

        // Check if appointment is in the past
        const now = Timestamp.now();
        if (data.appointmentDate.seconds < now.seconds) {
            throw new ValidationError("Cannot book appointments in the past");
        }
    }
}

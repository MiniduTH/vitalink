import { NextRequest, NextResponse } from "next/server";
import { AppointmentRepository } from "@/lib/firestore/repositories/AppointmentRepository";
import { AppointmentService } from "@/lib/services/AppointmentService";
import { NotificationService } from "@/lib/services/NotificationService";
import { Timestamp } from "firebase/firestore";

const appointmentRepo = new AppointmentRepository();
const notificationService = new NotificationService();
const appointmentService = new AppointmentService(appointmentRepo, notificationService);

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const patientId = searchParams.get("patientId");
        const doctorId = searchParams.get("doctorId");
        const status = searchParams.get("status");
        const limit = searchParams.get("limit");

        if (patientId) {
            const appointments = await appointmentService.getPatientAppointments(patientId);
            return NextResponse.json({ success: true, data: appointments });
        }

        if (doctorId) {
            const appointments = await appointmentService.getDoctorAppointments(doctorId);
            return NextResponse.json({ success: true, data: appointments });
        }

        const appointments = await appointmentRepo.findAll({
            status: status || undefined,
            limit: limit ? parseInt(limit) : undefined,
        });
        return NextResponse.json({ success: true, data: appointments });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Convert date string to Timestamp
        const appointmentData = {
            ...body,
            appointmentDate: Timestamp.fromDate(new Date(body.appointmentDate)),
        };

        const appointment = await appointmentService.bookAppointment(appointmentData);
        return NextResponse.json({ success: true, data: appointment }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.name === "ValidationError" ? 400 : error.name === "ConflictError" ? 409 : 500 }
        );
    }
}

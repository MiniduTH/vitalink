import { NextRequest, NextResponse } from "next/server";
import { AppointmentRepository } from "@/lib/firestore/repositories/AppointmentRepository";
import { AppointmentService } from "@/lib/services/AppointmentService";
import { NotificationService } from "@/lib/services/NotificationService";
import { Timestamp } from "firebase/firestore";

const appointmentRepo = new AppointmentRepository();
const notificationService = new NotificationService();
const appointmentService = new AppointmentService(appointmentRepo, notificationService);

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const appointment = await appointmentService.getAppointment(params.id);
        return NextResponse.json({ success: true, data: appointment });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.name === "NotFoundError" ? 404 : 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();

        // Handle reschedule
        if (body.appointmentDate && body.timeSlot) {
            const appointment = await appointmentService.rescheduleAppointment(
                params.id,
                Timestamp.fromDate(new Date(body.appointmentDate)),
                body.timeSlot
            );
            return NextResponse.json({ success: true, data: appointment });
        }

        // Handle cancel
        if (body.status === "Cancelled") {
            const appointment = await appointmentService.cancelAppointment(params.id);
            return NextResponse.json({ success: true, data: appointment });
        }

        // Handle complete
        if (body.status === "Completed") {
            const appointment = await appointmentService.completeAppointment(params.id);
            return NextResponse.json({ success: true, data: appointment });
        }

        // General update
        await appointmentRepo.update(params.id, body);
        const appointment = await appointmentService.getAppointment(params.id);
        return NextResponse.json({ success: true, data: appointment });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.name === "NotFoundError" ? 404 : error.name === "ValidationError" ? 400 : error.name === "ConflictError" ? 409 : 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const appointment = await appointmentService.cancelAppointment(params.id);
        return NextResponse.json({ success: true, data: appointment });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.name === "NotFoundError" ? 404 : 500 });
    }
}

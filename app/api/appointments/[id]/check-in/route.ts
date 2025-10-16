import { NextRequest, NextResponse } from "next/server";
import { AppointmentRepository } from "@/lib/firestore/repositories/AppointmentRepository";
import { AppointmentService } from "@/lib/services/AppointmentService";
import { NotificationService } from "@/lib/services/NotificationService";

const appointmentRepo = new AppointmentRepository();
const notificationService = new NotificationService();
const appointmentService = new AppointmentService(appointmentRepo, notificationService);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const appointment = await appointmentService.checkIn(id);
        return NextResponse.json({ success: true, data: appointment });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.name === "NotFoundError" ? 404 : error.name === "ValidationError" ? 400 : 500 }
        );
    }
}

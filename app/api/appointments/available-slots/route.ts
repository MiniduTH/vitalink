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
        const doctorId = searchParams.get("doctorId");
        const date = searchParams.get("date");

        if (!doctorId || !date) {
            return NextResponse.json({ success: false, error: "doctorId and date are required" }, { status: 400 });
        }

        const appointmentDate = Timestamp.fromDate(new Date(date));
        const availableSlots = await appointmentService.getAvailableSlots(doctorId, appointmentDate);

        return NextResponse.json({ success: true, data: availableSlots });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

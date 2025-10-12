import { NextRequest, NextResponse } from "next/server";
import { AppointmentRepository } from "@/lib/firestore/repositories/AppointmentRepository";
import { PaymentRepository } from "@/lib/firestore/repositories/PaymentRepository";
import { DepartmentRepository } from "@/lib/firestore/repositories/StaffRepository";
import { ReportingService } from "@/lib/services/ReportingService";

const appointmentRepo = new AppointmentRepository();
const paymentRepo = new PaymentRepository();
const departmentRepo = new DepartmentRepository();
const reportingService = new ReportingService(appointmentRepo, paymentRepo, departmentRepo);

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        if (!startDate || !endDate) {
            return NextResponse.json({ success: false, error: "startDate and endDate are required" }, { status: 400 });
        }

        const report = await reportingService.generatePatientFlowReport(new Date(startDate), new Date(endDate));

        return NextResponse.json({ success: true, data: report });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

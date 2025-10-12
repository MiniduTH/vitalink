import { NextRequest, NextResponse } from "next/server";
import { AppointmentRepository } from "@/lib/firestore/repositories/AppointmentRepository";
import { PaymentRepository } from "@/lib/firestore/repositories/PaymentRepository";
import { DepartmentRepository } from "@/lib/firestore/repositories/StaffRepository";
import { ReportingService } from "@/lib/services/ReportingService";

const appointmentRepo = new AppointmentRepository();
const paymentRepo = new PaymentRepository();
const departmentRepo = new DepartmentRepository();
const reportingService = new ReportingService(appointmentRepo, paymentRepo, departmentRepo);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { reportData, format } = body;

        if (!reportData || !format) {
            return NextResponse.json({ success: false, error: "reportData and format are required" }, { status: 400 });
        }

        if (format !== "PDF" && format !== "CSV") {
            return NextResponse.json({ success: false, error: "format must be PDF or CSV" }, { status: 400 });
        }

        const exportPath = await reportingService.exportReport(reportData, format);

        return NextResponse.json({
            success: true,
            data: {
                path: exportPath,
                format,
                downloadUrl: exportPath,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import { HealthRecordRepository } from "@/lib/firestore/repositories/HealthRecordRepository";
import { HealthRecordService } from "@/lib/services/HealthRecordService";

const healthRecordRepo = new HealthRecordRepository();
const healthRecordService = new HealthRecordService(healthRecordRepo);

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const healthRecord = await healthRecordService.getHealthRecordByPatientId(params.id);
        return NextResponse.json({ success: true, data: healthRecord });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.name === "NotFoundError" ? 404 : 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        const healthRecord = await healthRecordService.getHealthRecordByPatientId(params.id);
        const updated = await healthRecordService.updateHealthRecord(healthRecord.id, body);
        return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.name === "NotFoundError" ? 404 : error.name === "ValidationError" ? 400 : 500 }
        );
    }
}

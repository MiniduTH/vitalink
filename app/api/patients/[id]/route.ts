import { NextRequest, NextResponse } from "next/server";
import { PatientRepository } from "@/lib/firestore/repositories/PatientRepository";
import { HealthRecordRepository } from "@/lib/firestore/repositories/HealthRecordRepository";
import { PatientService } from "@/lib/services/PatientService";
import { Timestamp } from "firebase/firestore";

const patientRepo = new PatientRepository();
const healthRecordRepo = new HealthRecordRepository();
const patientService = new PatientService(patientRepo, healthRecordRepo);

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const patient = await patientService.getPatient(params.id);
        return NextResponse.json({ success: true, data: patient });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.name === "NotFoundError" ? 404 : 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();

        // Convert date string to Timestamp if provided
        if (body.dateOfBirth) {
            body.dateOfBirth = Timestamp.fromDate(new Date(body.dateOfBirth));
        }

        const patient = await patientService.updatePatient(params.id, body);
        return NextResponse.json({ success: true, data: patient });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.name === "NotFoundError" ? 404 : error.name === "ValidationError" ? 400 : 500 }
        );
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        await patientRepo.delete(params.id);
        return NextResponse.json({ success: true, message: "Patient deleted" });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

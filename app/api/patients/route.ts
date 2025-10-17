import { NextRequest, NextResponse } from "next/server";
import { PatientRepository } from "@/lib/firestore/repositories/PatientRepository";
import { HealthRecordRepository } from "@/lib/firestore/repositories/HealthRecordRepository";
import { PatientService } from "@/lib/services/PatientService";
import { Timestamp } from "firebase/firestore";

const patientRepo = new PatientRepository();
const healthRecordRepo = new HealthRecordRepository();
const patientService = new PatientService(patientRepo, healthRecordRepo);

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const limit = searchParams.get("limit");
        const search = searchParams.get("search");

        if (search) {
            const patients = await patientService.searchPatients(search);
            return NextResponse.json({ success: true, patients, data: patients });
        }

        const patients = await patientService.getAllPatients(limit ? parseInt(limit) : undefined);
        return NextResponse.json({ success: true, patients, data: patients });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.name === "ValidationError" ? 400 : 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Convert date string to Timestamp
        const patientData = {
            ...body,
            dateOfBirth: Timestamp.fromDate(new Date(body.dateOfBirth)),
        };

        const patient = await patientService.registerPatient(patientData);
        return NextResponse.json({ success: true, data: patient }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.name === "ValidationError" ? 400 : 500 });
    }
}

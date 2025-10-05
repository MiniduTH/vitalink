import { HealthRecordRepository } from "@/lib/firestore/repositories/HealthRecordRepository";
import { HealthRecord, Encounter, CreateHealthRecordDTO, NotFoundError, ValidationError } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

export class HealthRecordService {
    constructor(private healthRecordRepo: HealthRecordRepository) {}

    async getHealthRecord(id: string): Promise<HealthRecord> {
        const record = await this.healthRecordRepo.findById(id);
        if (!record) {
            throw new NotFoundError("Health record not found");
        }
        return record;
    }

    async getHealthRecordByPatientId(patientId: string): Promise<HealthRecord> {
        const record = await this.healthRecordRepo.findByPatientId(patientId);
        if (!record) {
            throw new NotFoundError("Health record not found for patient");
        }
        return record;
    }

    async updateHealthRecord(id: string, data: Partial<CreateHealthRecordDTO>): Promise<HealthRecord> {
        // Verify record exists
        await this.getHealthRecord(id);

        // Validate data
        this.validateHealthRecordData(data);

        await this.healthRecordRepo.update(id, data);
        return this.getHealthRecord(id);
    }

    async addEncounter(patientId: string, encounter: Omit<Encounter, "encounterId">): Promise<HealthRecord> {
        const record = await this.getHealthRecordByPatientId(patientId);

        const newEncounter: Encounter = {
            ...encounter,
            encounterId: `ENC${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        };

        await this.healthRecordRepo.addEncounter(record.id, newEncounter);
        return this.getHealthRecord(record.id);
    }

    async updateMedicalNotes(patientId: string, encounterId: string, notes: string, doctorId: string): Promise<HealthRecord> {
        const record = await this.getHealthRecordByPatientId(patientId);

        // Verify encounter exists and doctor has permission
        const encounter = record.encounters.find((enc) => enc.encounterId === encounterId);
        if (!encounter) {
            throw new NotFoundError("Encounter not found");
        }

        await this.healthRecordRepo.updateMedicalNotes(record.id, encounterId, notes);
        return this.getHealthRecord(record.id);
    }

    async updateLabResults(patientId: string, encounterId: string, labResults: string[]): Promise<HealthRecord> {
        const record = await this.getHealthRecordByPatientId(patientId);

        const encounter = record.encounters.find((enc) => enc.encounterId === encounterId);
        if (!encounter) {
            throw new NotFoundError("Encounter not found");
        }

        // Update the encounter with new lab results
        const updatedEncounters = record.encounters.map((enc) => (enc.encounterId === encounterId ? { ...enc, labResults } : enc));

        await this.healthRecordRepo.update(record.id, { encounters: updatedEncounters } as any);
        return this.getHealthRecord(record.id);
    }

    private validateHealthRecordData(data: Partial<CreateHealthRecordDTO>): void {
        if (data.bloodType && !this.isValidBloodType(data.bloodType)) {
            throw new ValidationError("Invalid blood type");
        }
    }

    private isValidBloodType(bloodType: string): boolean {
        const validTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
        return validTypes.includes(bloodType);
    }
}

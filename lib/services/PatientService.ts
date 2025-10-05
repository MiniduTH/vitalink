import { PatientRepository } from "@/lib/firestore/repositories/PatientRepository";
import { HealthRecordRepository } from "@/lib/firestore/repositories/HealthRecordRepository";
import { CreatePatientDTO, Patient, ValidationError, NotFoundError } from "@/lib/types";

export class PatientService {
    constructor(private patientRepo: PatientRepository, private healthRecordRepo: HealthRecordRepository) {}

    async registerPatient(data: CreatePatientDTO): Promise<Patient> {
        // 1. Validate input
        this.validatePatientData(data);

        // 2. Check for duplicate email
        const existingPatient = await this.patientRepo.findByEmail(data.email);
        if (existingPatient) {
            throw new ValidationError("Patient with this email already exists");
        }

        // 3. Create patient
        const patientId = await this.patientRepo.create(data);

        // 4. Create initial health record
        await this.healthRecordRepo.create({
            patientId,
            bloodType: "",
            allergies: [],
            chronicConditions: [],
            encounters: [],
        });

        // 5. Fetch and return created patient
        const patient = await this.patientRepo.findById(patientId);
        if (!patient) throw new Error("Failed to create patient");

        return patient;
    }

    async getPatient(id: string): Promise<Patient> {
        const patient = await this.patientRepo.findById(id);
        if (!patient) {
            throw new NotFoundError("Patient not found");
        }
        return patient;
    }

    async updatePatient(id: string, data: Partial<CreatePatientDTO>): Promise<Patient> {
        // Verify patient exists
        await this.getPatient(id);

        // Validate update data
        if (data.email) {
            const existing = await this.patientRepo.findByEmail(data.email);
            if (existing && existing.id !== id) {
                throw new ValidationError("Email already in use by another patient");
            }
        }

        await this.patientRepo.update(id, data);
        return this.getPatient(id);
    }

    async getAllPatients(limit?: number): Promise<Patient[]> {
        return this.patientRepo.findAll({ limit });
    }

    async searchPatients(searchTerm: string): Promise<Patient[]> {
        if (!searchTerm || searchTerm.trim().length < 2) {
            throw new ValidationError("Search term must be at least 2 characters");
        }
        return this.patientRepo.search(searchTerm);
    }

    private validatePatientData(data: CreatePatientDTO): void {
        if (!data.firstName || data.firstName.trim().length === 0) {
            throw new ValidationError("First name is required");
        }
        if (!data.lastName || data.lastName.trim().length === 0) {
            throw new ValidationError("Last name is required");
        }
        if (!data.email || !this.isValidEmail(data.email)) {
            throw new ValidationError("Valid email is required");
        }
        if (!data.contactNumber || !this.isValidPhone(data.contactNumber)) {
            throw new ValidationError("Valid contact number is required");
        }
        if (!data.dateOfBirth) {
            throw new ValidationError("Date of birth is required");
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private isValidPhone(phone: string): boolean {
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(phone.replace(/[-\s]/g, ""));
    }
}

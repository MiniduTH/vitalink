/**
 * @jest-environment node
 */
import { HealthRecordService } from "@/lib/services/HealthRecordService";
import { HealthRecordRepository } from "@/lib/firestore/repositories/HealthRecordRepository";
import { HealthRecord, Encounter, CreateHealthRecordDTO, ValidationError, NotFoundError } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

// Mock repository
jest.mock("@/lib/firestore/repositories/HealthRecordRepository");

describe("HealthRecordService", () => {
    let healthRecordService: HealthRecordService;
    let mockHealthRecordRepo: jest.Mocked<HealthRecordRepository>;

    const mockEncounter: Encounter = {
        encounterId: "ENC123",
        date: Timestamp.now(),
        diagnosis: "Annual checkup - all normal",
        labResults: ["Blood test: Normal", "X-ray: Clear"],
        medicalNotes: "Patient in good health",
        doctorId: "doctor456",
    };

    const mockHealthRecord: HealthRecord = {
        id: "record123",
        patientId: "patient123",
        bloodType: "A+",
        allergies: ["Penicillin"],
        chronicConditions: ["Hypertension"],
        encounters: [mockEncounter],
        digitalHealthCardId: "card123",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        medications: []
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockHealthRecordRepo = new HealthRecordRepository() as jest.Mocked<HealthRecordRepository>;
        healthRecordService = new HealthRecordService(mockHealthRecordRepo);
    });

    describe("getHealthRecord", () => {
        it("should return health record when found", async () => {
            mockHealthRecordRepo.findById.mockResolvedValue(mockHealthRecord);

            const result = await healthRecordService.getHealthRecord("record123");

            expect(result).toEqual(mockHealthRecord);
            expect(mockHealthRecordRepo.findById).toHaveBeenCalledWith("record123");
        });

        it("should throw NotFoundError when record does not exist", async () => {
            mockHealthRecordRepo.findById.mockResolvedValue(null);

            await expect(healthRecordService.getHealthRecord("nonexistent")).rejects.toThrow(NotFoundError);
        });
    });

    describe("getHealthRecordByPatientId", () => {
        it("should return health record for patient", async () => {
            mockHealthRecordRepo.findByPatientId.mockResolvedValue(mockHealthRecord);

            const result = await healthRecordService.getHealthRecordByPatientId("patient123");

            expect(result).toEqual(mockHealthRecord);
        });

        it("should throw NotFoundError when patient has no record", async () => {
            mockHealthRecordRepo.findByPatientId.mockResolvedValue(null);

            await expect(healthRecordService.getHealthRecordByPatientId("patient999")).rejects.toThrow(NotFoundError);
        });
    });

    describe("updateHealthRecord", () => {
        it("should successfully update health record", async () => {
            const updateData: Partial<CreateHealthRecordDTO> = {
                bloodType: "O+",
                allergies: ["Penicillin", "Aspirin"],
            };
            const updatedRecord = { ...mockHealthRecord, ...updateData };

            mockHealthRecordRepo.findById.mockResolvedValueOnce(mockHealthRecord);
            mockHealthRecordRepo.update.mockResolvedValue(undefined);
            mockHealthRecordRepo.findById.mockResolvedValueOnce(updatedRecord);

            const result = await healthRecordService.updateHealthRecord("record123", updateData);

            expect(result.bloodType).toBe("O+");
            expect(result.allergies).toContain("Aspirin");
        });

        it("should throw ValidationError for invalid blood type", async () => {
            const invalidData = { bloodType: "Z+" };
            mockHealthRecordRepo.findById.mockResolvedValue(mockHealthRecord);

            await expect(healthRecordService.updateHealthRecord("record123", invalidData)).rejects.toThrow(ValidationError);
        });

        it("should throw NotFoundError when record does not exist", async () => {
            mockHealthRecordRepo.findById.mockResolvedValue(null);

            await expect(healthRecordService.updateHealthRecord("nonexistent", { bloodType: "A+" })).rejects.toThrow(NotFoundError);
        });
    });

    describe("addEncounter", () => {
        it("should successfully add encounter to health record", async () => {
            const newEncounterData: Omit<Encounter, "encounterId"> = {
                date: Timestamp.now(),
                diagnosis: "Common cold",
                labResults: [],
                medicalNotes: "Rest and fluids recommended",
                doctorId: "doctor789",
            };

            const updatedRecord = {
                ...mockHealthRecord,
                encounters: [...mockHealthRecord.encounters, { ...newEncounterData, encounterId: "ENC456" }],
            };

            mockHealthRecordRepo.findByPatientId.mockResolvedValue(mockHealthRecord);
            mockHealthRecordRepo.addEncounter.mockResolvedValue(undefined);
            mockHealthRecordRepo.findById.mockResolvedValue(updatedRecord);

            const result = await healthRecordService.addEncounter("patient123", newEncounterData);

            expect(result.encounters.length).toBeGreaterThan(mockHealthRecord.encounters.length);
            expect(mockHealthRecordRepo.addEncounter).toHaveBeenCalled();
        });

        it("should generate unique encounter ID", async () => {
            const encounterData: Omit<Encounter, "encounterId"> = {
                date: Timestamp.now(),
                diagnosis: "Flu",
                labResults: [],
                medicalNotes: "Prescribed medication",
                doctorId: "doctor123",
            };

            mockHealthRecordRepo.findByPatientId.mockResolvedValue(mockHealthRecord);
            mockHealthRecordRepo.addEncounter.mockResolvedValue(undefined);
            mockHealthRecordRepo.findById.mockResolvedValue(mockHealthRecord);

            await healthRecordService.addEncounter("patient123", encounterData);

            const addEncounterCall = mockHealthRecordRepo.addEncounter.mock.calls[0];
            const encounterId = addEncounterCall[1].encounterId;
            expect(encounterId).toMatch(/^ENC/);
        });
    });

    describe("updateMedicalNotes", () => {
        it("should successfully update medical notes for encounter", async () => {
            const updatedNotes = "Updated medical notes - follow-up required";
            mockHealthRecordRepo.findByPatientId.mockResolvedValue(mockHealthRecord);
            mockHealthRecordRepo.updateMedicalNotes.mockResolvedValue(undefined);
            mockHealthRecordRepo.findById.mockResolvedValue(mockHealthRecord);

            const result = await healthRecordService.updateMedicalNotes("patient123", "ENC123", updatedNotes, "doctor456");

            expect(mockHealthRecordRepo.updateMedicalNotes).toHaveBeenCalledWith("record123", "ENC123", updatedNotes);
        });

        it("should throw NotFoundError when encounter does not exist", async () => {
            mockHealthRecordRepo.findByPatientId.mockResolvedValue(mockHealthRecord);

            await expect(healthRecordService.updateMedicalNotes("patient123", "NONEXISTENT", "notes", "doctor456")).rejects.toThrow(NotFoundError);
        });
    });

    describe("updateLabResults", () => {
        it("should successfully update lab results for encounter", async () => {
            const newLabResults = ["Blood test: Abnormal", "Requires follow-up"];
            mockHealthRecordRepo.findByPatientId.mockResolvedValue(mockHealthRecord);
            mockHealthRecordRepo.update.mockResolvedValue(undefined);
            mockHealthRecordRepo.findById.mockResolvedValue(mockHealthRecord);

            const result = await healthRecordService.updateLabResults("patient123", "ENC123", newLabResults);

            expect(mockHealthRecordRepo.update).toHaveBeenCalled();
        });

        it("should throw NotFoundError when encounter does not exist", async () => {
            mockHealthRecordRepo.findByPatientId.mockResolvedValue(mockHealthRecord);

            await expect(healthRecordService.updateLabResults("patient123", "INVALID", [])).rejects.toThrow(NotFoundError);
        });
    });

    describe("Edge Cases", () => {
        it("should accept all valid blood types", async () => {
            const validBloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

            for (const bloodType of validBloodTypes) {
                mockHealthRecordRepo.findById.mockResolvedValue(mockHealthRecord);
                mockHealthRecordRepo.update.mockResolvedValue(undefined);
                mockHealthRecordRepo.findById.mockResolvedValue({ ...mockHealthRecord, bloodType });

                await expect(healthRecordService.updateHealthRecord("record123", { bloodType })).resolves.toBeDefined();
            }
        });

        it("should handle empty encounters array", async () => {
            const recordWithNoEncounters = { ...mockHealthRecord, encounters: [] };
            mockHealthRecordRepo.findByPatientId.mockResolvedValue(recordWithNoEncounters);
            mockHealthRecordRepo.addEncounter.mockResolvedValue(undefined);
            mockHealthRecordRepo.findById.mockResolvedValue(mockHealthRecord);

            const encounterData: Omit<Encounter, "encounterId"> = {
                date: Timestamp.now(),
                diagnosis: "First visit",
                labResults: [],
                medicalNotes: "Initial consultation",
                doctorId: "doctor123",
            };

            await expect(healthRecordService.addEncounter("patient123", encounterData)).resolves.toBeDefined();
        });
    });
});

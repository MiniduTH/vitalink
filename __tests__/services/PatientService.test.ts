/**
 * @jest-environment jsdom
 */
import { PatientService } from "@/lib/services/PatientService";
import { PatientRepository } from "@/lib/firestore/repositories/PatientRepository";
import { HealthRecordRepository } from "@/lib/firestore/repositories/HealthRecordRepository";
import { ValidationError } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

// Mock repositories
jest.mock("@/lib/firestore/repositories/PatientRepository");
jest.mock("@/lib/firestore/repositories/HealthRecordRepository");

describe("PatientService", () => {
    let patientService: PatientService;
    let mockPatientRepo: jest.Mocked<PatientRepository>;
    let mockHealthRecordRepo: jest.Mocked<HealthRecordRepository>;

    // Define validPatientData at the top level so it's accessible in all describe blocks
    const validPatientData = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        contactNumber: "0771234567",
        dateOfBirth: Timestamp.now(),
        gender: "Male",
        address: "123 Main St, Colombo",
        emergencyContact: {
            name: "Jane Doe",
            relationship: "Spouse",
            phone: "0779876543",
        },
    };

    beforeEach(() => {
        mockPatientRepo = new PatientRepository() as jest.Mocked<PatientRepository>;
        mockHealthRecordRepo = new HealthRecordRepository() as jest.Mocked<HealthRecordRepository>;
        patientService = new PatientService(mockPatientRepo, mockHealthRecordRepo);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("registerPatient", () => {
        it("should successfully register a new patient with valid data", async () => {
            // Arrange
            const mockPatientId = "patient123";
            const mockPatient = {
                id: mockPatientId,
                ...validPatientData,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            mockPatientRepo.findByEmail.mockResolvedValue(null);
            mockPatientRepo.create.mockResolvedValue(mockPatientId);
            mockHealthRecordRepo.create.mockResolvedValue("healthRecord123");
            mockPatientRepo.findById.mockResolvedValue(mockPatient);

            // Act
            const result = await patientService.registerPatient(validPatientData);

            // Assert
            expect(result).toEqual(mockPatient);
            expect(mockPatientRepo.findByEmail).toHaveBeenCalledWith(validPatientData.email);
            expect(mockPatientRepo.create).toHaveBeenCalledWith(validPatientData);
            expect(mockHealthRecordRepo.create).toHaveBeenCalledWith({
                patientId: mockPatientId,
                bloodType: "",
                allergies: [],
                chronicConditions: [],
                encounters: [],
            });
        });

        it("should throw ValidationError when email already exists", async () => {
            // Arrange
            const existingPatient = {
                id: "existing123",
                ...validPatientData,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };
            mockPatientRepo.findByEmail.mockResolvedValue(existingPatient);

            // Act & Assert
            await expect(patientService.registerPatient(validPatientData)).rejects.toThrow(ValidationError);
            await expect(patientService.registerPatient(validPatientData)).rejects.toThrow("Patient with this email already exists");

            expect(mockPatientRepo.create).not.toHaveBeenCalled();
        });

        it("should throw ValidationError when first name is missing", async () => {
            // Arrange
            const invalidData = { ...validPatientData, firstName: "" };

            // Act & Assert
            await expect(patientService.registerPatient(invalidData)).rejects.toThrow(ValidationError);
            await expect(patientService.registerPatient(invalidData)).rejects.toThrow("First name is required");
        });

        it("should throw ValidationError when email is invalid", async () => {
            // Arrange
            const invalidData = { ...validPatientData, email: "invalid-email" };

            // Act & Assert
            await expect(patientService.registerPatient(invalidData)).rejects.toThrow(ValidationError);
            await expect(patientService.registerPatient(invalidData)).rejects.toThrow("Valid email is required");
        });

        it("should throw ValidationError when contact number is invalid", async () => {
            // Arrange
            const invalidData = { ...validPatientData, contactNumber: "123" };

            // Act & Assert
            await expect(patientService.registerPatient(invalidData)).rejects.toThrow(ValidationError);
            await expect(patientService.registerPatient(invalidData)).rejects.toThrow("Valid contact number is required");
        });
    });

    describe("searchPatients", () => {
        it("should successfully search patients with valid search term", async () => {
            // Arrange
            const mockPatients = [
                { id: "1", firstName: "John", lastName: "Doe", email: "john@test.com" },
                { id: "2", firstName: "Jane", lastName: "Smith", email: "jane@test.com" },
            ];
            mockPatientRepo.search.mockResolvedValue(mockPatients as any);

            // Act
            const result = await patientService.searchPatients("John");

            // Assert
            expect(result).toEqual(mockPatients);
            expect(mockPatientRepo.search).toHaveBeenCalledWith("John");
        });

        it("should throw ValidationError when search term is too short", async () => {
            // Act & Assert
            await expect(patientService.searchPatients("J")).rejects.toThrow(ValidationError);
            await expect(patientService.searchPatients("J")).rejects.toThrow("Search term must be at least 2 characters");
        });

        it("should throw ValidationError when search term is empty", async () => {
            // Act & Assert
            await expect(patientService.searchPatients("")).rejects.toThrow(ValidationError);
        });
    });

    describe("updatePatient", () => {
        it("should successfully update patient with valid data", async () => {
            // Arrange
            const mockPatient = {
                id: "patient123",
                firstName: "John",
                email: "john@test.com",
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };
            const updateData = { firstName: "Johnny" };
            const updatedPatient = { ...mockPatient, ...updateData };

            mockPatientRepo.findById.mockResolvedValueOnce(mockPatient as any);
            mockPatientRepo.update.mockResolvedValue(undefined);
            mockPatientRepo.findById.mockResolvedValueOnce(updatedPatient as any);

            // Act
            const result = await patientService.updatePatient("patient123", updateData);

            // Assert
            expect(result).toEqual(updatedPatient);
            expect(mockPatientRepo.update).toHaveBeenCalledWith("patient123", updateData);
        });

        it("should throw NotFoundError when patient does not exist", async () => {
            // Arrange
            mockPatientRepo.findById.mockResolvedValue(null);

            // Act & Assert
            await expect(patientService.updatePatient("invalid123", { firstName: "Test" })).rejects.toThrow("Patient not found");
        });

        it("should throw ValidationError when updating to existing email", async () => {
            // Arrange
            const mockPatient = {
                id: "patient123",
                email: "john@test.com",
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };
            const existingPatient = {
                id: "patient456",
                email: "existing@test.com",
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            };

            mockPatientRepo.findById.mockResolvedValue(mockPatient as any);
            mockPatientRepo.findByEmail.mockResolvedValue(existingPatient as any);

            // Act & Assert
            await expect(patientService.updatePatient("patient123", { email: "existing@test.com" })).rejects.toThrow(ValidationError);
            await expect(patientService.updatePatient("patient123", { email: "existing@test.com" })).rejects.toThrow(
                "Email already in use by another patient"
            );
        });
    });

    describe("Edge Cases", () => {
        it("should handle concurrent patient registration attempts", async () => {
            // Test race condition handling
            const patientData1 = { ...validPatientData, email: "test1@example.com" };
            const patientData2 = { ...validPatientData, email: "test2@example.com" };

            mockPatientRepo.findByEmail.mockResolvedValue(null);
            mockPatientRepo.create.mockResolvedValue("patient123");
            mockHealthRecordRepo.create.mockResolvedValue("health123");
            mockPatientRepo.findById.mockResolvedValue({
                id: "patient123",
                ...patientData1,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            } as any);

            // Act - register two patients concurrently
            const results = await Promise.all([patientService.registerPatient(patientData1), patientService.registerPatient(patientData2)]);

            // Assert
            expect(results).toHaveLength(2);
            expect(mockPatientRepo.create).toHaveBeenCalledTimes(2);
        });

        it("should handle database errors gracefully", async () => {
            // Arrange
            mockPatientRepo.findByEmail.mockRejectedValue(new Error("Database connection failed"));

            // Act & Assert
            await expect(patientService.registerPatient(validPatientData)).rejects.toThrow("Database connection failed");
        });
    });
});

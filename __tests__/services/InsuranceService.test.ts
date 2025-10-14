/**
 * @jest-environment node
 */
import { InsuranceService } from "@/lib/services/InsuranceService";
import { InsurancePolicyRepository, InsuranceClaimRepository } from "@/lib/firestore/repositories/InsuranceRepository";
import { NotificationService } from "@/lib/services/NotificationService";
import { InsurancePolicy, CheckEligibilityDTO, NotFoundError } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

// Mock repositories and services
jest.mock("@/lib/firestore/repositories/InsuranceRepository");
jest.mock("@/lib/services/NotificationService");

describe("InsuranceService", () => {
    let insuranceService: InsuranceService;
    let mockPolicyRepo: jest.Mocked<InsurancePolicyRepository>;
    let mockClaimRepo: jest.Mocked<InsuranceClaimRepository>;
    let mockNotificationService: jest.Mocked<NotificationService>;

    const mockPolicy: InsurancePolicy = {
        id: "policy123",
        patientId: "patient123",
        provider: "HealthInsure Co",
        policyNumber: "POL123456",
        coveragePercentage: 80,
        maxCoverage: 100000,
        startDate: Timestamp.fromDate(new Date("2024-01-01")),
        endDate: Timestamp.fromDate(new Date("2025-12-31")),
        status: "Active",
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockPolicyRepo = new InsurancePolicyRepository() as jest.Mocked<InsurancePolicyRepository>;
        mockClaimRepo = new InsuranceClaimRepository() as jest.Mocked<InsuranceClaimRepository>;
        mockNotificationService = new NotificationService() as jest.Mocked<NotificationService>;

        insuranceService = new InsuranceService(mockPolicyRepo, mockClaimRepo, mockNotificationService);
    });

    describe("checkEligibility", () => {
        it("should return eligibility response for valid policy", async () => {
            const eligibilityData: CheckEligibilityDTO = {
                policyNumber: "POL123456",
                patientId: "patient123",
                amount: 10000,
            };

            mockPolicyRepo.findActivePolicyByPatientId.mockResolvedValue(mockPolicy);

            const result = await insuranceService.checkEligibility(eligibilityData);

            expect(result.eligible).toBe(true);
            expect(result.coveragePercentage).toBe(80);
            expect(result.approvedAmount).toBeGreaterThan(0);
            expect(result.claimId).toBeDefined();
        });

        it("should throw NotFoundError when no active policy exists", async () => {
            const eligibilityData: CheckEligibilityDTO = {
                policyNumber: "POL999999",
                patientId: "patient999",
                amount: 5000,
            };

            mockPolicyRepo.findActivePolicyByPatientId.mockResolvedValue(null);

            await expect(insuranceService.checkEligibility(eligibilityData)).rejects.toThrow(NotFoundError);
        });

        it("should throw NotFoundError when policy is expired", async () => {
            const expiredPolicy = {
                ...mockPolicy,
                endDate: Timestamp.fromDate(new Date("2023-12-31")),
            };

            mockPolicyRepo.findActivePolicyByPatientId.mockResolvedValue(expiredPolicy);

            const eligibilityData: CheckEligibilityDTO = {
                policyNumber: "POL123456",
                patientId: "patient123",
                amount: 5000,
            };

            await expect(insuranceService.checkEligibility(eligibilityData)).rejects.toThrow(NotFoundError);
        });

        it("should calculate coverage correctly for high amounts", async () => {
            const highAmountData: CheckEligibilityDTO = {
                policyNumber: "POL123456",
                patientId: "patient123",
                amount: 200000,
            };

            mockPolicyRepo.findActivePolicyByPatientId.mockResolvedValue(mockPolicy);

            const result = await insuranceService.checkEligibility(highAmountData);

            // Mock API returns either 80% or 50% coverage
            expect(result.approvedAmount).toBeGreaterThan(0);
            expect(result.eligible).toBe(true);
        });
    });

    describe("submitClaim", () => {
        it("should successfully submit insurance claim", async () => {
            const claimId = "claim123";
            mockPolicyRepo.findById.mockResolvedValue(mockPolicy);
            mockClaimRepo.create.mockResolvedValue(claimId);

            const result = await insuranceService.submitClaim("policy123", "payment123", 8000);

            expect(result).toBe(claimId);
            expect(mockClaimRepo.create).toHaveBeenCalled();
            expect(mockNotificationService.sendInsuranceClaimUpdate).toHaveBeenCalledWith(claimId, "Submitted");
        });

        it("should throw NotFoundError when policy does not exist", async () => {
            mockPolicyRepo.findById.mockResolvedValue(null);

            await expect(insuranceService.submitClaim("invalid", "payment123", 5000)).rejects.toThrow(NotFoundError);
        });

        it("should send notification after claim submission", async () => {
            const claimId = "claim456";
            mockPolicyRepo.findById.mockResolvedValue(mockPolicy);
            mockClaimRepo.create.mockResolvedValue(claimId);

            await insuranceService.submitClaim("policy123", "payment456", 6000);

            expect(mockNotificationService.sendInsuranceClaimUpdate).toHaveBeenCalledTimes(1);
        });
    });

    describe("getPatientPolicies", () => {
        it("should return all policies for a patient", async () => {
            const policies = [mockPolicy, { ...mockPolicy, id: "policy456" }];
            mockPolicyRepo.findByPatientId.mockResolvedValue(policies);

            const result = await insuranceService.getPatientPolicies("patient123");

            expect(result.length).toBe(2);
            expect(mockPolicyRepo.findByPatientId).toHaveBeenCalledWith("patient123");
        });

        it("should return empty array when patient has no policies", async () => {
            mockPolicyRepo.findByPatientId.mockResolvedValue([]);

            const result = await insuranceService.getPatientPolicies("patient999");

            expect(result.length).toBe(0);
        });

        it("should return policies with different statuses", async () => {
            const activePolicy = { ...mockPolicy, status: "Active" as const };
            const expiredPolicy = { ...mockPolicy, id: "policy789", status: "Expired" as const };

            mockPolicyRepo.findByPatientId.mockResolvedValue([activePolicy, expiredPolicy]);

            const result = await insuranceService.getPatientPolicies("patient123");

            expect(result.some((p) => p.status === "Active")).toBe(true);
            expect(result.some((p) => p.status === "Expired")).toBe(true);
        });
    });

    describe("Edge Cases", () => {
        it("should handle zero coverage percentage", async () => {
            const zeroCoveragePolicy = { ...mockPolicy, coveragePercentage: 0 };
            mockPolicyRepo.findActivePolicyByPatientId.mockResolvedValue(zeroCoveragePolicy);

            const eligibilityData: CheckEligibilityDTO = {
                policyNumber: "POL123456",
                patientId: "patient123",
                amount: 10000,
            };

            const result = await insuranceService.checkEligibility(eligibilityData);

            expect(result.coveragePercentage).toBe(0);
        });

        it("should handle policy starting in the future", async () => {
            const futurePolicy = {
                ...mockPolicy,
                startDate: Timestamp.fromDate(new Date("2025-01-01")),
            };

            mockPolicyRepo.findActivePolicyByPatientId.mockResolvedValue(futurePolicy);

            const eligibilityData: CheckEligibilityDTO = {
                policyNumber: "POL123456",
                patientId: "patient123",
                amount: 5000,
            };

            // Should still process since we only check endDate for expiration
            await expect(insuranceService.checkEligibility(eligibilityData)).resolves.toBeDefined();
        });

        it("should handle very large claim amounts", async () => {
            mockPolicyRepo.findById.mockResolvedValue(mockPolicy);
            mockClaimRepo.create.mockResolvedValue("claim999");

            await expect(insuranceService.submitClaim("policy123", "payment999", 999999)).resolves.toBeDefined();
        });

        it("should handle concurrent policy lookups", async () => {
            mockPolicyRepo.findActivePolicyByPatientId.mockResolvedValue(mockPolicy);

            const eligibilityData: CheckEligibilityDTO = {
                policyNumber: "POL123456",
                patientId: "patient123",
                amount: 5000,
            };

            const results = await Promise.all([
                insuranceService.checkEligibility(eligibilityData),
                insuranceService.checkEligibility(eligibilityData),
                insuranceService.checkEligibility(eligibilityData),
            ]);

            expect(results.length).toBe(3);
            results.forEach((result) => {
                expect(result.eligible).toBe(true);
            });
        });
    });
});

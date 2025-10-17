import {
    InsurancePolicyRepository,
    InsuranceClaimRepository,
} from "@/lib/firestore/repositories/InsuranceRepository";
import { Timestamp } from "firebase/firestore";
import { InsurancePolicy, InsuranceClaim } from "@/lib/types";

// Mock Firebase
jest.mock("@/lib/firebase/config", () => ({
    db: {},
}));

jest.mock("firebase/firestore", () => ({
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    addDoc: jest.fn(),
    updateDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    Timestamp: {
        now: jest.fn(() => ({ toMillis: () => Date.now() })),
    },
}));

const mockFirestore = require("firebase/firestore");

describe("InsurancePolicyRepository", () => {
    let repository: InsurancePolicyRepository;
    let mockDocSnap: any;
    let mockQuerySnapshot: any;

    beforeEach(() => {
        repository = new InsurancePolicyRepository();
        jest.clearAllMocks();

        mockDocSnap = {
            exists: jest.fn(),
            id: "test-id",
            data: jest.fn(),
        };

        mockQuerySnapshot = {
            docs: [],
            empty: true,
        };
    });

    describe("create", () => {
        it("should create insurance policy", async () => {
            const policyData = {
                patientId: "patient-1",
                policyNumber: "POL123456",
                provider: "HealthCorp",
                coveragePercentage: 80,
                maxCoverage: 100000,
                startDate: Timestamp.now(),
                endDate: Timestamp.now(),
                status: "Active" as const,
            };

            mockFirestore.addDoc.mockResolvedValue({ id: "new-policy-id" });

            const result = await repository.create(policyData);

            expect(result).toBe("new-policy-id");
            expect(mockFirestore.addDoc).toHaveBeenCalled();
        });
    });

    describe("update", () => {
        it("should update insurance policy", async () => {
            const updateData = {
                coveragePercentage: 90,
                status: "Active" as const,
            };

            await repository.update("policy-1", updateData);

            expect(mockFirestore.updateDoc).toHaveBeenCalled();
        });
    });

    describe("findById", () => {
        it("should return policy when document exists", async () => {
            const mockPolicy = {
                patientId: "patient-1",
                policyNumber: "POL123456",
                provider: "HealthCorp",
            };

            const mockDocSnap = {
                exists: jest.fn().mockReturnValue(true),
                id: "policy-1",
                data: jest.fn().mockReturnValue(mockPolicy),
            };
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("policy-1");

            expect(result).toEqual({ id: "policy-1", ...mockPolicy });
        });

        it("should return null when document does not exist", async () => {
            mockDocSnap.exists.mockReturnValue(false);
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("non-existent");

            expect(result).toBeNull();
        });
    });

    describe("findByPatientId", () => {
        it("should return all policies for a patient", async () => {
            const mockPolicies = [
                { id: "policy-1", patientId: "patient-1", status: "Active" },
                { id: "policy-2", patientId: "patient-1", status: "Expired" },
            ];

            mockQuerySnapshot.docs = mockPolicies.map((policy) => ({
                id: policy.id,
                data: () => policy,
            }));

            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByPatientId("patient-1");

            expect(result).toHaveLength(2);
            expect(mockFirestore.where).toHaveBeenCalledWith("patientId", "==", "patient-1");
        });
    });

    describe("findActivePolicyByPatientId", () => {
        it("should return active policy for patient", async () => {
            const mockPolicy = {
                patientId: "patient-1",
                status: "Active",
            };

            mockQuerySnapshot.docs = [
                {
                    id: "policy-1",
                    data: () => mockPolicy,
                },
            ];
            mockQuerySnapshot.empty = false;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findActivePolicyByPatientId("patient-1");

            expect(result).toEqual({ id: "policy-1", ...mockPolicy });
            expect(mockFirestore.where).toHaveBeenCalledWith("patientId", "==", "patient-1");
            expect(mockFirestore.where).toHaveBeenCalledWith("status", "==", "Active");
        });

        it("should return null when no active policy found", async () => {
            mockQuerySnapshot.empty = true;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findActivePolicyByPatientId("patient-1");

            expect(result).toBeNull();
        });
    });

    describe("findByPolicyNumber", () => {
        it("should return policy by policy number", async () => {
            const mockPolicy = {
                policyNumber: "POL123456",
                patientId: "patient-1",
            };

            mockQuerySnapshot.docs = [
                {
                    id: "policy-1",
                    data: () => mockPolicy,
                },
            ];
            mockQuerySnapshot.empty = false;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByPolicyNumber("POL123456");

            expect(result).toEqual({ id: "policy-1", ...mockPolicy });
            expect(mockFirestore.where).toHaveBeenCalledWith("policyNumber", "==", "POL123456");
        });

        it("should return null when policy not found", async () => {
            mockQuerySnapshot.empty = true;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByPolicyNumber("NONEXISTENT");

            expect(result).toBeNull();
        });
    });
});

describe("InsuranceClaimRepository", () => {
    let repository: InsuranceClaimRepository;
    let mockDocSnap: any;
    let mockQuerySnapshot: any;

    beforeEach(() => {
        repository = new InsuranceClaimRepository();
        jest.clearAllMocks();

        mockDocSnap = {
            exists: jest.fn(),
            id: "test-id",
            data: jest.fn(),
        };

        mockQuerySnapshot = {
            docs: [],
            empty: true,
        };
    });

    describe("findById", () => {
        it("should return claim when document exists", async () => {
            const mockClaim = {
                policyId: "policy-1",
                paymentId: "payment-1",
                claimAmount: 1000,
                status: "Submitted",
            };

            const mockDocSnap = {
                exists: jest.fn().mockReturnValue(true),
                id: "claim-1",
                data: jest.fn().mockReturnValue(mockClaim),
            };
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("claim-1");

            expect(result).toEqual({ id: "claim-1", ...mockClaim });
        });

        it("should return null when document does not exist", async () => {
            mockDocSnap.exists.mockReturnValue(false);
            mockFirestore.getDoc.mockResolvedValue(mockDocSnap);

            const result = await repository.findById("non-existent");

            expect(result).toBeNull();
        });
    });

    describe("create", () => {
        it("should create insurance claim", async () => {
            const claimData = {
                policyId: "policy-1",
                paymentId: "payment-1",
                claimAmount: 1000,
                approvedAmount: 800,
                status: "Submitted" as const,
            };

            mockFirestore.addDoc.mockResolvedValue({ id: "new-claim-id" });

            const result = await repository.create(claimData);

            expect(result).toBe("new-claim-id");
            expect(mockFirestore.addDoc).toHaveBeenCalled();
        });
    });

    describe("findByPaymentId", () => {
        it("should return claim by payment ID", async () => {
            const mockClaim = {
                paymentId: "payment-1",
                policyId: "policy-1",
                status: "Approved",
            };

            mockQuerySnapshot.docs = [
                {
                    id: "claim-1",
                    data: () => mockClaim,
                },
            ];
            mockQuerySnapshot.empty = false;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByPaymentId("payment-1");

            expect(result).toEqual({ id: "claim-1", ...mockClaim });
            expect(mockFirestore.where).toHaveBeenCalledWith("paymentId", "==", "payment-1");
        });

        it("should return null when claim not found", async () => {
            mockQuerySnapshot.empty = true;
            mockFirestore.getDocs.mockResolvedValue(mockQuerySnapshot);

            const result = await repository.findByPaymentId("payment-1");

            expect(result).toBeNull();
        });
    });
});
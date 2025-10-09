import { InsurancePolicyRepository, InsuranceClaimRepository } from "@/lib/firestore/repositories/InsuranceRepository";
import { NotificationService } from "@/lib/services/NotificationService";
import { CheckEligibilityDTO, EligibilityResponse, InsurancePolicy, NotFoundError } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

export class InsuranceService {
    constructor(
        private policyRepo: InsurancePolicyRepository,
        private claimRepo: InsuranceClaimRepository,
        private notificationService: NotificationService
    ) {}

    async checkEligibility(data: CheckEligibilityDTO): Promise<EligibilityResponse> {
        // Find active policy for patient
        const policy = await this.policyRepo.findActivePolicyByPatientId(data.patientId);

        if (!policy) {
            throw new NotFoundError("No active insurance policy found");
        }

        // Check if policy is valid (not expired)
        const now = Timestamp.now();
        if (policy.endDate.seconds < now.seconds) {
            throw new NotFoundError("Insurance policy has expired");
        }

        // Calculate coverage
        const coverageAmount = Math.min(data.amount * (policy.coveragePercentage / 100), policy.maxCoverage);

        // Mock external API call
        const response = await this.mockInsuranceProviderAPI({
            policyNumber: policy.policyNumber,
            patientId: data.patientId,
            amount: data.amount,
        });

        return {
            eligible: true,
            coveragePercentage: policy.coveragePercentage,
            approvedAmount: response.approvedAmount,
            claimId: response.claimId,
        };
    }

    async submitClaim(policyId: string, paymentId: string, claimAmount: number): Promise<string> {
        const policy = await this.policyRepo.findById(policyId);
        if (!policy) {
            throw new NotFoundError("Insurance policy not found");
        }

        // Mock external API call for claim submission
        const response = await this.mockSubmitClaimAPI({
            policyNumber: policy.policyNumber,
            claimAmount,
        });

        // Create claim record
        const claimId = await this.claimRepo.create({
            policyId,
            paymentId,
            claimAmount,
            approvedAmount: response.approvedAmount,
            status: "Submitted",
        } as any);

        await this.notificationService.sendInsuranceClaimUpdate(claimId, "Submitted");

        return claimId;
    }

    async getPatientPolicies(patientId: string): Promise<InsurancePolicy[]> {
        return this.policyRepo.findByPatientId(patientId);
    }

    // Mock external API calls
    private async mockInsuranceProviderAPI(data: {
        policyNumber: string;
        patientId: string;
        amount: number;
    }): Promise<{ approvedAmount: number; claimId: string }> {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock coverage calculation (80% or 50% randomly)
        const coveragePercentage = Math.random() > 0.5 ? 80 : 50;
        const approvedAmount = data.amount * (coveragePercentage / 100);

        return {
            approvedAmount,
            claimId: `CLM${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
        };
    }

    private async mockSubmitClaimAPI(data: { policyNumber: string; claimAmount: number }): Promise<{ approvedAmount: number; status: string }> {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock approval (90% approval rate)
        const approved = Math.random() > 0.1;
        const approvedAmount = approved ? data.claimAmount : 0;

        return {
            approvedAmount,
            status: approved ? "Approved" : "Rejected",
        };
    }
}

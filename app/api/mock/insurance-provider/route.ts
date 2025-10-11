import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { policyNumber, patientId, amount } = await request.json();

        // Validate input
        if (!policyNumber || !patientId || !amount) {
            return NextResponse.json({ eligible: false, error: "Missing required fields" }, { status: 400 });
        }

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Mock eligibility check - 80% eligible
        const isEligible = Math.random() > 0.2;

        if (isEligible) {
            // Random coverage percentage (50% or 80%)
            const coveragePercentage = Math.random() > 0.5 ? 80 : 50;
            const approvedAmount = amount * (coveragePercentage / 100);

            return NextResponse.json({
                eligible: true,
                coveragePercentage,
                approvedAmount,
                maxCoverage: 100000,
                claimId: `CLM${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
                message: "Policy is active and eligible for claim",
            });
        } else {
            return NextResponse.json(
                {
                    eligible: false,
                    error: "Policy not active or patient not covered",
                    errorCode: "POLICY_INACTIVE",
                },
                { status: 400 }
            );
        }
    } catch (error) {
        return NextResponse.json({ eligible: false, error: "Internal server error" }, { status: 500 });
    }
}

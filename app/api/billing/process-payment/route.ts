import { NextRequest, NextResponse } from "next/server";
import { PaymentRepository } from "@/lib/firestore/repositories/PaymentRepository";
import { InsurancePolicyRepository, InsuranceClaimRepository } from "@/lib/firestore/repositories/InsuranceRepository";
import { BillingService } from "@/lib/services/BillingService";
import { InsuranceService } from "@/lib/services/InsuranceService";
import { NotificationService } from "@/lib/services/NotificationService";

const paymentRepo = new PaymentRepository();
const policyRepo = new InsurancePolicyRepository();
const claimRepo = new InsuranceClaimRepository();
const notificationService = new NotificationService();
const insuranceService = new InsuranceService(policyRepo, claimRepo, notificationService);
const billingService = new BillingService(paymentRepo, insuranceService, notificationService);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { paymentId, paymentMethod, cardDetails } = body;

        if (!paymentId || !paymentMethod) {
            return NextResponse.json({ success: false, error: "paymentId and paymentMethod are required" }, { status: 400 });
        }

        const payment = await billingService.processPayment(paymentId, paymentMethod, cardDetails);

        return NextResponse.json({ success: true, data: payment });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error.message },
            { status: error.name === "NotFoundError" ? 404 : error.name === "ValidationError" ? 400 : 500 }
        );
    }
}

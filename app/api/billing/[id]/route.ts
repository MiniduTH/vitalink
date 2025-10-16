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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const payment = await billingService.getPayment(id);
        return NextResponse.json({ success: true, data: payment });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.name === "NotFoundError" ? 404 : 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        await paymentRepo.update(id, body);
        const payment = await billingService.getPayment(id);
        return NextResponse.json({ success: true, data: payment });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.name === "NotFoundError" ? 404 : 500 });
    }
}

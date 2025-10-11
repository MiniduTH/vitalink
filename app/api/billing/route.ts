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

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const patientId = searchParams.get("patientId");

        if (patientId) {
            const payments = await billingService.getPatientPayments(patientId);
            return NextResponse.json({ success: true, data: payments });
        }

        const payments = await paymentRepo.findAll();
        return NextResponse.json({ success: true, data: payments });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Calculate bill with insurance
        const billCalculation = await billingService.calculateBill(body.appointmentId, body.amount, body.patientId);

        // Generate bill
        const payment = await billingService.generateBill({
            appointmentId: body.appointmentId,
            patientId: body.patientId,
            amount: billCalculation.amount,
            insuranceCoverage: billCalculation.insuranceCoverage,
            patientPortion: billCalculation.patientPortion,
            paymentMethod: body.paymentMethod || "Cash",
        });

        return NextResponse.json({ success: true, data: payment }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: error.name === "ValidationError" ? 400 : 500 });
    }
}

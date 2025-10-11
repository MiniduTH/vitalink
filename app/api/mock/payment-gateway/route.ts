import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { amount, cardNumber, cvv, cardholderName } = await request.json();

        // Validate input
        if (!amount || !cardNumber || !cvv) {
            return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
        }

        // Simulate processing delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Simulate 90% success rate
        if (Math.random() < 0.9) {
            return NextResponse.json({
                success: true,
                transactionId: `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}`,
                message: "Payment processed successfully",
                amount,
                processedAt: new Date().toISOString(),
            });
        } else {
            return NextResponse.json(
                {
                    success: false,
                    error: "Payment declined - Insufficient funds or invalid card",
                    errorCode: "PAYMENT_DECLINED",
                },
                { status: 400 }
            );
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
    }
}

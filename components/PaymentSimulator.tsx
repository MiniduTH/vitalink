"use client";

import { useState } from "react";
import styles from "./PaymentSimulator.module.css";

interface PaymentSimulatorProps {
    amount: number;
    onSuccess: (transactionId: string, method: "Cash" | "Card") => void;
    onCancel: () => void;
    patientName?: string;
}

export function PaymentSimulator({ amount, onSuccess, onCancel, patientName }: PaymentSimulatorProps) {
    const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card">("Card");
    const [processing, setProcessing] = useState(false);
    const [cardDetails, setCardDetails] = useState({
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        cardHolder: "",
    });

    const formatCardNumber = (value: string) => {
        const cleaned = value.replace(/\D/g, "");
        const groups = cleaned.match(/.{1,4}/g);
        return groups ? groups.join(" ") : cleaned;
    };

    const formatExpiryDate = (value: string) => {
        const cleaned = value.replace(/\D/g, "");
        if (cleaned.length >= 2) {
            return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
        }
        return cleaned;
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCardNumber(e.target.value);
        if (formatted.replace(/\s/g, "").length <= 16) {
            setCardDetails({ ...cardDetails, cardNumber: formatted });
        }
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatExpiryDate(e.target.value);
        if (formatted.replace("/", "").length <= 4) {
            setCardDetails({ ...cardDetails, expiryDate: formatted });
        }
    };

    const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "");
        if (value.length <= 3) {
            setCardDetails({ ...cardDetails, cvv: value });
        }
    };

    const validateCardDetails = (): boolean => {
        if (paymentMethod === "Cash") return true;

        const cardNumberClean = cardDetails.cardNumber.replace(/\s/g, "");
        if (cardNumberClean.length !== 16) {
            alert("Please enter a valid 16-digit card number");
            return false;
        }

        if (cardDetails.expiryDate.length !== 5) {
            alert("Please enter a valid expiry date (MM/YY)");
            return false;
        }

        if (cardDetails.cvv.length !== 3) {
            alert("Please enter a valid 3-digit CVV");
            return false;
        }

        if (!cardDetails.cardHolder.trim()) {
            alert("Please enter the card holder name");
            return false;
        }

        return true;
    };

    const simulatePaymentProcessing = async (): Promise<{ success: boolean; transactionId?: string; error?: string }> => {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (paymentMethod === "Cash") {
            // Cash payments always succeed
            return {
                success: true,
                transactionId: `CASH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            };
        }

        // Card payment simulation - 95% success rate
        const success = Math.random() > 0.05;

        if (success) {
            return {
                success: true,
                transactionId: `CARD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            };
        } else {
            const errors = ["Insufficient funds", "Card declined", "Invalid card details", "Bank authorization required"];
            return {
                success: false,
                error: errors[Math.floor(Math.random() * errors.length)],
            };
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateCardDetails()) {
            return;
        }

        setProcessing(true);

        try {
            const result = await simulatePaymentProcessing();

            if (result.success && result.transactionId) {
                onSuccess(result.transactionId, paymentMethod);
            } else {
                alert(`Payment failed: ${result.error || "Unknown error"}`);
            }
        } catch (error) {
            alert("Payment processing error. Please try again.");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className={styles.simulatorContainer}>
            <div className={styles.simulatorHeader}>
                <h2 className={styles.title}>Payment Simulator</h2>
                <p className={styles.subtitle}>Process payment securely</p>
            </div>

            {patientName && (
                <div className={styles.patientInfo}>
                    <span className={styles.label}>Patient:</span>
                    <span className={styles.value}>{patientName}</span>
                </div>
            )}

            <div className={styles.amountDisplay}>
                <span className={styles.amountLabel}>Amount to Pay</span>
                <span className={styles.amountValue}>LKR {amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.methodSelector}>
                    <label className={styles.methodLabel}>Payment Method</label>
                    <div className={styles.methodOptions}>
                        <button
                            type="button"
                            className={`${styles.methodBtn} ${paymentMethod === "Card" ? styles.active : ""}`}
                            onClick={() => setPaymentMethod("Card")}
                            disabled={processing}
                        >
                            <span className={styles.methodIcon}>💳</span>
                            <span>Card Payment</span>
                        </button>
                        <button
                            type="button"
                            className={`${styles.methodBtn} ${paymentMethod === "Cash" ? styles.active : ""}`}
                            onClick={() => setPaymentMethod("Cash")}
                            disabled={processing}
                        >
                            <span className={styles.methodIcon}>💵</span>
                            <span>Cash Payment</span>
                        </button>
                    </div>
                </div>

                {paymentMethod === "Card" && (
                    <div className={styles.cardDetails}>
                        <div className={styles.formGroup}>
                            <label className={styles.inputLabel}>Card Number</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="1234 5678 9012 3456"
                                value={cardDetails.cardNumber}
                                onChange={handleCardNumberChange}
                                disabled={processing}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.inputLabel}>Card Holder Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="John Doe"
                                value={cardDetails.cardHolder}
                                onChange={(e) => setCardDetails({ ...cardDetails, cardHolder: e.target.value })}
                                disabled={processing}
                                required
                            />
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.inputLabel}>Expiry Date</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="MM/YY"
                                    value={cardDetails.expiryDate}
                                    onChange={handleExpiryChange}
                                    disabled={processing}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.inputLabel}>CVV</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="123"
                                    value={cardDetails.cvv}
                                    onChange={handleCvvChange}
                                    disabled={processing}
                                    required
                                />
                            </div>
                        </div>
                    </div>
                )}

                {paymentMethod === "Cash" && (
                    <div className={styles.cashInfo}>
                        <div className={styles.infoBox}>
                            <span className={styles.infoIcon}>ℹ️</span>
                            <p>Cash payment will be marked as received. Please ensure you have collected the payment before confirming.</p>
                        </div>
                    </div>
                )}

                <div className={styles.actions}>
                    <button type="button" className={styles.cancelBtn} onClick={onCancel} disabled={processing}>
                        Cancel
                    </button>
                    <button type="submit" className={styles.submitBtn} disabled={processing}>
                        {processing ? (
                            <>
                                <span className={styles.processingSpinner}></span>
                                Processing...
                            </>
                        ) : (
                            `Pay LKR ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

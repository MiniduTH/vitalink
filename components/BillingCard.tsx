import React from "react";
import styles from "./BillingCard.module.css";
import { Payment } from "@/lib/types";

interface BillingCardProps {
    payment: Payment;
    onView?: (id: string) => void;
    onProcessPayment?: (id: string) => void;
}

export function BillingCard({ payment, onView, onProcessPayment }: BillingCardProps) {
    const formatDateTime = (timestamp: any) => {
        if (!timestamp) return "N/A";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    };

    const formatCurrency = (amount: number) => {
        return `LKR ${amount.toFixed(2)}`;
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "Paid":
            case "Completed":
                return styles.badgeSuccess;
            case "Pending":
                return styles.badgePending;
            case "Failed":
                return styles.badgeDanger;
            default:
                return styles.badgeDefault;
        }
    };

    const canProcessPayment = payment.status === "Pending";

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.dateTime}>
                    <span className={styles.date}>{formatDateTime(payment.createdAt)}</span>
                    <span className={styles.id}>Bill #{payment.id.slice(0, 8)}</span>
                </div>
                <span className={`${styles.badge} ${getStatusBadgeClass(payment.status)}`}>{payment.status}</span>
            </div>

            <div className={styles.amounts}>
                <div className={styles.amountRow}>
                    <span className={styles.amountLabel}>Total Amount:</span>
                    <span className={styles.amountValue}>{formatCurrency(payment.amount)}</span>
                </div>
                <div className={styles.amountRow}>
                    <span className={styles.amountLabel}>Insurance Coverage:</span>
                    <span className={`${styles.amountValue} ${styles.insurance}`}>{formatCurrency(payment.insuranceCoverage)}</span>
                </div>
                <div className={`${styles.amountRow} ${styles.patientRow}`}>
                    <span className={styles.amountLabel}>Patient Portion:</span>
                    <span className={`${styles.amountValue} ${styles.patient}`}>{formatCurrency(payment.patientPortion)}</span>
                </div>
            </div>

            <div className={styles.info}>
                <div className={styles.infoItem}>
                    <span className={styles.label}>Patient ID:</span>
                    <span className={styles.value}>{payment.patientId}</span>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.label}>Appointment ID:</span>
                    <span className={styles.value}>{payment.appointmentId.slice(0, 12)}...</span>
                </div>
                {payment.paymentMethod && (
                    <div className={styles.infoItem}>
                        <span className={styles.label}>Payment Method:</span>
                        <span className={styles.value}>{payment.paymentMethod}</span>
                    </div>
                )}
            </div>

            <div className={styles.actions}>
                {onView && (
                    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => onView(payment.id)}>
                        View Details
                    </button>
                )}
                {onProcessPayment && canProcessPayment && (
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => onProcessPayment(payment.id)}>
                        Process Payment
                    </button>
                )}
            </div>
        </div>
    );
}

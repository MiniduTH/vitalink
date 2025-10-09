"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Payment } from "@/lib/types";
import { BillingCard } from "@/components/BillingCard";
import styles from "./page.module.css";

type PaymentStatus = "All" | "Pending" | "Paid" | "Failed";

export default function BillingPage() {
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<PaymentStatus>("All");

    useEffect(() => {
        fetchPayments();
    }, [statusFilter]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            setError(null);

            let url = "/api/billing";
            const params = new URLSearchParams();
            if (statusFilter !== "All") params.append("status", statusFilter);

            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Failed to fetch payments");
            }

            const data = await response.json();
            if (data.success) {
                setPayments(data.data);
            } else {
                throw new Error(data.error || "Failed to load payments");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleProcessPayment = async (id: string) => {
        const paymentMethod = prompt("Enter payment method (Cash/Card):");
        if (!paymentMethod || !["Cash", "Card"].includes(paymentMethod)) {
            alert("Invalid payment method. Please enter 'Cash' or 'Card'");
            return;
        }

        if (!confirm(`Process payment via ${paymentMethod}?`)) return;

        try {
            const response = await fetch("/api/billing/process-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    paymentId: id,
                    paymentMethod,
                }),
            });

            if (!response.ok) throw new Error("Failed to process payment");

            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            // Refresh payments
            await fetchPayments();
            alert("Payment processed successfully!");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to process payment");
        }
    };

    const handleViewPayment = (id: string) => {
        router.push(`/billing/${id}`);
    };

    const handleGenerateBill = () => {
        router.push("/billing/new");
    };

    // Calculate totals
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalInsurance = payments.reduce((sum, p) => sum + p.insuranceCoverage, 0);
    const totalPatient = payments.reduce((sum, p) => sum + p.patientPortion, 0);
    const pendingCount = payments.filter((p) => p.status === "Pending").length;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Billing & Payments</h1>
                <button className={styles.btnNew} onClick={handleGenerateBill}>
                    + Generate Bill
                </button>
            </div>

            {/* Summary Cards */}
            <div className={styles.summaryGrid}>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Total Bills</span>
                    <span className={styles.summaryValue}>{payments.length}</span>
                </div>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Pending Payments</span>
                    <span className={`${styles.summaryValue} ${styles.pending}`}>{pendingCount}</span>
                </div>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Total Revenue</span>
                    <span className={`${styles.summaryValue} ${styles.revenue}`}>LKR {totalAmount.toFixed(2)}</span>
                </div>
                <div className={styles.summaryCard}>
                    <span className={styles.summaryLabel}>Patient Portion</span>
                    <span className={styles.summaryValue}>LKR {totalPatient.toFixed(2)}</span>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Status:</label>
                    <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as PaymentStatus)}>
                        <option value="All">All</option>
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Failed">Failed</option>
                    </select>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className={styles.error}>
                    <p>{error}</p>
                    <button onClick={fetchPayments} className={styles.btnRetry}>
                        Retry
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading payments...</p>
                </div>
            )}

            {/* Payments Grid */}
            {!loading && !error && (
                <>
                    {payments.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No payments found</p>
                            {statusFilter !== "All" && <button onClick={() => setStatusFilter("All")}>Clear filters</button>}
                        </div>
                    ) : (
                        <>
                            <div className={styles.stats}>
                                <p>
                                    Showing {payments.length} payment{payments.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                            <div className={styles.grid}>
                                {payments.map((payment) => (
                                    <BillingCard
                                        key={payment.id}
                                        payment={payment}
                                        onView={handleViewPayment}
                                        onProcessPayment={handleProcessPayment}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

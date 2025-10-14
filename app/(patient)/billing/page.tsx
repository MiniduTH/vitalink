"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { SearchBar } from "@/components/SearchBar";
import styles from "./billing.module.css";

interface Bill {
    id: string;
    date: string;
    description: string;
    amount: number;
    status: "Paid" | "Pending" | "Overdue";
    invoiceNumber: string;
    dueDate: string;
}

interface Insurance {
    policyNumber: string;
    provider: string;
    coverageType: string;
    expiryDate: string;
    status: "Active" | "Expired";
}

interface Payment {
    id: string;
    date: string;
    amount: number;
    method: string;
    billId: string;
    receiptNumber: string;
}

export default function PatientBilling() {
    const [activeTab, setActiveTab] = useState<"bills" | "insurance" | "history">("bills");
    const [bills, setBills] = useState<Bill[]>([]);
    const [insurance, setInsurance] = useState<Insurance | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        // TODO: Replace with actual API calls
        setTimeout(() => {
            setBills([
                {
                    id: "bill-1",
                    date: "2025-01-15",
                    description: "General Consultation - Dr. Sarah Johnson",
                    amount: 5000,
                    status: "Pending",
                    invoiceNumber: "INV-2025-001",
                    dueDate: "2025-02-15",
                },
                {
                    id: "bill-2",
                    date: "2024-12-20",
                    description: "Lab Tests - Complete Blood Count",
                    amount: 3500,
                    status: "Paid",
                    invoiceNumber: "INV-2024-245",
                    dueDate: "2025-01-20",
                },
                {
                    id: "bill-3",
                    date: "2024-11-10",
                    description: "Cardiology Consultation",
                    amount: 8000,
                    status: "Paid",
                    invoiceNumber: "INV-2024-189",
                    dueDate: "2024-12-10",
                },
            ]);

            setInsurance({
                policyNumber: "POL-123456",
                provider: "National Insurance Company",
                coverageType: "Comprehensive Health",
                expiryDate: "2026-12-31",
                status: "Active",
            });

            setPaymentHistory([
                {
                    id: "pay-1",
                    date: "2024-12-22",
                    amount: 3500,
                    method: "Credit Card",
                    billId: "bill-2",
                    receiptNumber: "REC-2024-301",
                },
                {
                    id: "pay-2",
                    date: "2024-11-15",
                    amount: 8000,
                    method: "Cash",
                    billId: "bill-3",
                    receiptNumber: "REC-2024-245",
                },
            ]);

            setLoading(false);
        }, 500);
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const formatCurrency = (amount: number) => {
        return `LKR ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    };

    const getStatusClass = (status: string) => {
        return styles[status.toLowerCase()];
    };

    const handlePayNow = (bill: Bill) => {
        setSelectedBill(bill);
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement actual payment processing
        alert("Payment processing would happen here. Integration with BillingService needed.");
        setShowPaymentModal(false);
        setSelectedBill(null);
    };

    const handleSearch = (query?: string) => {
        console.log("Searching:", query);
    };

    // Filter data
    const filteredBills = bills.filter(
        (b) =>
            !searchQuery ||
            b.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPayments = paymentHistory.filter((p) => !searchQuery || p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const totalPending = bills.filter((b) => b.status === "Pending").reduce((sum, b) => sum + b.amount, 0);
    const totalPaid = bills.filter((b) => b.status === "Paid").reduce((sum, b) => sum + b.amount, 0);

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading billing information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Billing & Payments</h1>
                <p className={styles.subtitle}>Manage your medical bills and insurance information</p>
            </header>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <StatCard value={formatCurrency(totalPending)} label="Pending" variant="pink" icon="💰" />
                <StatCard value={formatCurrency(totalPaid)} label="Paid" variant="green" icon="✓" />
                <StatCard value={bills.filter((b) => b.status === "Pending").length.toString()} label="Due Bills" variant="blue" icon="📄" />
            </div>

            {/* Search Bar */}
            <div className={styles.searchSection}>
                <SearchBar placeholder="Search bills, invoices, receipts..." value={searchQuery} onChange={setSearchQuery} onSearch={handleSearch} />
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === "bills" ? styles.activeTab : ""}`} onClick={() => setActiveTab("bills")}>
                    Bills
                </button>
                <button className={`${styles.tab} ${activeTab === "insurance" ? styles.activeTab : ""}`} onClick={() => setActiveTab("insurance")}>
                    Insurance
                </button>
                <button className={`${styles.tab} ${activeTab === "history" ? styles.activeTab : ""}`} onClick={() => setActiveTab("history")}>
                    History
                </button>
            </div>

            {/* Bills Tab */}
            {activeTab === "bills" && (
                <div className={styles.content}>
                    <div className={styles.billsList}>
                        {filteredBills.map((bill) => (
                            <div key={bill.id} className={styles.billCard}>
                                <div className={styles.billHeader}>
                                    <div>
                                        <h3 className={styles.billDescription}>{bill.description}</h3>
                                        <div className={styles.billMeta}>
                                            <span>Invoice: {bill.invoiceNumber}</span>
                                            <span>•</span>
                                            <span>Date: {formatDate(bill.date)}</span>
                                        </div>
                                    </div>
                                    <span className={`${styles.statusBadge} ${getStatusClass(bill.status)}`}>{bill.status}</span>
                                </div>

                                <div className={styles.billBody}>
                                    <div className={styles.billAmount}>
                                        <span className={styles.amountLabel}>Amount:</span>
                                        <span className={styles.amountValue}>{formatCurrency(bill.amount)}</span>
                                    </div>
                                    <div className={styles.billDue}>
                                        <span className={styles.dueLabel}>Due Date:</span>
                                        <span className={styles.dueValue}>{formatDate(bill.dueDate)}</span>
                                    </div>
                                </div>

                                <div className={styles.billActions}>
                                    <button className={styles.viewBtn}>View Details</button>
                                    {bill.status === "Pending" && (
                                        <button className={styles.payBtn} onClick={() => handlePayNow(bill)}>
                                            Pay Now
                                        </button>
                                    )}
                                    {bill.status === "Paid" && <button className={styles.receiptBtn}>Download Receipt</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Insurance Tab */}
            {activeTab === "insurance" && (
                <div className={styles.content}>
                    {insurance ? (
                        <div className={styles.insuranceCard}>
                            <div className={styles.insuranceHeader}>
                                <h2>Insurance Coverage</h2>
                                <span className={`${styles.statusBadge} ${getStatusClass(insurance.status)}`}>{insurance.status}</span>
                            </div>

                            <div className={styles.insuranceGrid}>
                                <div className={styles.insuranceField}>
                                    <label>Policy Number</label>
                                    <div className={styles.fieldValue}>{insurance.policyNumber}</div>
                                </div>

                                <div className={styles.insuranceField}>
                                    <label>Provider</label>
                                    <div className={styles.fieldValue}>{insurance.provider}</div>
                                </div>

                                <div className={styles.insuranceField}>
                                    <label>Coverage Type</label>
                                    <div className={styles.fieldValue}>{insurance.coverageType}</div>
                                </div>

                                <div className={styles.insuranceField}>
                                    <label>Expiry Date</label>
                                    <div className={styles.fieldValue}>{formatDate(insurance.expiryDate)}</div>
                                </div>
                            </div>

                            <div className={styles.insuranceActions}>
                                <button className={styles.updateBtn}>Update Insurance Info</button>
                                <button className={styles.viewBtn}>View Policy Details</button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🏥</div>
                            <h3>No Insurance Information</h3>
                            <p>Add your insurance details to streamline billing</p>
                            <button className={styles.addBtn}>Add Insurance</button>
                        </div>
                    )}
                </div>
            )}

            {/* Payment History Tab */}
            {activeTab === "history" && (
                <div className={styles.content}>
                    <div className={styles.historyTable}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Receipt #</th>
                                    <th>Description</th>
                                    <th>Method</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPayments.map((payment) => {
                                    const bill = bills.find((b) => b.id === payment.billId);
                                    return (
                                        <tr key={payment.id}>
                                            <td>{formatDate(payment.date)}</td>
                                            <td>{payment.receiptNumber}</td>
                                            <td>{bill?.description || "N/A"}</td>
                                            <td>{payment.method}</td>
                                            <td className={styles.historyAmount}>{formatCurrency(payment.amount)}</td>
                                            <td>
                                                <button className={styles.downloadBtn}>Download</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedBill && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Process Payment</h2>
                            <button className={styles.closeBtn} onClick={() => setShowPaymentModal(false)}>
                                ×
                            </button>
                        </div>

                        <div className={styles.paymentSummary}>
                            <div className={styles.summaryRow}>
                                <span>Invoice:</span>
                                <strong>{selectedBill.invoiceNumber}</strong>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Description:</span>
                                <strong>{selectedBill.description}</strong>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Amount Due:</span>
                                <strong className={styles.totalAmount}>{formatCurrency(selectedBill.amount)}</strong>
                            </div>
                        </div>

                        <form className={styles.paymentForm} onSubmit={handlePaymentSubmit}>
                            <div className={styles.formGroup}>
                                <label>Payment Method</label>
                                <select required>
                                    <option value="">Select Method</option>
                                    <option value="credit">Credit Card</option>
                                    <option value="debit">Debit Card</option>
                                    <option value="bank">Bank Transfer</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>Card Number</label>
                                <input type="text" placeholder="1234 5678 9012 3456" maxLength={19} required />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Expiry Date</label>
                                    <input type="text" placeholder="MM/YY" maxLength={5} required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>CVV</label>
                                    <input type="text" placeholder="123" maxLength={3} required />
                                </div>
                            </div>

                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowPaymentModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn}>
                                    Pay {formatCurrency(selectedBill.amount)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

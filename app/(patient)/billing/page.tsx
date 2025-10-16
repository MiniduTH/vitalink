"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { SearchBar } from "@/components/SearchBar";
import styles from "./billing.module.css";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { PaymentRepository } from "@/lib/firestore/repositories/PaymentRepository";
import { InsurancePolicyRepository, InsuranceClaimRepository } from "@/lib/firestore/repositories/InsuranceRepository";
import { BillingService } from "@/lib/services/BillingService";
import { InsuranceService } from "@/lib/services/InsuranceService";
import { NotificationService } from "@/lib/services/NotificationService";
import { Payment, InsurancePolicy } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

// Initialize services at module level
const paymentRepo = new PaymentRepository();
const insurancePolicyRepo = new InsurancePolicyRepository();
const insuranceClaimRepo = new InsuranceClaimRepository();
const notificationService = new NotificationService();
const insuranceService = new InsuranceService(insurancePolicyRepo, insuranceClaimRepo, notificationService);
const billingService = new BillingService(paymentRepo, insuranceService, notificationService);

export default function PatientBilling() {
    const { user, loading: authLoading, userData } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"bills" | "insurance" | "history">("bills");
    const [bills, setBills] = useState<Payment[]>([]);
    const [insurance, setInsurance] = useState<InsurancePolicy | null>(null);
    const [paymentHistory, setPaymentHistory] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showInsuranceModal, setShowInsuranceModal] = useState(false);
    const [showUpdateInsuranceModal, setShowUpdateInsuranceModal] = useState(false);
    const [showPolicyDetailsModal, setShowPolicyDetailsModal] = useState(false);
    const [selectedBill, setSelectedBill] = useState<Payment | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [paymentForm, setPaymentForm] = useState({
        paymentMethod: "",
        cardNumber: "",
        expiryDate: "",
        cvv: "",
    });
    const [insuranceForm, setInsuranceForm] = useState({
        policyNumber: "",
        provider: "",
        coveragePercentage: "",
        maxCoverage: "",
        startDate: "",
        endDate: "",
    });

    useEffect(() => {
        // Redirect if not authenticated
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        // Fetch data when user is available
        if (user && userData) {
            fetchBillingData();
        }
    }, [user, userData, authLoading, router]);

    const fetchBillingData = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch all payments for the patient
            const payments = await paymentRepo.findByPatientId(user.uid);
            setBills(payments);

            // Filter payment history (only Completed payments)
            const history = payments.filter((p) => p.status === "Completed");
            setPaymentHistory(history);

            // Fetch insurance information
            try {
                const insurances = await insurancePolicyRepo.findByPatientId(user.uid);
                if (insurances.length > 0) {
                    // Find active insurance
                    const activeInsurance = insurances.find((i) => i.status === "Active");
                    setInsurance(activeInsurance || insurances[0]);
                }
            } catch (err) {
                console.log("No insurance found");
                setInsurance(null);
            }
        } catch (err) {
            console.error("Error fetching billing data:", err);
            setError("Failed to load billing information. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string | Timestamp) => {
        if (!dateStr) return "N/A";
        const date = typeof dateStr === "string" ? new Date(dateStr) : (dateStr as Timestamp).toDate();
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const formatDateForInput = (dateStr: string | Timestamp) => {
        if (!dateStr) return "";
        const date = typeof dateStr === "string" ? new Date(dateStr) : (dateStr as Timestamp).toDate();
        return date.toISOString().split("T")[0]; // Returns YYYY-MM-DD format
    };

    const formatCurrency = (amount: number) => {
        return `LKR ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    };

    const getStatusClass = (status: string) => {
        return styles[status.toLowerCase()];
    };

    const handlePayNow = (payment: Payment) => {
        setSelectedBill(payment);
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement actual payment processing
        alert("Payment processing would happen here. Integration with BillingService needed.");
        setShowPaymentModal(false);
        setSelectedBill(null);
    };

    const handleAddInsurance = () => {
        setShowInsuranceModal(true);
    };

    const handleInsuranceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) return;

        try {
            setLoading(true);

            // Create insurance policy directly through the repository
            await insurancePolicyRepo.create({
                patientId: user.uid,
                policyNumber: insuranceForm.policyNumber,
                provider: insuranceForm.provider,
                coveragePercentage: parseFloat(insuranceForm.coveragePercentage),
                maxCoverage: parseFloat(insuranceForm.maxCoverage),
                startDate: Timestamp.fromDate(new Date(insuranceForm.startDate)),
                endDate: Timestamp.fromDate(new Date(insuranceForm.endDate)),
                status: "Active",
            });

            // Refresh insurance data
            await fetchBillingData();

            // Reset form and close modal
            setInsuranceForm({
                policyNumber: "",
                provider: "",
                coveragePercentage: "",
                maxCoverage: "",
                startDate: "",
                endDate: "",
            });
            setShowInsuranceModal(false);

            alert("Insurance policy added successfully!");
        } catch (err: any) {
            console.error("Error adding insurance:", err);
            alert(err.message || "Failed to add insurance policy. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateInsurance = () => {
        if (!insurance) return;

        // Pre-fill the form with existing insurance data
        setInsuranceForm({
            policyNumber: insurance.policyNumber,
            provider: insurance.provider,
            coveragePercentage: insurance.coveragePercentage.toString(),
            maxCoverage: insurance.maxCoverage.toString(),
            startDate: formatDateForInput(insurance.startDate),
            endDate: formatDateForInput(insurance.endDate),
        });
        setShowUpdateInsuranceModal(true);
    };

    const handleUpdateInsuranceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !insurance) return;

        try {
            setLoading(true);

            // Update insurance policy through the repository
            await insurancePolicyRepo.update(insurance.id, {
                policyNumber: insuranceForm.policyNumber,
                provider: insuranceForm.provider,
                coveragePercentage: parseFloat(insuranceForm.coveragePercentage),
                maxCoverage: parseFloat(insuranceForm.maxCoverage),
                startDate: Timestamp.fromDate(new Date(insuranceForm.startDate)),
                endDate: Timestamp.fromDate(new Date(insuranceForm.endDate)),
            });

            // Refresh insurance data
            await fetchBillingData();

            // Reset form and close modal
            setInsuranceForm({
                policyNumber: "",
                provider: "",
                coveragePercentage: "",
                maxCoverage: "",
                startDate: "",
                endDate: "",
            });
            setShowUpdateInsuranceModal(false);

            alert("Insurance policy updated successfully!");
        } catch (err: any) {
            console.error("Error updating insurance:", err);
            alert(err.message || "Failed to update insurance policy. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleViewPolicyDetails = () => {
        setShowPolicyDetailsModal(true);
    };

    const handleSearch = (query?: string) => {
        console.log("Searching:", query);
    };

    // Filter data - using Payment fields
    const filteredBills = bills.filter(
        (b) =>
            !searchQuery ||
            b.appointmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.transactionId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredPayments = paymentHistory.filter((p) => !searchQuery || p.transactionId.toLowerCase().includes(searchQuery.toLowerCase()));

    const totalPending = bills.filter((b) => b.status === "Pending").reduce((sum, b) => sum + b.amount, 0);
    const totalPaid = bills.filter((b) => b.status === "Completed").reduce((sum, b) => sum + b.amount, 0);

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
                                        <h3 className={styles.billDescription}>Payment for Appointment</h3>
                                        <div className={styles.billMeta}>
                                            <span>Transaction: {bill.transactionId}</span>
                                            <span>•</span>
                                            <span>Appointment: {bill.appointmentId}</span>
                                        </div>
                                    </div>
                                    <span className={`${styles.statusBadge} ${getStatusClass(bill.status)}`}>{bill.status}</span>
                                </div>

                                <div className={styles.billBody}>
                                    <div className={styles.billAmount}>
                                        <span className={styles.amountLabel}>Total Amount:</span>
                                        <span className={styles.amountValue}>{formatCurrency(bill.amount)}</span>
                                    </div>
                                    <div className={styles.billAmount}>
                                        <span className={styles.amountLabel}>Insurance Coverage:</span>
                                        <span className={styles.amountValue}>{formatCurrency(bill.insuranceCoverage)}</span>
                                    </div>
                                    <div className={styles.billAmount}>
                                        <span className={styles.amountLabel}>Your Portion:</span>
                                        <span className={styles.amountValue}>{formatCurrency(bill.patientPortion)}</span>
                                    </div>
                                    <div className={styles.billDue}>
                                        <span className={styles.dueLabel}>Payment Method:</span>
                                        <span className={styles.dueValue}>{bill.paymentMethod}</span>
                                    </div>
                                </div>

                                <div className={styles.billActions}>
                                    <button className={styles.viewBtn}>View Details</button>
                                    {bill.status === "Pending" && (
                                        <button className={styles.payBtn} onClick={() => handlePayNow(bill)}>
                                            Pay Now
                                        </button>
                                    )}
                                    {bill.status === "Completed" && <button className={styles.receiptBtn}>Download Receipt</button>}
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
                                    <label>Coverage Percentage</label>
                                    <div className={styles.fieldValue}>{insurance.coveragePercentage}%</div>
                                </div>

                                <div className={styles.insuranceField}>
                                    <label>Max Coverage</label>
                                    <div className={styles.fieldValue}>{formatCurrency(insurance.maxCoverage)}</div>
                                </div>

                                <div className={styles.insuranceField}>
                                    <label>Start Date</label>
                                    <div className={styles.fieldValue}>{formatDate(insurance.startDate)}</div>
                                </div>

                                <div className={styles.insuranceField}>
                                    <label>End Date</label>
                                    <div className={styles.fieldValue}>{formatDate(insurance.endDate)}</div>
                                </div>
                            </div>

                            <div className={styles.insuranceActions}>
                                <button className={styles.updateBtn} onClick={handleUpdateInsurance}>
                                    Update Insurance Info
                                </button>
                                <button className={styles.viewBtn} onClick={handleViewPolicyDetails}>
                                    View Policy Details
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🏥</div>
                            <h3>No Insurance Information</h3>
                            <p>Add your insurance details to streamline billing</p>
                            <button className={styles.addBtn} onClick={handleAddInsurance}>
                                Add Insurance
                            </button>
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
                                    return (
                                        <tr key={payment.id}>
                                            <td>{payment.paidAt ? formatDate(payment.paidAt) : "N/A"}</td>
                                            <td>{payment.transactionId}</td>
                                            <td>Appointment: {payment.appointmentId}</td>
                                            <td>{payment.paymentMethod}</td>
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
                                <span>Transaction ID:</span>
                                <strong>{selectedBill.transactionId}</strong>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Appointment ID:</span>
                                <strong>{selectedBill.appointmentId}</strong>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Total Amount:</span>
                                <strong className={styles.totalAmount}>{formatCurrency(selectedBill.amount)}</strong>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Insurance Coverage:</span>
                                <strong>{formatCurrency(selectedBill.insuranceCoverage)}</strong>
                            </div>
                            <div className={styles.summaryRow}>
                                <span>Your Portion:</span>
                                <strong className={styles.totalAmount}>{formatCurrency(selectedBill.patientPortion)}</strong>
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
                                    Pay {formatCurrency(selectedBill.patientPortion)}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Insurance Modal */}
            {showInsuranceModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Add Insurance Policy</h2>
                            <button className={styles.closeBtn} onClick={() => setShowInsuranceModal(false)}>
                                ×
                            </button>
                        </div>

                        <form className={styles.paymentForm} onSubmit={handleInsuranceSubmit}>
                            <div className={styles.formGroup}>
                                <label>Policy Number *</label>
                                <input
                                    type="text"
                                    placeholder="Enter policy number"
                                    value={insuranceForm.policyNumber}
                                    onChange={(e) => setInsuranceForm({ ...insuranceForm, policyNumber: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Insurance Provider *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Blue Cross, Aetna"
                                    value={insuranceForm.provider}
                                    onChange={(e) => setInsuranceForm({ ...insuranceForm, provider: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Coverage Percentage *</label>
                                    <input
                                        type="number"
                                        placeholder="e.g., 80"
                                        min="0"
                                        max="100"
                                        value={insuranceForm.coveragePercentage}
                                        onChange={(e) => setInsuranceForm({ ...insuranceForm, coveragePercentage: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Max Coverage (LKR) *</label>
                                    <input
                                        type="number"
                                        placeholder="e.g., 1000000"
                                        min="0"
                                        value={insuranceForm.maxCoverage}
                                        onChange={(e) => setInsuranceForm({ ...insuranceForm, maxCoverage: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Start Date *</label>
                                    <input
                                        type="date"
                                        value={insuranceForm.startDate}
                                        onChange={(e) => setInsuranceForm({ ...insuranceForm, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>End Date *</label>
                                    <input
                                        type="date"
                                        value={insuranceForm.endDate}
                                        onChange={(e) => setInsuranceForm({ ...insuranceForm, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowInsuranceModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn}>
                                    Add Insurance
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Update Insurance Modal */}
            {showUpdateInsuranceModal && insurance && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Update Insurance Policy</h2>
                            <button className={styles.closeBtn} onClick={() => setShowUpdateInsuranceModal(false)}>
                                ×
                            </button>
                        </div>

                        <form className={styles.paymentForm} onSubmit={handleUpdateInsuranceSubmit}>
                            <div className={styles.formGroup}>
                                <label>Policy Number *</label>
                                <input
                                    type="text"
                                    placeholder="Enter policy number"
                                    value={insuranceForm.policyNumber}
                                    onChange={(e) => setInsuranceForm({ ...insuranceForm, policyNumber: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label>Insurance Provider *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Blue Cross, Aetna"
                                    value={insuranceForm.provider}
                                    onChange={(e) => setInsuranceForm({ ...insuranceForm, provider: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Coverage Percentage *</label>
                                    <input
                                        type="number"
                                        placeholder="e.g., 80"
                                        min="0"
                                        max="100"
                                        value={insuranceForm.coveragePercentage}
                                        onChange={(e) => setInsuranceForm({ ...insuranceForm, coveragePercentage: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Max Coverage (LKR) *</label>
                                    <input
                                        type="number"
                                        placeholder="e.g., 1000000"
                                        min="0"
                                        value={insuranceForm.maxCoverage}
                                        onChange={(e) => setInsuranceForm({ ...insuranceForm, maxCoverage: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label>Start Date *</label>
                                    <input
                                        type="date"
                                        value={insuranceForm.startDate}
                                        onChange={(e) => setInsuranceForm({ ...insuranceForm, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label>End Date *</label>
                                    <input
                                        type="date"
                                        value={insuranceForm.endDate}
                                        onChange={(e) => setInsuranceForm({ ...insuranceForm, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowUpdateInsuranceModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn}>
                                    Update Insurance
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* View Policy Details Modal */}
            {showPolicyDetailsModal && insurance && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Insurance Policy Details</h2>
                            <button className={styles.closeBtn} onClick={() => setShowPolicyDetailsModal(false)}>
                                ×
                            </button>
                        </div>

                        <div className={styles.policyDetailsContent}>
                            <div className={styles.detailsSection}>
                                <h3 className={styles.sectionTitle}>Policy Information</h3>
                                <div className={styles.detailsGrid}>
                                    <div className={styles.detailItem}>
                                        <label>Policy Number:</label>
                                        <span>{insurance.policyNumber}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label>Provider:</label>
                                        <span>{insurance.provider}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label>Status:</label>
                                        <span className={`${styles.statusBadge} ${getStatusClass(insurance.status)}`}>{insurance.status}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label>Patient ID:</label>
                                        <span>{insurance.patientId}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.detailsSection}>
                                <h3 className={styles.sectionTitle}>Coverage Details</h3>
                                <div className={styles.detailsGrid}>
                                    <div className={styles.detailItem}>
                                        <label>Coverage Percentage:</label>
                                        <span className={styles.highlightValue}>{insurance.coveragePercentage}%</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label>Maximum Coverage:</label>
                                        <span className={styles.highlightValue}>{formatCurrency(insurance.maxCoverage)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.detailsSection}>
                                <h3 className={styles.sectionTitle}>Validity Period</h3>
                                <div className={styles.detailsGrid}>
                                    <div className={styles.detailItem}>
                                        <label>Start Date:</label>
                                        <span>{formatDate(insurance.startDate)}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label>End Date:</label>
                                        <span>{formatDate(insurance.endDate)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.detailsSection}>
                                <h3 className={styles.sectionTitle}>Timestamps</h3>
                                <div className={styles.detailsGrid}>
                                    <div className={styles.detailItem}>
                                        <label>Created:</label>
                                        <span>{formatDate(insurance.createdAt)}</span>
                                    </div>
                                    <div className={styles.detailItem}>
                                        <label>Last Updated:</label>
                                        <span>{formatDate(insurance.updatedAt)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.modalActions}>
                                <button className={styles.closeModalBtn} onClick={() => setShowPolicyDetailsModal(false)}>
                                    Close
                                </button>
                                <button
                                    className={styles.updateBtn}
                                    onClick={() => {
                                        setShowPolicyDetailsModal(false);
                                        handleUpdateInsurance();
                                    }}
                                >
                                    Edit Policy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

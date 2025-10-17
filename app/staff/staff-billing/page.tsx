"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Payment, Patient, Appointment } from "@/lib/types";
import { BillingCard } from "@/components/BillingCard";
import styles from "./page.module.css";
import { Timestamp } from "firebase/firestore";

type PaymentStatus = "All" | "Pending" | "Paid" | "Failed";

export default function BillingPage() {
    const router = useRouter();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<PaymentStatus>("All");

    // Create Bill Modal State
    const [showCreateBillModal, setShowCreateBillModal] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [billForm, setBillForm] = useState({
        amount: "",
        description: "",
    });

    useEffect(() => {
        fetchPayments();
        fetchPatients();
    }, [statusFilter]);

    const fetchPatients = async () => {
        try {
            const response = await fetch("/api/patients");
            if (response.ok) {
                const data = await response.json();
                console.log("Fetched patients:", data);
                setPatients(data.patients || []);
            } else {
                console.error("Failed to fetch patients:", response.status);
            }
        } catch (err) {
            console.error("Error fetching patients:", err);
        }
    };

    const fetchAppointmentsForPatient = async (patientId: string) => {
        try {
            const response = await fetch(`/api/appointments?patientId=${patientId}`);
            if (response.ok) {
                const data = await response.json();
                setAppointments(data.appointments || []);
            }
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setAppointments([]);
        }
    };

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
        setShowCreateBillModal(true);
        setSelectedPatient(null);
        setSelectedAppointment(null);
        setBillForm({ amount: "", description: "" });
        setSearchTerm("");
    };

    const handlePatientSelect = async (patient: Patient) => {
        setSelectedPatient(patient);
        setSearchTerm("");
        await fetchAppointmentsForPatient(patient.id);
    };

    const handleCreateBill = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedPatient) {
            alert("Please select a patient");
            return;
        }

        if (!billForm.amount || parseFloat(billForm.amount) <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        try {
            setLoading(true);

            // If no appointment selected, use a placeholder
            const appointmentId = selectedAppointment?.id || "WALK-IN";

            const response = await fetch("/api/billing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    appointmentId,
                    patientId: selectedPatient.id,
                    amount: parseFloat(billForm.amount),
                    paymentMethod: "Pending",
                }),
            });

            if (!response.ok) throw new Error("Failed to create bill");

            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            // Refresh payments
            await fetchPayments();
            setShowCreateBillModal(false);
            alert("Bill created successfully!");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to create bill");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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

            {/* Create Bill Modal */}
            {showCreateBillModal && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Create New Bill</h2>
                            <button className={styles.closeBtn} onClick={() => setShowCreateBillModal(false)}>
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleCreateBill} className={styles.billForm}>
                            {/* Patient Selection */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Select Patient *</label>
                                {selectedPatient ? (
                                    <div className={styles.selectedPatient}>
                                        <div className={styles.patientDetails}>
                                            <span className={styles.patientName}>
                                                {selectedPatient.firstName} {selectedPatient.lastName}
                                            </span>
                                            <span className={styles.patientInfo}>{selectedPatient.email}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className={styles.changeBtn}
                                            onClick={() => {
                                                setSelectedPatient(null);
                                                setSelectedAppointment(null);
                                                setAppointments([]);
                                            }}
                                        >
                                            Change
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            className={styles.searchInput}
                                            placeholder="Search patient by name or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            autoComplete="off"
                                        />
                                        {!searchTerm && patients.length > 0 && (
                                            <div className={styles.searchHint}>
                                                <p>
                                                    💡 Start typing to search from {patients.length} patient{patients.length !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                        )}
                                        {!searchTerm && patients.length === 0 && (
                                            <div className={styles.searchHint}>
                                                <p>⚠️ No patients found in the system</p>
                                            </div>
                                        )}
                                        {searchTerm && (
                                            <div className={styles.patientList}>
                                                {(() => {
                                                    const filteredPatients = patients.filter(
                                                        (p) =>
                                                            p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                            p.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                            p.email.toLowerCase().includes(searchTerm.toLowerCase())
                                                    );

                                                    if (filteredPatients.length === 0) {
                                                        return (
                                                            <div className={styles.noPatients}>
                                                                <p>No patients found matching "{searchTerm}"</p>
                                                            </div>
                                                        );
                                                    }

                                                    return filteredPatients.slice(0, 5).map((patient) => (
                                                        <div
                                                            key={patient.id}
                                                            className={styles.patientItem}
                                                            onClick={() => handlePatientSelect(patient)}
                                                        >
                                                            <span className={styles.patientName}>
                                                                {patient.firstName} {patient.lastName}
                                                            </span>
                                                            <span className={styles.patientEmail}>{patient.email}</span>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Appointment Selection (Optional) */}
                            {selectedPatient && appointments.length > 0 && (
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Link to Appointment (Optional)</label>
                                    <select
                                        className={styles.formSelect}
                                        value={selectedAppointment?.id || ""}
                                        onChange={(e) => {
                                            const apt = appointments.find((a) => a.id === e.target.value);
                                            setSelectedAppointment(apt || null);
                                        }}
                                    >
                                        <option value="">No appointment (Walk-in)</option>
                                        {appointments.map((apt) => (
                                            <option key={apt.id} value={apt.id}>
                                                {formatDate(apt.appointmentDate)} - {apt.timeSlot} - {apt.reason}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Bill Amount */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Amount (LKR) *</label>
                                <input
                                    type="number"
                                    className={styles.formInput}
                                    placeholder="Enter amount"
                                    min="0"
                                    step="0.01"
                                    value={billForm.amount}
                                    onChange={(e) => setBillForm({ ...billForm, amount: e.target.value })}
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Description (Optional)</label>
                                <textarea
                                    className={styles.formTextarea}
                                    placeholder="Add notes about this bill..."
                                    rows={3}
                                    value={billForm.description}
                                    onChange={(e) => setBillForm({ ...billForm, description: e.target.value })}
                                />
                            </div>

                            {/* Insurance Info */}
                            {selectedPatient && (
                                <div className={styles.insuranceNote}>
                                    <span className={styles.noteIcon}>ℹ️</span>
                                    <p>Insurance coverage will be automatically calculated if the patient has an active policy.</p>
                                </div>
                            )}

                            {/* Actions */}
                            <div className={styles.modalActions}>
                                <button type="button" className={styles.cancelModalBtn} onClick={() => setShowCreateBillModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitModalBtn} disabled={!selectedPatient || loading}>
                                    {loading ? "Creating..." : "Create Bill"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import styles from "./page.module.css";

interface DashboardMetrics {
    totalPatients: number;
    totalAppointments: number;
    totalRevenue: number;
    pendingPayments: number;
    todayAppointments: number;
    completionRate: number;
}

interface PatientFlowData {
    totalAppointments: number;
    scheduledAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    averageWaitTime: number;
    departmentBreakdown: Array<{
        departmentId: string;
        departmentName: string;
        appointmentCount: number;
        averageWaitTime: number;
    }>;
}

interface RevenueData {
    totalRevenue: number;
    cashPayments: number;
    cardPayments: number;
    insurancePayments: number;
    pendingPayments: number;
    refunds: number;
    dailyBreakdown: Array<{
        date: string;
        revenue: number;
        transactions: number;
    }>;
}

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<"dashboard" | "patient-flow" | "revenue">("dashboard");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Dashboard data
    const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);

    // Report data
    const [patientFlowData, setPatientFlowData] = useState<PatientFlowData | null>(null);
    const [revenueData, setRevenueData] = useState<RevenueData | null>(null);

    // Load dashboard metrics on mount
    useEffect(() => {
        loadDashboardMetrics();
    }, []);

    // Set default date range (last 30 days)
    useEffect(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        setEndDate(today.toISOString().split("T")[0]);
        setStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
    }, []);

    const loadDashboardMetrics = async () => {
        try {
            // Fetch all data directly from Firestore
            const [patientsSnapshot, appointmentsSnapshot, paymentsSnapshot] = await Promise.all([
                getDocs(collection(db, "patients")),
                getDocs(collection(db, "appointments")),
                getDocs(collection(db, "payments")),
            ]);

            const patients = patientsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            const appointments = appointmentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            const payments = paymentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            // Calculate today's appointments
            const today = new Date().toDateString();
            const todayAppointments = appointments.filter((apt: any) => {
                const aptDate = apt.appointmentDate?.toDate ? apt.appointmentDate.toDate() : new Date(apt.appointmentDate);
                return aptDate.toDateString() === today;
            }).length;

            // Calculate completion rate
            const completedCount = appointments.filter((apt: any) => apt.status === "Completed").length;
            const completionRate = appointments.length > 0 ? Math.round((completedCount / appointments.length) * 100) : 0;

            // Calculate revenue
            const totalRevenue = payments.filter((p: any) => p.status === "Completed").reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

            const pendingPayments = payments.filter((p: any) => p.status === "Pending").reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

            setDashboardMetrics({
                totalPatients: patients.length,
                totalAppointments: appointments.length,
                totalRevenue,
                pendingPayments,
                todayAppointments,
                completionRate,
            });
        } catch (err) {
            console.error("Failed to load dashboard metrics:", err);
        }
    };

    const handleGeneratePatientFlow = async () => {
        if (!startDate || !endDate) {
            setError("Please select both start and end dates");
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setError("Start date must be before end date");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const url = `/api/reports/patient-flow?startDate=${startDate}&endDate=${endDate}`;
            const response = await fetch(url);

            if (!response.ok) throw new Error("Failed to generate report");

            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            setPatientFlowData(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate report");
            setPatientFlowData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateRevenue = async () => {
        if (!startDate || !endDate) {
            setError("Please select both start and end dates");
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            setError("Start date must be before end date");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const url = `/api/reports/revenue?startDate=${startDate}&endDate=${endDate}`;
            const response = await fetch(url);

            if (!response.ok) throw new Error("Failed to generate report");

            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            setRevenueData(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate report");
            setRevenueData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPatientFlow = () => {
        if (!patientFlowData) {
            alert("Please generate a patient flow report first");
            return;
        }

        const csvContent =
            `Patient Flow Report\nDate Range: ${startDate} to ${endDate}\n\n` +
            `Metric,Value\n` +
            `Total Appointments,${patientFlowData.totalAppointments}\n` +
            `Scheduled,${patientFlowData.scheduledAppointments}\n` +
            `Completed,${patientFlowData.completedAppointments}\n` +
            `Cancelled,${patientFlowData.cancelledAppointments}\n` +
            `Average Wait Time,${patientFlowData.averageWaitTime} minutes\n\n` +
            `Department Breakdown\n` +
            `Department,Appointments,Avg Wait Time\n` +
            patientFlowData.departmentBreakdown
                .map((dept) => `${dept.departmentName},${dept.appointmentCount},${dept.averageWaitTime} min`)
                .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `patient-flow-report-${startDate}-to-${endDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const handleExportRevenue = () => {
        if (!revenueData) {
            alert("Please generate a revenue report first");
            return;
        }

        const csvContent =
            `Revenue Report\nDate Range: ${startDate} to ${endDate}\n\n` +
            `Metric,Amount (LKR)\n` +
            `Total Revenue,${revenueData.totalRevenue.toFixed(2)}\n` +
            `Cash Payments,${revenueData.cashPayments.toFixed(2)}\n` +
            `Card Payments,${revenueData.cardPayments.toFixed(2)}\n` +
            `Insurance Coverage,${revenueData.insurancePayments.toFixed(2)}\n` +
            `Pending Payments,${revenueData.pendingPayments.toFixed(2)}\n` +
            `Refunds,${revenueData.refunds.toFixed(2)}\n\n` +
            `Daily Breakdown\n` +
            `Date,Revenue,Transactions\n` +
            revenueData.dailyBreakdown.map((day) => `${day.date},${day.revenue.toFixed(2)},${day.transactions}`).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `revenue-report-${startDate}-to-${endDate}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const formatCurrency = (amount: number) => `LKR ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>📊 Reports & Analytics</h1>
                <p className={styles.subtitle}>Comprehensive insights and data analytics</p>
            </div>

            {/* Tab Navigation */}
            <div className={styles.tabNav}>
                <button className={`${styles.tabBtn} ${activeTab === "dashboard" ? styles.active : ""}`} onClick={() => setActiveTab("dashboard")}>
                    🏠 Dashboard
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === "patient-flow" ? styles.active : ""}`}
                    onClick={() => setActiveTab("patient-flow")}
                >
                    👥 Patient Flow
                </button>
                <button className={`${styles.tabBtn} ${activeTab === "revenue" ? styles.active : ""}`} onClick={() => setActiveTab("revenue")}>
                    💰 Revenue
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className={styles.error}>
                    <p>{error}</p>
                </div>
            )}

            {/* Dashboard Tab */}
            {activeTab === "dashboard" && (
                <div className={styles.dashboardContent}>
                    {dashboardMetrics ? (
                        <>
                            <h2 className={styles.sectionTitle}>Key Metrics Overview</h2>
                            <div className={styles.metricsGrid}>
                                <div className={`${styles.metricCard} ${styles.patients}`}>
                                    <div className={styles.metricIcon}>👥</div>
                                    <div className={styles.metricContent}>
                                        <span className={styles.metricLabel}>Total Patients</span>
                                        <span className={styles.metricValue}>{dashboardMetrics.totalPatients}</span>
                                    </div>
                                </div>

                                <div className={`${styles.metricCard} ${styles.appointments}`}>
                                    <div className={styles.metricIcon}>📅</div>
                                    <div className={styles.metricContent}>
                                        <span className={styles.metricLabel}>Total Appointments</span>
                                        <span className={styles.metricValue}>{dashboardMetrics.totalAppointments}</span>
                                    </div>
                                </div>

                                <div className={`${styles.metricCard} ${styles.revenue}`}>
                                    <div className={styles.metricIcon}>💰</div>
                                    <div className={styles.metricContent}>
                                        <span className={styles.metricLabel}>Total Revenue</span>
                                        <span className={styles.metricValue}>{formatCurrency(dashboardMetrics.totalRevenue)}</span>
                                    </div>
                                </div>

                                <div className={`${styles.metricCard} ${styles.pending}`}>
                                    <div className={styles.metricIcon}>⏳</div>
                                    <div className={styles.metricContent}>
                                        <span className={styles.metricLabel}>Pending Payments</span>
                                        <span className={styles.metricValue}>{formatCurrency(dashboardMetrics.pendingPayments)}</span>
                                    </div>
                                </div>

                                <div className={`${styles.metricCard} ${styles.today}`}>
                                    <div className={styles.metricIcon}>📆</div>
                                    <div className={styles.metricContent}>
                                        <span className={styles.metricLabel}>Today's Appointments</span>
                                        <span className={styles.metricValue}>{dashboardMetrics.todayAppointments}</span>
                                    </div>
                                </div>

                                <div className={`${styles.metricCard} ${styles.completion}`}>
                                    <div className={styles.metricIcon}>✅</div>
                                    <div className={styles.metricContent}>
                                        <span className={styles.metricLabel}>Completion Rate</span>
                                        <span className={styles.metricValue}>{dashboardMetrics.completionRate}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.quickActions}>
                                <button className={styles.actionBtn} onClick={() => setActiveTab("patient-flow")}>
                                    📊 Generate Patient Flow Report
                                </button>
                                <button className={styles.actionBtn} onClick={() => setActiveTab("revenue")}>
                                    💵 Generate Revenue Report
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.loading}>Loading dashboard metrics...</div>
                    )}
                </div>
            )}

            {/* Patient Flow Tab */}
            {activeTab === "patient-flow" && (
                <div className={styles.reportContent}>
                    <div className={styles.configCard}>
                        <h2 className={styles.configTitle}>Patient Flow Report</h2>
                        <div className={styles.configForm}>
                            <div className={styles.configRow}>
                                <div className={styles.field}>
                                    <label className={styles.label}>Start Date:</label>
                                    <input type="date" className={styles.input} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>End Date:</label>
                                    <input type="date" className={styles.input} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                            </div>
                            <button className={styles.btnGenerate} onClick={handleGeneratePatientFlow} disabled={loading}>
                                {loading ? "Generating..." : "📊 Generate Report"}
                            </button>
                        </div>
                    </div>

                    {patientFlowData && (
                        <>
                            <div className={styles.summaryGrid}>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Total Appointments</span>
                                    <span className={styles.summaryValue}>{patientFlowData.totalAppointments}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Scheduled</span>
                                    <span className={styles.summaryValue}>{patientFlowData.scheduledAppointments}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Completed</span>
                                    <span className={styles.summaryValue}>{patientFlowData.completedAppointments}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Cancelled</span>
                                    <span className={styles.summaryValue}>{patientFlowData.cancelledAppointments}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Avg Wait Time</span>
                                    <span className={styles.summaryValue}>{patientFlowData.averageWaitTime} min</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Completion Rate</span>
                                    <span className={styles.summaryValue}>
                                        {patientFlowData.totalAppointments > 0
                                            ? Math.round((patientFlowData.completedAppointments / patientFlowData.totalAppointments) * 100)
                                            : 0}
                                        %
                                    </span>
                                </div>
                            </div>

                            <div className={styles.exportActions}>
                                <button className={styles.btnExport} onClick={handleExportPatientFlow}>
                                    📥 Export as CSV
                                </button>
                            </div>

                            {patientFlowData.departmentBreakdown.length > 0 && (
                                <div className={styles.tableCard}>
                                    <h2 className={styles.tableTitle}>Department Performance</h2>
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th>Department</th>
                                                    <th>Appointments</th>
                                                    <th>Avg Wait Time</th>
                                                    <th>Percentage</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {patientFlowData.departmentBreakdown.map((dept, index) => (
                                                    <tr key={index}>
                                                        <td>{dept.departmentName}</td>
                                                        <td>{dept.appointmentCount}</td>
                                                        <td>{dept.averageWaitTime} min</td>
                                                        <td>
                                                            {patientFlowData.totalAppointments > 0
                                                                ? Math.round((dept.appointmentCount / patientFlowData.totalAppointments) * 100)
                                                                : 0}
                                                            %
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {!patientFlowData && !loading && (
                        <div className={styles.empty}>
                            <p>📊 Select date range and generate report to view patient flow analytics</p>
                        </div>
                    )}
                </div>
            )}

            {/* Revenue Tab */}
            {activeTab === "revenue" && (
                <div className={styles.reportContent}>
                    <div className={styles.configCard}>
                        <h2 className={styles.configTitle}>Revenue Report</h2>
                        <div className={styles.configForm}>
                            <div className={styles.configRow}>
                                <div className={styles.field}>
                                    <label className={styles.label}>Start Date:</label>
                                    <input type="date" className={styles.input} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>End Date:</label>
                                    <input type="date" className={styles.input} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                                </div>
                            </div>
                            <button className={styles.btnGenerate} onClick={handleGenerateRevenue} disabled={loading}>
                                {loading ? "Generating..." : "💰 Generate Report"}
                            </button>
                        </div>
                    </div>

                    {revenueData && (
                        <>
                            <div className={styles.summaryGrid}>
                                <div className={`${styles.summaryCard} ${styles.highlight}`}>
                                    <span className={styles.summaryLabel}>Total Revenue</span>
                                    <span className={`${styles.summaryValue} ${styles.revenue}`}>{formatCurrency(revenueData.totalRevenue)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Cash Payments</span>
                                    <span className={styles.summaryValue}>{formatCurrency(revenueData.cashPayments)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Card Payments</span>
                                    <span className={styles.summaryValue}>{formatCurrency(revenueData.cardPayments)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Insurance Coverage</span>
                                    <span className={styles.summaryValue}>{formatCurrency(revenueData.insurancePayments)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Pending Payments</span>
                                    <span className={styles.summaryValue}>{formatCurrency(revenueData.pendingPayments)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Refunds</span>
                                    <span className={styles.summaryValue}>{formatCurrency(revenueData.refunds)}</span>
                                </div>
                            </div>

                            <div className={styles.exportActions}>
                                <button className={styles.btnExport} onClick={handleExportRevenue}>
                                    📥 Export as CSV
                                </button>
                            </div>

                            {revenueData.dailyBreakdown.length > 0 && (
                                <div className={styles.tableCard}>
                                    <h2 className={styles.tableTitle}>Daily Revenue Breakdown</h2>
                                    <div className={styles.tableWrapper}>
                                        <table className={styles.table}>
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Revenue</th>
                                                    <th>Transactions</th>
                                                    <th>Avg per Transaction</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {revenueData.dailyBreakdown.map((day, index) => (
                                                    <tr key={index}>
                                                        <td>{new Date(day.date).toLocaleDateString()}</td>
                                                        <td>{formatCurrency(day.revenue)}</td>
                                                        <td>{day.transactions}</td>
                                                        <td>
                                                            {day.transactions > 0
                                                                ? formatCurrency(day.revenue / day.transactions)
                                                                : formatCurrency(0)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className={styles.totalRow}>
                                                    <td>
                                                        <strong>Total</strong>
                                                    </td>
                                                    <td>
                                                        <strong>{formatCurrency(revenueData.totalRevenue)}</strong>
                                                    </td>
                                                    <td>
                                                        <strong>{revenueData.dailyBreakdown.reduce((sum, day) => sum + day.transactions, 0)}</strong>
                                                    </td>
                                                    <td>
                                                        <strong>-</strong>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {!revenueData && !loading && (
                        <div className={styles.empty}>
                            <p>💰 Select date range and generate report to view revenue analytics</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

"use client";

import { useState } from "react";
import styles from "./page.module.css";

interface ReportData {
    date: string;
    patientCount: number;
    revenue: number;
}

export default function ReportsPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [reportType, setReportType] = useState<"patient-flow" | "revenue">("patient-flow");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [reportData, setReportData] = useState<ReportData[] | null>(null);

    const handleGenerateReport = async () => {
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

            const endpoint = reportType === "patient-flow" ? "/api/reports/patient-flow" : "/api/reports/revenue";
            const url = `${endpoint}?startDate=${startDate}&endDate=${endDate}`;

            const response = await fetch(url);

            if (!response.ok) throw new Error("Failed to generate report");

            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            setReportData(data.data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate report");
            setReportData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleExportReport = async (format: "pdf" | "csv") => {
        if (!reportData) {
            alert("Please generate a report first");
            return;
        }

        try {
            const response = await fetch("/api/reports/export", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reportType,
                    startDate,
                    endDate,
                    format,
                }),
            });

            if (!response.ok) throw new Error("Failed to export report");

            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            // In a real app, this would trigger a download
            alert(`Report exported successfully as ${format.toUpperCase()}!\n\nFile: ${data.data.filename}`);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to export report");
        }
    };

    const getTotalPatients = () => reportData?.reduce((sum, day) => sum + day.patientCount, 0) || 0;
    const getTotalRevenue = () => reportData?.reduce((sum, day) => sum + day.revenue, 0) || 0;
    const getAverageDaily = () => {
        if (!reportData || reportData.length === 0) return 0;
        return reportType === "patient-flow"
            ? (getTotalPatients() / reportData.length).toFixed(1)
            : (getTotalRevenue() / reportData.length).toFixed(2);
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Reports & Analytics</h1>
            </div>

            {/* Report Configuration */}
            <div className={styles.configCard}>
                <h2 className={styles.configTitle}>Generate Report</h2>

                <div className={styles.configForm}>
                    <div className={styles.configRow}>
                        <div className={styles.field}>
                            <label className={styles.label}>Report Type:</label>
                            <select
                                className={styles.select}
                                value={reportType}
                                onChange={(e) => setReportType(e.target.value as "patient-flow" | "revenue")}
                            >
                                <option value="patient-flow">Patient Flow</option>
                                <option value="revenue">Revenue</option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Start Date:</label>
                            <input type="date" className={styles.input} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>End Date:</label>
                            <input type="date" className={styles.input} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </div>
                    </div>

                    <button className={styles.btnGenerate} onClick={handleGenerateReport} disabled={loading}>
                        {loading ? "Generating..." : "Generate Report"}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className={styles.error}>
                    <p>{error}</p>
                </div>
            )}

            {/* Report Results */}
            {reportData && (
                <>
                    {/* Summary Cards */}
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryCard}>
                            <span className={styles.summaryLabel}>Total Days</span>
                            <span className={styles.summaryValue}>{reportData.length}</span>
                        </div>
                        {reportType === "patient-flow" ? (
                            <>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Total Patients</span>
                                    <span className={styles.summaryValue}>{getTotalPatients()}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Average Daily</span>
                                    <span className={styles.summaryValue}>{getAverageDaily()}</span>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Total Revenue</span>
                                    <span className={`${styles.summaryValue} ${styles.revenue}`}>LKR {getTotalRevenue().toFixed(2)}</span>
                                </div>
                                <div className={styles.summaryCard}>
                                    <span className={styles.summaryLabel}>Average Daily</span>
                                    <span className={styles.summaryValue}>LKR {getAverageDaily()}</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Export Buttons */}
                    <div className={styles.exportActions}>
                        <button className={styles.btnExport} onClick={() => handleExportReport("pdf")}>
                            📄 Export as PDF
                        </button>
                        <button className={styles.btnExport} onClick={() => handleExportReport("csv")}>
                            📊 Export as CSV
                        </button>
                    </div>

                    {/* Data Table */}
                    <div className={styles.tableCard}>
                        <h2 className={styles.tableTitle}>{reportType === "patient-flow" ? "Daily Patient Flow" : "Daily Revenue"} Report</h2>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        {reportType === "patient-flow" ? <th>Patient Count</th> : <th>Revenue (LKR)</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((day, index) => (
                                        <tr key={index}>
                                            <td>{new Date(day.date).toLocaleDateString()}</td>
                                            {reportType === "patient-flow" ? <td>{day.patientCount}</td> : <td>LKR {day.revenue.toFixed(2)}</td>}
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className={styles.totalRow}>
                                        <td>
                                            <strong>Total</strong>
                                        </td>
                                        {reportType === "patient-flow" ? (
                                            <td>
                                                <strong>{getTotalPatients()}</strong>
                                            </td>
                                        ) : (
                                            <td>
                                                <strong>LKR {getTotalRevenue().toFixed(2)}</strong>
                                            </td>
                                        )}
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Empty State */}
            {!reportData && !loading && !error && (
                <div className={styles.empty}>
                    <p>📊 Select dates and generate a report to view analytics</p>
                </div>
            )}
        </div>
    );
}

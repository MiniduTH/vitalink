"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Patient, HealthRecord, Appointment, Payment } from "@/lib/types";
import styles from "./page.module.css";

interface PatientDetailProps {
    params: { id: string };
}

export default function PatientDetailPage({ params }: PatientDetailProps) {
    const router = useRouter();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"info" | "health" | "appointments" | "billing">("info");

    useEffect(() => {
        fetchPatientData();
    }, [params.id]);

    const fetchPatientData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch patient info
            const patientRes = await fetch(`/api/patients/${params.id}`);
            if (!patientRes.ok) throw new Error("Failed to fetch patient");
            const patientData = await patientRes.json();
            if (!patientData.success) throw new Error(patientData.error);
            setPatient(patientData.data);

            // Fetch health record
            const healthRes = await fetch(`/api/patients/${params.id}/health-record`);
            if (healthRes.ok) {
                const healthData = await healthRes.json();
                if (healthData.success) setHealthRecord(healthData.data);
            }

            // Fetch appointments
            const appointmentsRes = await fetch(`/api/appointments?patientId=${params.id}`);
            if (appointmentsRes.ok) {
                const appointmentsData = await appointmentsRes.json();
                if (appointmentsData.success) setAppointments(appointmentsData.data);
            }

            // Fetch payments
            const paymentsRes = await fetch(`/api/billing?patientId=${params.id}`);
            if (paymentsRes.ok) {
                const paymentsData = await paymentsRes.json();
                if (paymentsData.success) setPayments(paymentsData.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load patient data");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    const formatDateTime = (timestamp: any) => {
        if (!timestamp) return "N/A";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleString();
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case "Completed":
            case "Paid":
                return styles.badgeSuccess;
            case "Scheduled":
            case "Confirmed":
            case "Pending":
                return styles.badgePending;
            case "Cancelled":
            case "Failed":
                return styles.badgeDanger;
            case "CheckedIn":
                return styles.badgeInfo;
            default:
                return styles.badgeDefault;
        }
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading patient data...</p>
                </div>
            </div>
        );
    }

    if (error || !patient) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <p>{error || "Patient not found"}</p>
                    <button onClick={() => router.push("/patients")}>Back to Patients</button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <button className={styles.btnBack} onClick={() => router.push("/patients")}>
                        ← Back
                    </button>
                    <h1 className={styles.title}>
                        {patient.firstName} {patient.lastName}
                    </h1>
                    <p className={styles.subtitle}>Patient ID: {patient.id}</p>
                </div>
                <button className={styles.btnEdit} onClick={() => router.push(`/patients/${patient.id}/edit`)}>
                    Edit Patient
                </button>
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === "info" ? styles.tabActive : ""}`} onClick={() => setActiveTab("info")}>
                    Personal Info
                </button>
                <button className={`${styles.tab} ${activeTab === "health" ? styles.tabActive : ""}`} onClick={() => setActiveTab("health")}>
                    Health Record
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "appointments" ? styles.tabActive : ""}`}
                    onClick={() => setActiveTab("appointments")}
                >
                    Appointments ({appointments.length})
                </button>
                <button className={`${styles.tab} ${activeTab === "billing" ? styles.tabActive : ""}`} onClick={() => setActiveTab("billing")}>
                    Billing ({payments.length})
                </button>
            </div>

            {/* Tab Content */}
            <div className={styles.content}>
                {/* Personal Info Tab */}
                {activeTab === "info" && (
                    <div className={styles.infoGrid}>
                        <div className={styles.infoCard}>
                            <h3>Contact Information</h3>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Email:</span>
                                <span className={styles.infoValue}>{patient.email}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Phone:</span>
                                <span className={styles.infoValue}>{patient.contactNumber}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Address:</span>
                                <span className={styles.infoValue}>{patient.address || "N/A"}</span>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <h3>Personal Details</h3>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Date of Birth:</span>
                                <span className={styles.infoValue}>{formatDate(patient.dateOfBirth)}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Gender:</span>
                                <span className={styles.infoValue}>{patient.gender}</span>
                            </div>
                        </div>

                        <div className={styles.infoCard}>
                            <h3>Emergency Contact</h3>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Name:</span>
                                <span className={styles.infoValue}>{patient.emergencyContact.name}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Relationship:</span>
                                <span className={styles.infoValue}>{patient.emergencyContact.relationship}</span>
                            </div>
                            <div className={styles.infoItem}>
                                <span className={styles.infoLabel}>Phone:</span>
                                <span className={styles.infoValue}>{patient.emergencyContact.phone}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Health Record Tab */}
                {activeTab === "health" && (
                    <div className={styles.healthRecord}>
                        {healthRecord ? (
                            <>
                                <div className={styles.infoCard}>
                                    <h3>Medical Information</h3>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Blood Type:</span>
                                        <span className={styles.infoValue}>{healthRecord.bloodType || "Not recorded"}</span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Allergies:</span>
                                        <span className={styles.infoValue}>
                                            {healthRecord.allergies.length > 0 ? healthRecord.allergies.join(", ") : "None"}
                                        </span>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <span className={styles.infoLabel}>Chronic Conditions:</span>
                                        <span className={styles.infoValue}>
                                            {healthRecord.chronicConditions.length > 0 ? healthRecord.chronicConditions.join(", ") : "None"}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.encounters}>
                                    <h3>Medical Encounters ({healthRecord.encounters.length})</h3>
                                    {healthRecord.encounters.length === 0 ? (
                                        <p className={styles.emptyText}>No encounters recorded</p>
                                    ) : (
                                        <div className={styles.encounterList}>
                                            {healthRecord.encounters.map((encounter, index) => (
                                                <div key={index} className={styles.encounterCard}>
                                                    <div className={styles.encounterHeader}>
                                                        <span className={styles.encounterDate}>{formatDateTime(encounter.date)}</span>
                                                        <span className={styles.encounterDoctor}>Dr. {encounter.doctorId}</span>
                                                    </div>
                                                    {encounter.diagnosis && (
                                                        <p className={styles.encounterDiagnosis}>
                                                            <strong>Diagnosis:</strong> {encounter.diagnosis}
                                                        </p>
                                                    )}
                                                    {encounter.medicalNotes && (
                                                        <p className={styles.encounterNotes}>
                                                            <strong>Medical Notes:</strong> {encounter.medicalNotes}
                                                        </p>
                                                    )}
                                                    {encounter.labResults && encounter.labResults.length > 0 && (
                                                        <p className={styles.encounterLab}>
                                                            <strong>Lab Results:</strong> {encounter.labResults.join(", ")}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <p className={styles.emptyText}>No health record available</p>
                        )}
                    </div>
                )}

                {/* Appointments Tab */}
                {activeTab === "appointments" && (
                    <div className={styles.listView}>
                        {appointments.length === 0 ? (
                            <p className={styles.emptyText}>No appointments found</p>
                        ) : (
                            <div className={styles.cardList}>
                                {appointments.map((appointment) => (
                                    <div key={appointment.id} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <span className={styles.cardDate}>{formatDate(appointment.appointmentDate)}</span>
                                            <span className={`${styles.badge} ${getStatusBadgeClass(appointment.status)}`}>{appointment.status}</span>
                                        </div>
                                        <div className={styles.cardBody}>
                                            <p className={styles.cardDetail}>
                                                <strong>Time:</strong> {appointment.timeSlot}
                                            </p>
                                            <p className={styles.cardDetail}>
                                                <strong>Reason:</strong> {appointment.reason}
                                            </p>
                                            <p className={styles.cardDetail}>
                                                <strong>Doctor:</strong> {appointment.doctorId}
                                            </p>
                                            {appointment.notes && (
                                                <p className={styles.cardDetail}>
                                                    <strong>Notes:</strong> {appointment.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Billing Tab */}
                {activeTab === "billing" && (
                    <div className={styles.listView}>
                        {payments.length === 0 ? (
                            <p className={styles.emptyText}>No billing records found</p>
                        ) : (
                            <div className={styles.cardList}>
                                {payments.map((payment) => (
                                    <div key={payment.id} className={styles.card}>
                                        <div className={styles.cardHeader}>
                                            <span className={styles.cardDate}>{formatDateTime(payment.createdAt)}</span>
                                            <span className={`${styles.badge} ${getStatusBadgeClass(payment.status)}`}>{payment.status}</span>
                                        </div>
                                        <div className={styles.cardBody}>
                                            <p className={styles.cardDetail}>
                                                <strong>Total Amount:</strong> LKR {payment.amount.toFixed(2)}
                                            </p>
                                            <p className={styles.cardDetail}>
                                                <strong>Insurance Coverage:</strong> LKR {payment.insuranceCoverage.toFixed(2)}
                                            </p>
                                            <p className={styles.cardDetail}>
                                                <strong>Patient Portion:</strong> LKR {payment.patientPortion.toFixed(2)}
                                            </p>
                                            {payment.paymentMethod && (
                                                <p className={styles.cardDetail}>
                                                    <strong>Payment Method:</strong> {payment.paymentMethod}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

"use client";

import React, { useState, useEffect } from "react";
import styles from "./dashboard.module.css";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { AppointmentRepository } from "@/lib/firestore/repositories/AppointmentRepository";
import { PatientRepository } from "@/lib/firestore/repositories/PatientRepository";
import { PaymentRepository } from "@/lib/firestore/repositories/PaymentRepository";
import { AppointmentService } from "@/lib/services/AppointmentService";
import { NotificationService } from "@/lib/services/NotificationService";
import { Appointment, Patient } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

// Initialize services at module level
const appointmentRepo = new AppointmentRepository();
const patientRepo = new PatientRepository();
const paymentRepo = new PaymentRepository();
const notificationService = new NotificationService();
const appointmentService = new AppointmentService(appointmentRepo, notificationService);

interface DashboardStats {
    todayAppointments: number;
    totalPatients: number;
    pendingBills: number;
    availableRooms: number;
}

interface TodayAppointment {
    id: string;
    patientId: string;
    patientName: string;
    time: string;
    doctor: string;
    status: "Scheduled" | "Confirmed" | "CheckedIn" | "Completed" | "Cancelled";
    reason: string;
    appointmentDate: Timestamp;
}

export default function StaffDashboard() {
    const { user, loading: authLoading, userData } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        todayAppointments: 0,
        totalPatients: 0,
        pendingBills: 0,
        availableRooms: 0,
    });
    const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
    const [patients, setPatients] = useState<Map<string, Patient>>(new Map());

    useEffect(() => {
        // Redirect if not authenticated or not staff
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        // if (!authLoading && userData?.userType !== "staff") {
        //     router.push("/dashboard");
        //     return;
        // }

        // Fetch data when user is available
        if (user && userData) {
            fetchDashboardData();
        }
    }, [user, userData, authLoading, router]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch all appointments
            const allAppointments = await appointmentRepo.findAll({ limit: 1000 });

            // Get today's date range (start and end of day)
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStart = Timestamp.fromDate(today);

            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const todayEnd = Timestamp.fromDate(tomorrow);

            // Filter today's appointments
            const todaysAppointments = allAppointments.filter((apt) => {
                const aptDate = apt.appointmentDate.toMillis();
                return aptDate >= todayStart.toMillis() && aptDate < todayEnd.toMillis();
            });

            // Fetch all patients
            const allPatients = await patientRepo.findAll({ limit: 10000 });
            const patientMap = new Map<string, Patient>();
            allPatients.forEach((patient) => {
                patientMap.set(patient.id, patient);
            });
            setPatients(patientMap);

            // Fetch all payments
            const allPayments = await paymentRepo.findAll();
            const pendingPayments = allPayments.filter((p) => p.status === "Pending");

            // Map appointments to TodayAppointment format with patient names
            const mappedAppointments: TodayAppointment[] = todaysAppointments
                .map((apt) => {
                    const patient = patientMap.get(apt.patientId);
                    return {
                        id: apt.id,
                        patientId: apt.patientId,
                        patientName: patient ? `${patient.firstName} ${patient.lastName}` : "Unknown Patient",
                        time: apt.timeSlot,
                        doctor: getDoctorName(apt.doctorId),
                        status: apt.status,
                        reason: apt.reason,
                        appointmentDate: apt.appointmentDate,
                    };
                })
                .sort((a, b) => {
                    // Sort by time slot
                    return a.time.localeCompare(b.time);
                });

            setTodayAppointments(mappedAppointments);

            // Update stats
            setStats({
                todayAppointments: todaysAppointments.length,
                totalPatients: allPatients.length,
                pendingBills: pendingPayments.length,
                availableRooms: 12, // Keep as static or implement room management
            });
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            setError("Failed to load dashboard data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const getDoctorName = (doctorId: string) => {
        const doctors: Record<string, string> = {
            "doc-sarah": "Dr. Sarah Johnson",
            "doc-michael": "Dr. Michael Chen",
            "doc-emily": "Dr. Emily Williams",
        };
        return doctors[doctorId] || doctorId;
    };

    const handleCheckIn = async (appointmentId: string) => {
        try {
            // Update appointment status to CheckedIn using the service
            await appointmentService.checkIn(appointmentId);

            // Refresh dashboard data
            await fetchDashboardData();

            alert("Patient checked in successfully!");
        } catch (err: any) {
            console.error("Error checking in patient:", err);
            alert(err.message || "Failed to check in patient. Please try again.");
        }
    };

    const getStatusClass = (status: string) => {
        return status.toLowerCase().replace(/\s+/g, "");
    };

    if (loading || authLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading your dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <p>{error}</p>
                    <button onClick={fetchDashboardData} className={styles.retryBtn}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Staff Dashboard</h1>
                <p className={styles.subtitle}>Welcome back! Here's what's happening today.</p>
            </header>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>📅</div>
                    <div className={styles.statContent}>
                        <h3 className={styles.statValue}>{stats.todayAppointments}</h3>
                        <p className={styles.statLabel}>Today's Appointments</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>👥</div>
                    <div className={styles.statContent}>
                        <h3 className={styles.statValue}>{stats.totalPatients}</h3>
                        <p className={styles.statLabel}>Total Patients</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>💳</div>
                    <div className={styles.statContent}>
                        <h3 className={styles.statValue}>{stats.pendingBills}</h3>
                        <p className={styles.statLabel}>Pending Bills</p>
                    </div>
                </div>

                <div className={styles.statCard}>
                    <div className={styles.statIcon}>🏥</div>
                    <div className={styles.statContent}>
                        <h3 className={styles.statValue}>{stats.availableRooms}</h3>
                        <p className={styles.statLabel}>Available Rooms</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Quick Actions</h2>
                <div className={styles.actionsGrid}>
                    <button className={styles.actionBtn} onClick={() => (window.location.href = "/staff/patients/new")}>
                        <span className={styles.actionIcon}>➕</span>
                        <span>Register Patient</span>
                    </button>
                    <button className={styles.actionBtn} onClick={() => (window.location.href = "/staff/patient-records")}>
                        <span className={styles.actionIcon}>�</span>
                        <span>Update Records</span>
                    </button>
                    <button className={styles.actionBtn} onClick={() => (window.location.href = "/staff/staff-billing")}>
                        <span className={styles.actionIcon}>💰</span>
                        <span>Process Payment</span>
                    </button>
                    <button className={styles.actionBtn} onClick={() => (window.location.href = "/staff/reports")}>
                        <span className={styles.actionIcon}>📊</span>
                        <span>View Reports</span>
                    </button>
                </div>
            </section>

            {/* Today's Appointments */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Today's Appointments</h2>
                    <a href="/staff/staff-appointments" className={styles.viewAllLink}>
                        View All →
                    </a>
                </div>

                <div className={styles.appointmentsList}>
                    {todayAppointments.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>📅</div>
                            <h3>No Appointments Today</h3>
                            <p>There are no scheduled appointments for today.</p>
                        </div>
                    ) : (
                        todayAppointments.map((appointment) => (
                            <div key={appointment.id} className={styles.appointmentCard}>
                                <div className={styles.appointmentTime}>
                                    <span className={styles.timeText}>{appointment.time}</span>
                                </div>

                                <div className={styles.appointmentDetails}>
                                    <div className={styles.appointmentHeader}>
                                        <h3 className={styles.patientName}>{appointment.patientName}</h3>
                                        <span className={`${styles.statusBadge} ${styles[getStatusClass(appointment.status)]}`}>
                                            {appointment.status}
                                        </span>
                                    </div>

                                    <div className={styles.appointmentInfo}>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Doctor:</span>
                                            <span className={styles.infoValue}>{appointment.doctor}</span>
                                        </div>
                                        <div className={styles.infoItem}>
                                            <span className={styles.infoLabel}>Reason:</span>
                                            <span className={styles.infoValue}>{appointment.reason}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.appointmentActions}>
                                    {(appointment.status === "Scheduled" || appointment.status === "Confirmed") && (
                                        <button
                                            className={`${styles.actionButton} ${styles.checkInBtn}`}
                                            onClick={() => handleCheckIn(appointment.id)}
                                        >
                                            Check In
                                        </button>
                                    )}
                                    {appointment.status === "CheckedIn" && (
                                        <button className={`${styles.actionButton} ${styles.startBtn}`}>Start Visit</button>
                                    )}
                                    {appointment.status === "Completed" && <span className={styles.completedText}>✓ Completed</span>}
                                    <button className={`${styles.actionButton} ${styles.viewBtn}`}>View Details</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>

            {/* System Status */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>System Status</h2>
                <div className={styles.statusGrid}>
                    <div className={styles.statusItem}>
                        <div className={styles.statusIndicator} style={{ background: "#10b981" }}></div>
                        <div>
                            <strong>Database</strong>
                            <p>Operational</p>
                        </div>
                    </div>
                    <div className={styles.statusItem}>
                        <div className={styles.statusIndicator} style={{ background: "#10b981" }}></div>
                        <div>
                            <strong>Payment Gateway</strong>
                            <p>Operational</p>
                        </div>
                    </div>
                    <div className={styles.statusItem}>
                        <div className={styles.statusIndicator} style={{ background: "#10b981" }}></div>
                        <div>
                            <strong>Appointment System</strong>
                            <p>Operational</p>
                        </div>
                    </div>
                    <div className={styles.statusItem}>
                        <div className={styles.statusIndicator} style={{ background: "#f59e0b" }}></div>
                        <div>
                            <strong>Email Notifications</strong>
                            <p>Maintenance</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

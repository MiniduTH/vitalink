"use client";

import React, { useState, useEffect } from "react";
import styles from "./dashboard.module.css";

interface DashboardStats {
    todayAppointments: number;
    totalPatients: number;
    pendingBills: number;
    availableRooms: number;
}

interface TodayAppointment {
    id: string;
    patientName: string;
    time: string;
    doctor: string;
    status: "Scheduled" | "Checked-In" | "In-Progress" | "Completed";
    type: string;
}

export default function StaffDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        todayAppointments: 0,
        totalPatients: 0,
        pendingBills: 0,
        availableRooms: 0,
    });
    const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);

    useEffect(() => {
        // TODO: Replace with actual API calls
        setTimeout(() => {
            setStats({
                todayAppointments: 24,
                totalPatients: 1247,
                pendingBills: 18,
                availableRooms: 12,
            });

            setTodayAppointments([
                {
                    id: "apt001",
                    patientName: "John Doe",
                    time: "09:00 AM",
                    doctor: "Dr. Sarah Wilson",
                    status: "Completed",
                    type: "General Checkup",
                },
                {
                    id: "apt002",
                    patientName: "Jane Smith",
                    time: "09:30 AM",
                    doctor: "Dr. Michael Chen",
                    status: "In-Progress",
                    type: "Cardiology",
                },
                {
                    id: "apt003",
                    patientName: "Robert Johnson",
                    time: "10:00 AM",
                    doctor: "Dr. Sarah Wilson",
                    status: "Checked-In",
                    type: "Follow-up",
                },
                {
                    id: "apt004",
                    patientName: "Emily Davis",
                    time: "10:30 AM",
                    doctor: "Dr. Priya Sharma",
                    status: "Scheduled",
                    type: "Orthopedics",
                },
                {
                    id: "apt005",
                    patientName: "David Williams",
                    time: "11:00 AM",
                    doctor: "Dr. Michael Chen",
                    status: "Scheduled",
                    type: "Cardiology",
                },
            ]);

            setLoading(false);
        }, 500);
    }, []);

    const handleCheckIn = (appointmentId: string) => {
        // TODO: Implement check-in API call
        alert(`Check-in for appointment ${appointmentId}`);
        setTodayAppointments(todayAppointments.map((apt) => (apt.id === appointmentId ? { ...apt, status: "Checked-In" as const } : apt)));
    };

    const getStatusClass = (status: string) => {
        return status.toLowerCase().replace(/\s+/g, "");
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading your dashboard...</p>
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
                    <button className={styles.actionBtn} onClick={() => (window.location.href = "/staff/staff-appointments")}>
                        <span className={styles.actionIcon}>📅</span>
                        <span>Manage Appointments</span>
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
                    {todayAppointments.map((appointment) => (
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
                                        <span className={styles.infoLabel}>Type:</span>
                                        <span className={styles.infoValue}>{appointment.type}</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.appointmentActions}>
                                {appointment.status === "Scheduled" && (
                                    <button className={`${styles.actionButton} ${styles.checkInBtn}`} onClick={() => handleCheckIn(appointment.id)}>
                                        Check In
                                    </button>
                                )}
                                {appointment.status === "Checked-In" && (
                                    <button className={`${styles.actionButton} ${styles.startBtn}`}>Start Visit</button>
                                )}
                                {appointment.status === "In-Progress" && (
                                    <button className={`${styles.actionButton} ${styles.completeBtn}`}>Complete</button>
                                )}
                                <button className={`${styles.actionButton} ${styles.viewBtn}`}>View Details</button>
                            </div>
                        </div>
                    ))}
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

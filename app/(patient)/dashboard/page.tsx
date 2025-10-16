"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import styles from "./dashboard.module.css";
import Link from "next/link";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { AppointmentRepository } from "@/lib/firestore/repositories/AppointmentRepository";
import { AppointmentService } from "@/lib/services/AppointmentService";
import { NotificationService } from "@/lib/services/NotificationService";
import { PaymentRepository } from "@/lib/firestore/repositories/PaymentRepository";
import { Appointment } from "@/lib/types";

interface DashboardStats {
    todayAppointments: number;
    completedToday: number;
    upcomingAppointments: number;
    pendingBills: number;
}

// Initialize services at module level
const appointmentRepo = new AppointmentRepository();
const notificationService = new NotificationService();
const appointmentService = new AppointmentService(appointmentRepo, notificationService);
const paymentRepo = new PaymentRepository();

export default function PatientDashboard() {
    const { user, loading: authLoading, userData } = useAuth();
    const router = useRouter();

    const [stats, setStats] = useState<DashboardStats>({
        todayAppointments: 0,
        completedToday: 0,
        upcomingAppointments: 0,
        pendingBills: 0,
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Redirect if not authenticated
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        // Fetch real stats when user is available
        if (user && userData) {
            fetchDashboardStats();
        }
    }, [user, userData, authLoading, router]);

    const fetchDashboardStats = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch all appointments for the patient
            const appointments = await appointmentService.getPatientAppointments(user.uid);

            // Calculate today's date at midnight for comparison
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            // Today's appointments (any status except cancelled)
            const todayApts = appointments.filter((apt: Appointment) => {
                const aptDate = apt.appointmentDate.toDate();
                aptDate.setHours(0, 0, 0, 0);
                return aptDate.getTime() === today.getTime() && apt.status !== "Cancelled";
            });

            // Completed today
            const completedToday = todayApts.filter((apt: Appointment) => apt.status === "Completed");

            // Upcoming appointments (future dates, not completed/cancelled)
            const upcoming = appointments.filter((apt: Appointment) => {
                const aptDate = apt.appointmentDate.toDate();
                aptDate.setHours(0, 0, 0, 0);
                return aptDate.getTime() >= today.getTime() && apt.status !== "Completed" && apt.status !== "Cancelled";
            });

            // Fetch pending bills
            const payments = await paymentRepo.findByPatientId(user.uid);
            const pending = payments.filter((p) => p.status === "Pending");

            setStats({
                todayAppointments: todayApts.length,
                completedToday: completedToday.length,
                upcomingAppointments: upcoming.length,
                pendingBills: pending.length,
            });
        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
            setError("Failed to load dashboard data. Please try again.");
        } finally {
            setLoading(false);
        }
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
                    <button onClick={fetchDashboardStats} className={styles.retryBtn}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Welcome back{userData ? `, ${userData.firstName}` : ""}!</h1>
                <p className={styles.subtitle}>Here's your health overview for today</p>
            </header>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <StatCard value={stats.todayAppointments.toString()} label="Today's Appointments" variant="pink" icon="📅" />
                <StatCard value={stats.completedToday.toString()} label="Completed" variant="green" icon="✓" />
                <StatCard value={stats.upcomingAppointments.toString()} label="Upcoming" variant="blue" icon="⏰" />
                <StatCard value={stats.pendingBills.toString()} label="Pending Bills" variant="teal" icon="💳" />
            </div>

            {/* Quick Actions */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Quick Actions</h2>
                <div className={styles.actionsGrid}>
                    <Link href="/appointments" className={styles.actionCard}>
                        <div className={styles.actionIcon}>📅</div>
                        <h3 className={styles.actionTitle}>Book Appointment</h3>
                        <p className={styles.actionDesc}>Schedule a visit with your doctor</p>
                    </Link>

                    <Link href="/health-records" className={styles.actionCard}>
                        <div className={styles.actionIcon}>📋</div>
                        <h3 className={styles.actionTitle}>View Records</h3>
                        <p className={styles.actionDesc}>Access your medical history</p>
                    </Link>

                    <Link href="/billing" className={styles.actionCard}>
                        <div className={styles.actionIcon}>💳</div>
                        <h3 className={styles.actionTitle}>Pay Bills</h3>
                        <p className={styles.actionDesc}>Review and pay bills online</p>
                    </Link>

                    <Link href="/profile" className={styles.actionCard}>
                        <div className={styles.actionIcon}>👤</div>
                        <h3 className={styles.actionTitle}>Update Profile</h3>
                        <p className={styles.actionDesc}>Manage personal information</p>
                    </Link>
                </div>
            </section>
        </div>
    );
}

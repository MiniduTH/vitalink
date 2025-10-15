"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { SearchBar } from "@/components/SearchBar";
import styles from "./dashboard.module.css";
import Link from "next/link";

interface DashboardStats {
    todayAppointments: number;
    completedToday: number;
    upcomingAppointments: number;
    pendingBills: number;
}

export default function PatientDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        todayAppointments: 0,
        completedToday: 0,
        upcomingAppointments: 0,
        pendingBills: 0,
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // TODO: Replace with actual API call
        // Simulating API call
        setTimeout(() => {
            setStats({
                todayAppointments: 23,
                completedToday: 3,
                upcomingAppointments: 12,
                pendingBills: 2,
            });

            setLoading(false);
        }, 500);
    }, []);

    const handleSearch = (query?: string) => {
        console.log("Searching for:", query || searchQuery);
        // TODO: Implement search functionality
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
                <h1 className={styles.title}>Welcome back!</h1>
                <p className={styles.subtitle}>Here's your health overview for today</p>
            </header>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <StatCard value={stats.todayAppointments.toString()} label="Today's Appointments" variant="pink" icon="📅" />
                <StatCard value={stats.completedToday.toString()} label="Completed" variant="green" icon="✓" />
                <StatCard value={stats.upcomingAppointments.toString()} label="Upcoming" variant="blue" icon="⏰" />
                <StatCard value={stats.pendingBills.toString()} label="Pending Bills" variant="teal" icon="💳" />
            </div>

            {/* Search Bar */}
            <div className={styles.searchSection}>
                <SearchBar
                    placeholder="Search appointments, doctors, records..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSearch={handleSearch}
                />
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

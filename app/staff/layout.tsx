"use client";

import React from "react";
import { usePathname } from "next/navigation";
import styles from "./layout.module.css";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const isActive = (path: string) => {
        return pathname === path || pathname.startsWith(path + "/");
    };

    return (
        <div className={styles.layout}>
            {/* Desktop Sidebar */}
            <nav className={styles.sidebar}>
                <div className={styles.logo}>
                    <h1>Vitalink</h1>
                    <span className={styles.badge}>Staff</span>
                </div>

                <div className={styles.navLinks}>
                    <a href="/staff/staff-dashboard" className={`${styles.navLink} ${isActive("/staff/staff-dashboard") ? styles.active : ""}`}>
                        <span className={styles.icon}>📊</span>
                        <span className={styles.label}>Dashboard</span>
                    </a>
                    <a href="/staff/patients" className={`${styles.navLink} ${isActive("/staff/patients") ? styles.active : ""}`}>
                        <span className={styles.icon}>👥</span>
                        <span className={styles.label}>Patients</span>
                    </a>
                    <a href="/staff/staff-appointments" className={`${styles.navLink} ${isActive("/staff/staff-appointments") ? styles.active : ""}`}>
                        <span className={styles.icon}>📅</span>
                        <span className={styles.label}>Appointments</span>
                    </a>
                    <a href="/staff/staff-billing" className={`${styles.navLink} ${isActive("/staff/staff-billing") ? styles.active : ""}`}>
                        <span className={styles.icon}>💳</span>
                        <span className={styles.label}>Billing</span>
                    </a>
                    <a href="/staff/reports" className={`${styles.navLink} ${isActive("/staff/reports") ? styles.active : ""}`}>
                        <span className={styles.icon}>📈</span>
                        <span className={styles.label}>Reports</span>
                    </a>
                </div>

                <button className={styles.logoutBtn}>
                    <span className={styles.icon}>🚪</span>
                    <span className={styles.label}>Logout</span>
                </button>
            </nav>

            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <h1 className={styles.mobileLogo}>Vitalink</h1>
                <button className={styles.menuBtn}>☰</button>
            </header>

            {/* Bottom Navigation (Mobile) */}
            <nav className={styles.bottomNav}>
                <a href="/staff/staff-dashboard" className={`${styles.bottomNavItem} ${isActive("/staff/staff-dashboard") ? styles.active : ""}`}>
                    <span className={styles.icon}>📊</span>
                    <span className={styles.label}>Dashboard</span>
                </a>
                <a href="/staff/patients" className={`${styles.bottomNavItem} ${isActive("/staff/patients") ? styles.active : ""}`}>
                    <span className={styles.icon}>👥</span>
                    <span className={styles.label}>Patients</span>
                </a>
                <a
                    href="/staff/staff-appointments"
                    className={`${styles.bottomNavItem} ${isActive("/staff/staff-appointments") ? styles.active : ""}`}
                >
                    <span className={styles.icon}>📅</span>
                    <span className={styles.label}>Appointments</span>
                </a>
                <a href="/staff/staff-billing" className={`${styles.bottomNavItem} ${isActive("/staff/staff-billing") ? styles.active : ""}`}>
                    <span className={styles.icon}>💳</span>
                    <span className={styles.label}>Billing</span>
                </a>
                <a href="/staff/reports" className={`${styles.bottomNavItem} ${isActive("/staff/reports") ? styles.active : ""}`}>
                    <span className={styles.icon}>📈</span>
                    <span className={styles.label}>Reports</span>
                </a>
            </nav>

            {/* Main Content */}
            <main className={styles.main}>{children}</main>
        </div>
    );
}

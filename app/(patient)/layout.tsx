"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./patient-layout.module.css";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: "📊" },
        { path: "/appointments", label: "Appointments", icon: "📅" },
        { path: "/health-records", label: "Records", icon: "📋" },
        { path: "/billing", label: "Billing", icon: "💰" },
        { path: "/profile", label: "Profile", icon: "👤" },
    ];

    return (
        <div className={styles.layout}>
            {/* Desktop Sidebar */}
            <nav className={styles.sidebar}>
                <div className={styles.logo}>
                    <h1>Vitalink</h1>
                    <span className={styles.badge}>Patient</span>
                </div>
                <div className={styles.navLinks}>
                    {navItems.map((item) => (
                        <Link key={item.path} href={item.path} className={`${styles.navLink} ${isActive(item.path) ? styles.active : ""}`}>
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.label}>{item.label}</span>
                        </Link>
                    ))}
                </div>
                <button className={styles.logoutBtn}>
                    <span className={styles.icon}>🚪</span>
                    <span className={styles.label}>Logout</span>
                </button>
            </nav>

            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <h1 className={styles.mobileLogo}>Vitalink</h1>
                <button className={styles.menuBtn} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? "✕" : "☰"}
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className={styles.mobileOverlay} onClick={() => setIsMobileMenuOpen(false)}>
                    <div className={styles.mobileMenu} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.mobileMenuHeader}>
                            <h2>Menu</h2>
                            <button onClick={() => setIsMobileMenuOpen(false)}>✕</button>
                        </div>
                        <div className={styles.mobileNavLinks}>
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    href={item.path}
                                    className={`${styles.mobileNavLink} ${isActive(item.path) ? styles.active : ""}`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <span className={styles.icon}>{item.icon}</span>
                                    <span>{item.label}</span>
                                </Link>
                            ))}
                        </div>
                        <button className={styles.mobileLogoutBtn} onClick={() => setIsMobileMenuOpen(false)}>
                            <span className={styles.icon}>🚪</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Navigation */}
            <nav className={styles.bottomNav}>
                {navItems.slice(0, 5).map((item) => (
                    <Link key={item.path} href={item.path} className={`${styles.bottomNavItem} ${isActive(item.path) ? styles.active : ""}`}>
                        <span className={styles.icon}>{item.icon}</span>
                        <span className={styles.label}>{item.label}</span>
                    </Link>
                ))}
            </nav>

            <main className={styles.main}>{children}</main>
        </div>
    );
}

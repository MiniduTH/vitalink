import React from "react";
import styles from "./auth-layout.module.css";

export const metadata = {
    title: "Vitalink - Authentication",
    description: "Login or register for Vitalink Healthcare System",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className={styles.layout}>
            <div className={styles.container}>
                <div className={styles.branding}>
                    <div className={styles.logo}>
                        <h1 className={styles.logoText}>Vitalink</h1>
                        <p className={styles.tagline}>Smart Healthcare System</p>
                    </div>
                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>🏥</span>
                            <div>
                                <h3>Modern Healthcare</h3>
                                <p>Access your health records anytime, anywhere</p>
                            </div>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>📅</span>
                            <div>
                                <h3>Easy Appointments</h3>
                                <p>Book and manage appointments online</p>
                            </div>
                        </div>
                        <div className={styles.feature}>
                            <span className={styles.featureIcon}>💳</span>
                            <div>
                                <h3>Secure Billing</h3>
                                <p>Transparent pricing and easy payments</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className={styles.formContainer}>{children}</div>
            </div>
            <footer className={styles.footer}>
                <p>&copy; 2025 Vitalink. All rights reserved.</p>
            </footer>
        </div>
    );
}

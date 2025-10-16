import Link from "next/link";
import styles from "./page.module.css";

export const metadata = {
    title: "Vitalink - Smart Healthcare System",
    description: "Modern healthcare management platform for patients and medical professionals",
};

export default function LandingPage() {
    return (
        <div className={styles.landing}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>
                        Welcome to <span className={styles.brand}>Vitalink</span>
                    </h1>
                    <p className={styles.heroSubtitle}>Your Complete Healthcare Management Solution</p>
                    <p className={styles.heroDescription}>
                        Streamline appointments, manage health records, and connect with healthcare providers seamlessly.
                    </p>
                    <div className={styles.heroCtas}>
                        <Link href="/register" className={`${styles.btn} ${styles.btnPrimary}`}>
                            Get Started
                        </Link>
                        <Link href="/login" className={`${styles.btn} ${styles.btnSecondary}`}>
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className={styles.features}>
                <h2 className={styles.sectionTitle}>Why Choose Vitalink?</h2>
                <div className={styles.featuresGrid}>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>📅</div>
                        <h3 className={styles.featureTitle}>Easy Appointments</h3>
                        <p className={styles.featureDescription}>Book, reschedule, and manage appointments with healthcare providers effortlessly.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>📋</div>
                        <h3 className={styles.featureTitle}>Health Records</h3>
                        <p className={styles.featureDescription}>
                            Access your complete medical history, lab results, and prescriptions in one place.
                        </p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>💳</div>
                        <h3 className={styles.featureTitle}>Billing & Insurance</h3>
                        <p className={styles.featureDescription}>Track payments, view invoices, and manage insurance claims seamlessly.</p>
                    </div>
                    <div className={styles.featureCard}>
                        <div className={styles.featureIcon}>🔒</div>
                        <h3 className={styles.featureTitle}>Secure & Private</h3>
                        <p className={styles.featureDescription}>Your health data is protected with enterprise-grade security and encryption.</p>
                    </div>
                </div>
            </section>

            {/* Portals Section */}
            <section className={styles.portals}>
                <h2 className={styles.sectionTitle}>Access Your Portal</h2>
                <div className={styles.portalsGrid}>
                    <div className={styles.portalCard}>
                        <div className={styles.portalIcon}>👤</div>
                        <h3 className={styles.portalTitle}>Patient Portal</h3>
                        <p className={styles.portalDescription}>Manage your health journey with easy access to appointments, records, and billing.</p>
                        <div className={styles.portalActions}>
                            <Link href="/login" className={`${styles.btn} ${styles.btnOutline}`}>
                                Patient Sign In
                            </Link>
                            <Link href="/register" className={styles.link}>
                                New Patient? Register
                            </Link>
                        </div>
                    </div>
                    <div className={styles.portalCard}>
                        <div className={styles.portalIcon}>👨‍⚕️</div>
                        <h3 className={styles.portalTitle}>Staff Portal</h3>
                        <p className={styles.portalDescription}>Streamline patient care with comprehensive tools for medical professionals.</p>
                        <div className={styles.portalActions}>
                            <Link href="/login" className={`${styles.btn} ${styles.btnOutline}`}>
                                Staff Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className={styles.stats}>
                <div className={styles.statsGrid}>
                    <div className={styles.statBox}>
                        <div className={styles.statNumber}>10K+</div>
                        <div className={styles.statLabel}>Active Patients</div>
                    </div>
                    <div className={styles.statBox}>
                        <div className={styles.statNumber}>500+</div>
                        <div className={styles.statLabel}>Healthcare Providers</div>
                    </div>
                    <div className={styles.statBox}>
                        <div className={styles.statNumber}>50K+</div>
                        <div className={styles.statLabel}>Appointments Completed</div>
                    </div>
                    <div className={styles.statBox}>
                        <div className={styles.statNumber}>99.9%</div>
                        <div className={styles.statLabel}>Uptime</div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className={styles.footer}>
                <div className={styles.footerContent}>
                    <div className={styles.footerBrand}>
                        <h3 className={styles.footerTitle}>Vitalink</h3>
                        <p className={styles.footerTagline}>Healthcare, Simplified</p>
                    </div>
                    <div className={styles.footerLinks}>
                        <div className={styles.footerSection}>
                            <h4 className={styles.footerHeading}>Product</h4>
                            <Link href="/login" className={styles.footerLink}>
                                Sign In
                            </Link>
                            <Link href="/register" className={styles.footerLink}>
                                Register
                            </Link>
                        </div>
                        <div className={styles.footerSection}>
                            <h4 className={styles.footerHeading}>Support</h4>
                            <a href="#" className={styles.footerLink}>
                                Help Center
                            </a>
                            <a href="#" className={styles.footerLink}>
                                Contact Us
                            </a>
                        </div>
                        <div className={styles.footerSection}>
                            <h4 className={styles.footerHeading}>Legal</h4>
                            <a href="#" className={styles.footerLink}>
                                Privacy Policy
                            </a>
                            <a href="#" className={styles.footerLink}>
                                Terms of Service
                            </a>
                        </div>
                    </div>
                </div>
                <div className={styles.footerBottom}>
                    <p className={styles.copyright}>© {new Date().getFullYear()} Vitalink. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

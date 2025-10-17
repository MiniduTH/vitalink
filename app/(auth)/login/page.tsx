"use client";

import { auth, db } from "@/lib/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import React, { Suspense, useEffect, useState } from "react";
import styles from "./login.module.css";

// Separate component for handling search params
function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        userType: "patient" as "patient" | "staff",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Check for registration success message
    useEffect(() => {
        if (searchParams?.get("registered") === "true") {
            setSuccessMessage("Registration successful! Please log in with your credentials.");
        }
    }, [searchParams]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        setError(""); // Clear error on input change
        setSuccessMessage(""); // Clear success message on input change
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Validation
        if (!formData.email || !formData.password) {
            setError("Please fill in all fields");
            setLoading(false);
            return;
        }

        if (!formData.email.includes("@")) {
            setError("Please enter a valid email address");
            setLoading(false);
            return;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        try {
            // Firebase Authentication
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // Verify user type matches selection
            let actualUserType: "patient" | "staff" | null = null;

            // Check if user is a patient
            const patientRef = doc(db, "patients", user.uid);
            const patientDoc = await getDoc(patientRef);

            if (patientDoc.exists()) {
                actualUserType = "patient";
            } else {
                // Check if user is staff
                const staffRef = doc(db, "staff", user.uid);
                const staffDoc = await getDoc(staffRef);

                if (staffDoc.exists()) {
                    actualUserType = "staff";
                }
            }

            // Verify the user type matches what they selected
            if (!actualUserType) {
                setError("User profile not found. Please contact support.");
                await auth.signOut();
                setLoading(false);
                return;
            }

            if (actualUserType !== formData.userType) {
                setError(`This account is registered as a ${actualUserType}. Please select the correct user type.`);
                await auth.signOut();
                setLoading(false);
                return;
            }

            // Redirect based on actual user type
            if (actualUserType === "patient") {
                router.push("/dashboard");
            } else {
                router.push("/staff/staff-dashboard");
            }
        } catch (err: any) {
            console.error("Login error:", err);

            // Handle Firebase auth errors
            if (err.code === "auth/user-not-found") {
                setError("No account found with this email");
            } else if (err.code === "auth/wrong-password") {
                setError("Incorrect password");
            } else if (err.code === "auth/invalid-email") {
                setError("Invalid email address");
            } else if (err.code === "auth/too-many-requests") {
                setError("Too many failed attempts. Please try again later");
            } else {
                setError(err.message || "Login failed. Please try again");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Welcome Back</h1>
                <p className={styles.subtitle}>Sign in to access your account</p>
            </div>

            {successMessage && (
                <div className={styles.successAlert}>
                    <span className={styles.successIcon}>✓</span>
                    <span>{successMessage}</span>
                </div>
            )}

            {error && (
                <div className={styles.errorAlert}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* User Type Selection */}
                <div className={styles.userTypeSelector}>
                    <button
                        type="button"
                        className={`${styles.userTypeBtn} ${formData.userType === "patient" ? styles.active : ""}`}
                        onClick={() => setFormData({ ...formData, userType: "patient" })}
                    >
                        <span className={styles.userTypeIcon}>👤</span>
                        <span>Patient</span>
                    </button>
                    <button
                        type="button"
                        className={`${styles.userTypeBtn} ${formData.userType === "staff" ? styles.active : ""}`}
                        onClick={() => setFormData({ ...formData, userType: "staff" })}
                    >
                        <span className={styles.userTypeIcon}>👨‍⚕️</span>
                        <span>Staff</span>
                    </button>
                </div>

                {/* Email Field */}
                <div className={styles.formField}>
                    <label htmlFor="email" className={styles.label}>
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="john.doe@example.com"
                        required
                    />
                </div>

                {/* Password Field */}
                <div className={styles.formField}>
                    <label htmlFor="password" className={styles.label}>
                        Password
                    </label>
                    <div className={styles.passwordContainer}>
                        <input
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={styles.input}
                            placeholder="Enter your password"
                            required
                        />
                        <button
                            type="button"
                            className={styles.passwordToggle}
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                        >
                            {showPassword ? "👁️" : "👁️‍🗨️"}
                        </button>
                    </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className={styles.formOptions}>
                    <label className={styles.checkboxLabel}>
                        <input type="checkbox" className={styles.checkbox} />
                        <span>Remember me</span>
                    </label>
                    <a href="/forgot-password" className={styles.forgotLink}>
                        Forgot password?
                    </a>
                </div>

                {/* Submit Button */}
                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? (
                        <>
                            <span className={styles.spinner}></span>
                            <span>Signing in...</span>
                        </>
                    ) : (
                        "Sign In"
                    )}
                </button>
            </form>

            {/* Sign Up Link */}
            <div className={styles.footer}>
                <p>
                    Don't have an account?{" "}
                    <a href="/register" className={styles.signUpLink}>
                        Sign up
                    </a>
                </p>
            </div>
        </div>
    );
}

// Main page component with Suspense boundary
export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className={styles.container}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>Welcome Back</h1>
                        <p className={styles.subtitle}>Loading...</p>
                    </div>
                </div>
            }
        >
            <LoginForm />
        </Suspense>
    );
}

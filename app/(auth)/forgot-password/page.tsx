"use client";

import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import styles from "../login/login.module.css";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess(false);
        setLoading(true);

        // Validation
        if (!email) {
            setError("Please enter your email address");
            setLoading(false);
            return;
        }

        if (!email.includes("@")) {
            setError("Please enter a valid email address");
            setLoading(false);
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
        } catch (err: any) {
            console.error("Password reset error:", err);

            if (err.code === "auth/user-not-found") {
                setError("No account found with this email address");
            } else if (err.code === "auth/invalid-email") {
                setError("Invalid email address");
            } else if (err.code === "auth/too-many-requests") {
                setError("Too many requests. Please try again later");
            } else {
                setError(err.message || "Failed to send password reset email. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Check Your Email</h1>
                    <p className={styles.subtitle}>Password reset instructions have been sent</p>
                </div>

                <div className={styles.successAlert}>
                    <span className={styles.successIcon}>✓</span>
                    <span>
                        We've sent password reset instructions to <strong>{email}</strong>. Please check your inbox and follow the link to reset your
                        password.
                    </span>
                </div>

                <div className={styles.footer}>
                    <p>
                        Didn't receive the email?{" "}
                        <button
                            onClick={() => {
                                setSuccess(false);
                                setEmail("");
                            }}
                            className={styles.signUpLink}
                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
                        >
                            Try again
                        </button>
                    </p>
                    <p>
                        Remember your password?{" "}
                        <a href="/login" className={styles.signUpLink}>
                            Back to login
                        </a>
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Reset Password</h1>
                <p className={styles.subtitle}>Enter your email to receive password reset instructions</p>
            </div>

            {error && (
                <div className={styles.errorAlert}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formField}>
                    <label htmlFor="email" className={styles.label}>
                        Email Address
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError("");
                        }}
                        className={styles.input}
                        placeholder="john.doe@example.com"
                        required
                    />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={loading}>
                    {loading ? (
                        <>
                            <span className={styles.spinner}></span>
                            <span>Sending...</span>
                        </>
                    ) : (
                        "Send Reset Link"
                    )}
                </button>
            </form>

            <div className={styles.footer}>
                <p>
                    Remember your password?{" "}
                    <a href="/login" className={styles.signUpLink}>
                        Back to login
                    </a>
                </p>
            </div>
        </div>
    );
}

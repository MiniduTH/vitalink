"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import styles from "./register.module.css";

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // Multi-step form: 1 = Account, 2 = Personal Info
    const [formData, setFormData] = useState({
        // Account Info
        email: "",
        password: "",
        confirmPassword: "",
        userType: "patient" as "patient" | "staff",
        // Personal Info
        firstName: "",
        lastName: "",
        contactNumber: "",
        dateOfBirth: "",
        gender: "" as "" | "Male" | "Female" | "Other",
        address: "",
        // Emergency Contact (for patients)
        emergencyName: "",
        emergencyRelationship: "",
        emergencyPhone: "",
        // Terms
        acceptTerms: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        });
        setError("");
    };

    const validateStep1 = () => {
        if (!formData.email || !formData.password || !formData.confirmPassword) {
            setError("Please fill in all fields");
            return false;
        }

        if (!formData.email.includes("@")) {
            setError("Please enter a valid email address");
            return false;
        }

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters");
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            return false;
        }

        return true;
    };

    const validateStep2 = () => {
        if (!formData.firstName || !formData.lastName || !formData.contactNumber || !formData.dateOfBirth || !formData.gender) {
            setError("Please fill in all required fields");
            return false;
        }

        if (formData.contactNumber.length < 10) {
            setError("Please enter a valid contact number");
            return false;
        }

        if (formData.userType === "patient") {
            if (!formData.emergencyName || !formData.emergencyRelationship || !formData.emergencyPhone) {
                setError("Emergency contact information is required for patients");
                return false;
            }
        }

        if (!formData.acceptTerms) {
            setError("You must accept the terms and conditions");
            return false;
        }

        return true;
    };

    const handleNext = () => {
        setError("");
        if (validateStep1()) {
            setStep(2);
        }
    };

    const handleBack = () => {
        setError("");
        setStep(1);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validateStep2()) {
            return;
        }

        setLoading(true);

        try {
            // Step 1: Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // Step 2: Create user profile in Firestore
            const now = Timestamp.now();

            if (formData.userType === "patient") {
                // Create patient document
                const patientData = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    contactNumber: formData.contactNumber,
                    dateOfBirth: Timestamp.fromDate(new Date(formData.dateOfBirth)),
                    gender: formData.gender,
                    address: formData.address,
                    emergencyContact: {
                        name: formData.emergencyName,
                        relationship: formData.emergencyRelationship,
                        phone: formData.emergencyPhone,
                    },
                    createdAt: now,
                    updatedAt: now,
                };

                await setDoc(doc(db, "patients", user.uid), patientData);

                // Create initial health record
                const healthRecordData = {
                    patientId: user.uid,
                    bloodType: "",
                    allergies: [],
                    chronicConditions: [],
                    encounters: [],
                    digitalHealthCardId: "",
                    createdAt: now,
                    updatedAt: now,
                };

                await setDoc(doc(db, "healthRecords", user.uid), healthRecordData);
            } else {
                // Create staff document
                const staffData = {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    contactNumber: formData.contactNumber,
                    dateOfBirth: Timestamp.fromDate(new Date(formData.dateOfBirth)),
                    gender: formData.gender,
                    address: formData.address,
                    role: "Staff", // Default role, can be updated by admin
                    department: "General", // Default department
                    createdAt: now,
                    updatedAt: now,
                };

                await setDoc(doc(db, "staff", user.uid), staffData);
            }

            // Success - redirect to login
            router.push("/login?registered=true");
        } catch (err: any) {
            console.error("Registration error:", err);

            // Handle Firebase auth errors
            if (err.code === "auth/email-already-in-use") {
                setError("This email is already registered");
            } else if (err.code === "auth/invalid-email") {
                setError("Invalid email address");
            } else if (err.code === "auth/weak-password") {
                setError("Password is too weak");
            } else {
                setError(err.message || "Registration failed. Please try again");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Create Account</h1>
                <p className={styles.subtitle}>Join Vitalink Healthcare System</p>
            </div>

            {/* Progress Indicator */}
            <div className={styles.progressBar}>
                <div className={`${styles.progressStep} ${step >= 1 ? styles.active : ""}`}>
                    <span className={styles.stepNumber}>1</span>
                    <span className={styles.stepLabel}>Account</span>
                </div>
                <div className={styles.progressLine}></div>
                <div className={`${styles.progressStep} ${step >= 2 ? styles.active : ""}`}>
                    <span className={styles.stepNumber}>2</span>
                    <span className={styles.stepLabel}>Personal Info</span>
                </div>
            </div>

            {error && (
                <div className={styles.errorAlert}>
                    <span className={styles.errorIcon}>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
                {/* Step 1: Account Information */}
                {step === 1 && (
                    <>
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
                                Email Address *
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
                                Password *
                            </label>
                            <div className={styles.passwordContainer}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="At least 6 characters"
                                    required
                                />
                                <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? "👁️" : "👁️‍🗨️"}
                                </button>
                            </div>
                            <small className={styles.hint}>Must be at least 6 characters long</small>
                        </div>

                        {/* Confirm Password Field */}
                        <div className={styles.formField}>
                            <label htmlFor="confirmPassword" className={styles.label}>
                                Confirm Password *
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                className={styles.input}
                                placeholder="Re-enter your password"
                                required
                            />
                        </div>

                        <button type="button" className={styles.nextBtn} onClick={handleNext}>
                            Next →
                        </button>
                    </>
                )}

                {/* Step 2: Personal Information */}
                {step === 2 && (
                    <>
                        <div className={styles.formGrid}>
                            <div className={styles.formField}>
                                <label htmlFor="firstName" className={styles.label}>
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    id="firstName"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="John"
                                    required
                                />
                            </div>

                            <div className={styles.formField}>
                                <label htmlFor="lastName" className={styles.label}>
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    id="lastName"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="Doe"
                                    required
                                />
                            </div>

                            <div className={styles.formField}>
                                <label htmlFor="contactNumber" className={styles.label}>
                                    Contact Number *
                                </label>
                                <input
                                    type="tel"
                                    id="contactNumber"
                                    name="contactNumber"
                                    value={formData.contactNumber}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    placeholder="0771234567"
                                    required
                                />
                            </div>

                            <div className={styles.formField}>
                                <label htmlFor="dateOfBirth" className={styles.label}>
                                    Date of Birth *
                                </label>
                                <input
                                    type="date"
                                    id="dateOfBirth"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    required
                                />
                            </div>

                            <div className={styles.formField}>
                                <label htmlFor="gender" className={styles.label}>
                                    Gender *
                                </label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleInputChange}
                                    className={styles.input}
                                    required
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.formField}>
                            <label htmlFor="address" className={styles.label}>
                                Address
                            </label>
                            <textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className={styles.textarea}
                                placeholder="123 Main Street, Colombo 07"
                                rows={2}
                            />
                        </div>

                        {/* Emergency Contact (for patients only) */}
                        {formData.userType === "patient" && (
                            <>
                                <div className={styles.sectionTitle}>Emergency Contact *</div>
                                <div className={styles.formGrid}>
                                    <div className={styles.formField}>
                                        <label htmlFor="emergencyName" className={styles.label}>
                                            Name
                                        </label>
                                        <input
                                            type="text"
                                            id="emergencyName"
                                            name="emergencyName"
                                            value={formData.emergencyName}
                                            onChange={handleInputChange}
                                            className={styles.input}
                                            placeholder="Jane Doe"
                                            required={formData.userType === "patient"}
                                        />
                                    </div>

                                    <div className={styles.formField}>
                                        <label htmlFor="emergencyRelationship" className={styles.label}>
                                            Relationship
                                        </label>
                                        <input
                                            type="text"
                                            id="emergencyRelationship"
                                            name="emergencyRelationship"
                                            value={formData.emergencyRelationship}
                                            onChange={handleInputChange}
                                            className={styles.input}
                                            placeholder="Spouse"
                                            required={formData.userType === "patient"}
                                        />
                                    </div>

                                    <div className={styles.formField}>
                                        <label htmlFor="emergencyPhone" className={styles.label}>
                                            Phone Number
                                        </label>
                                        <input
                                            type="tel"
                                            id="emergencyPhone"
                                            name="emergencyPhone"
                                            value={formData.emergencyPhone}
                                            onChange={handleInputChange}
                                            className={styles.input}
                                            placeholder="0779876543"
                                            required={formData.userType === "patient"}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Terms and Conditions */}
                        <label className={styles.checkboxLabel}>
                            <input
                                type="checkbox"
                                name="acceptTerms"
                                checked={formData.acceptTerms}
                                onChange={handleInputChange}
                                className={styles.checkbox}
                                required
                            />
                            <span>
                                I accept the{" "}
                                <a href="/terms" className={styles.termsLink}>
                                    Terms and Conditions
                                </a>{" "}
                                and{" "}
                                <a href="/privacy" className={styles.termsLink}>
                                    Privacy Policy
                                </a>
                            </span>
                        </label>

                        <div className={styles.buttonGroup}>
                            <button type="button" className={styles.backBtn} onClick={handleBack} disabled={loading}>
                                ← Back
                            </button>
                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className={styles.spinner}></span>
                                        <span>Creating Account...</span>
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </button>
                        </div>
                    </>
                )}
            </form>

            {/* Login Link */}
            <div className={styles.footer}>
                <p>
                    Already have an account?{" "}
                    <a href="/login" className={styles.loginLink}>
                        Log in
                    </a>
                </p>
            </div>
        </div>
    );
}

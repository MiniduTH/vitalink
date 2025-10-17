"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function NewPatientPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        contactNumber: "",
        dateOfBirth: "",
        gender: "Male",
        address: "",
        emergencyContactName: "",
        emergencyContactRelationship: "",
        emergencyContactPhone: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.firstName || !formData.lastName) {
            setError("First name and last name are required");
            return;
        }

        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setError("Valid email is required");
            return;
        }

        // Validate contact number (must be exactly 10 digits)
        const cleanedPhone = formData.contactNumber.replace(/[-\s]/g, "");
        if (!formData.contactNumber || !/^[0-9]{10}$/.test(cleanedPhone)) {
            setError("Contact number must be exactly 10 digits");
            return;
        }

        // Validate emergency contact phone if provided
        if (formData.emergencyContactPhone) {
            const cleanedEmergencyPhone = formData.emergencyContactPhone.replace(/[-\s]/g, "");
            if (!/^[0-9]{10}$/.test(cleanedEmergencyPhone)) {
                setError("Emergency contact phone must be exactly 10 digits (or leave empty)");
                return;
            }
        }

        if (!formData.dateOfBirth) {
            setError("Date of birth is required");
            return;
        }

        try {
            setLoading(true);

            // Send ISO string date - API will convert to Timestamp
            const payload = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                contactNumber: formData.contactNumber.trim(),
                dateOfBirth: formData.dateOfBirth, // ISO string
                gender: formData.gender,
                address: formData.address.trim(),
                emergencyContact: {
                    name: formData.emergencyContactName.trim(),
                    relationship: formData.emergencyContactRelationship.trim(),
                    phone: formData.emergencyContactPhone.trim(),
                },
            };

            console.log("Sending payload:", payload); // Debug log

            const response = await fetch("/api/patients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            console.log("API Response:", data); // Debug log

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to register patient");
            }

            // Success - redirect back to patients list
            router.push("/staff/patients");
        } catch (err) {
            console.error("Registration error:", err); // Debug log
            setError(err instanceof Error ? err.message : "Failed to register patient");
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push("/staff/patients");
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Register New Patient</h1>
            </div>

            {error && (
                <div className={styles.error}>
                    <p>{error}</p>
                </div>
            )}

            <form className={styles.form} onSubmit={handleSubmit}>
                {/* Personal Information */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Personal Information</h2>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="firstName">
                                First Name <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                className={styles.input}
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="lastName">
                                Last Name <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                className={styles.input}
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="email">
                                Email <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                className={styles.input}
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="contactNumber">
                                Contact Number <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="tel"
                                id="contactNumber"
                                name="contactNumber"
                                className={styles.input}
                                value={formData.contactNumber}
                                onChange={handleChange}
                                placeholder="0771234567"
                                pattern="[0-9]{10}"
                                title="Must be exactly 10 digits"
                                maxLength={10}
                                required
                            />
                            <small style={{ fontSize: "12px", color: "var(--text-gray)" }}>Must be exactly 10 digits</small>
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="dateOfBirth">
                                Date of Birth <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="date"
                                id="dateOfBirth"
                                name="dateOfBirth"
                                className={styles.input}
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="gender">
                                Gender <span className={styles.required}>*</span>
                            </label>
                            <select id="gender" name="gender" className={styles.input} value={formData.gender} onChange={handleChange} required>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="address">
                            Address
                        </label>
                        <textarea id="address" name="address" className={styles.textarea} value={formData.address} onChange={handleChange} rows={3} />
                    </div>
                </div>

                {/* Emergency Contact */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Emergency Contact</h2>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="emergencyContactName">
                            Name
                        </label>
                        <input
                            type="text"
                            id="emergencyContactName"
                            name="emergencyContactName"
                            className={styles.input}
                            value={formData.emergencyContactName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="emergencyContactRelationship">
                                Relationship
                            </label>
                            <input
                                type="text"
                                id="emergencyContactRelationship"
                                name="emergencyContactRelationship"
                                className={styles.input}
                                value={formData.emergencyContactRelationship}
                                onChange={handleChange}
                                placeholder="e.g., Spouse, Parent, Sibling"
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="emergencyContactPhone">
                                Phone
                            </label>
                            <input
                                type="tel"
                                id="emergencyContactPhone"
                                name="emergencyContactPhone"
                                className={styles.input}
                                value={formData.emergencyContactPhone}
                                onChange={handleChange}
                                placeholder="0779876543"
                                pattern="[0-9]{10}"
                                title="Must be exactly 10 digits (if provided)"
                                maxLength={10}
                            />
                            <small style={{ fontSize: "12px", color: "var(--text-gray)" }}>Optional - 10 digits if provided</small>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button type="button" className={styles.btnCancel} onClick={handleCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button type="submit" className={styles.btnSubmit} disabled={loading}>
                        {loading ? "Registering..." : "Register Patient"}
                    </button>
                </div>
            </form>
        </div>
    );
}

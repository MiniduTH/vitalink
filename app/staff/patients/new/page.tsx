"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { Timestamp } from "firebase/firestore";

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

        if (!formData.contactNumber || formData.contactNumber.length < 10) {
            setError("Valid contact number is required (min 10 digits)");
            return;
        }

        if (!formData.dateOfBirth) {
            setError("Date of birth is required");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                email: formData.email.trim(),
                contactNumber: formData.contactNumber.trim(),
                dateOfBirth: Timestamp.fromDate(new Date(formData.dateOfBirth)),
                gender: formData.gender,
                address: formData.address.trim(),
                emergencyContact: {
                    name: formData.emergencyContactName.trim(),
                    relationship: formData.emergencyContactRelationship.trim(),
                    phone: formData.emergencyContactPhone.trim(),
                },
            };

            const response = await fetch("/api/patients", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to register patient");
            }

            // Success - redirect to patient detail page
            router.push(`/patients/${data.data.id}`);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to register patient");
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push("/patients");
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
                                required
                            />
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
                            />
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

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";
import { Timestamp } from "firebase/firestore";

export default function NewAppointmentPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

    const [formData, setFormData] = useState({
        patientId: "",
        doctorId: "",
        departmentId: "",
        appointmentDate: "",
        timeSlot: "",
        reason: "",
        notes: "",
    });

    // Fetch available slots when date and doctor are selected
    useEffect(() => {
        if (formData.appointmentDate && formData.doctorId) {
            fetchAvailableSlots();
        } else {
            setAvailableSlots([]);
        }
    }, [formData.appointmentDate, formData.doctorId]);

    const fetchAvailableSlots = async () => {
        try {
            setLoadingSlots(true);
            const date = new Date(formData.appointmentDate);
            const timestamp = Timestamp.fromDate(date);

            const response = await fetch(
                `/api/appointments/available-slots?doctorId=${encodeURIComponent(formData.doctorId)}&date=${timestamp.seconds}`
            );

            if (!response.ok) throw new Error("Failed to fetch available slots");

            const data = await response.json();
            if (data.success) {
                setAvailableSlots(data.data);
                // Clear selected slot if it's no longer available
                if (formData.timeSlot && !data.data.includes(formData.timeSlot)) {
                    setFormData((prev) => ({ ...prev, timeSlot: "" }));
                }
            } else {
                throw new Error(data.error || "Failed to load available slots");
            }
        } catch (err) {
            console.error("Error fetching slots:", err);
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validation
        if (!formData.patientId || !formData.doctorId || !formData.departmentId) {
            setError("Patient, Doctor, and Department are required");
            return;
        }

        if (!formData.appointmentDate) {
            setError("Appointment date is required");
            return;
        }

        if (!formData.timeSlot) {
            setError("Please select a time slot");
            return;
        }

        if (!formData.reason || formData.reason.trim().length === 0) {
            setError("Reason for appointment is required");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                patientId: formData.patientId.trim(),
                doctorId: formData.doctorId.trim(),
                departmentId: formData.departmentId.trim(),
                appointmentDate: Timestamp.fromDate(new Date(formData.appointmentDate)),
                timeSlot: formData.timeSlot,
                reason: formData.reason.trim(),
                notes: formData.notes.trim(),
            };

            const response = await fetch("/api/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to book appointment");
            }

            // Success - redirect to appointments page
            router.push("/appointments");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to book appointment");
            setLoading(false);
        }
    };

    const handleCancel = () => {
        router.push("/appointments");
    };

    // Get today's date in YYYY-MM-DD format for min date
    const today = new Date().toISOString().split("T")[0];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Book New Appointment</h1>
            </div>

            {error && (
                <div className={styles.error}>
                    <p>{error}</p>
                </div>
            )}

            <form className={styles.form} onSubmit={handleSubmit}>
                {/* Appointment Details */}
                <div className={styles.section}>
                    <h2 className={styles.sectionTitle}>Appointment Details</h2>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="patientId">
                            Patient ID <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            id="patientId"
                            name="patientId"
                            className={styles.input}
                            value={formData.patientId}
                            onChange={handleChange}
                            placeholder="Enter patient ID"
                            required
                        />
                        <span className={styles.hint}>Enter the patient's unique ID</span>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="doctorId">
                                Doctor ID <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="doctorId"
                                name="doctorId"
                                className={styles.input}
                                value={formData.doctorId}
                                onChange={handleChange}
                                placeholder="Enter doctor ID"
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="departmentId">
                                Department ID <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="text"
                                id="departmentId"
                                name="departmentId"
                                className={styles.input}
                                value={formData.departmentId}
                                onChange={handleChange}
                                placeholder="Enter department ID"
                                required
                            />
                        </div>
                    </div>

                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="appointmentDate">
                                Appointment Date <span className={styles.required}>*</span>
                            </label>
                            <input
                                type="date"
                                id="appointmentDate"
                                name="appointmentDate"
                                className={styles.input}
                                value={formData.appointmentDate}
                                onChange={handleChange}
                                min={today}
                                required
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label} htmlFor="timeSlot">
                                Time Slot <span className={styles.required}>*</span>
                            </label>
                            <select
                                id="timeSlot"
                                name="timeSlot"
                                className={styles.input}
                                value={formData.timeSlot}
                                onChange={handleChange}
                                disabled={!formData.appointmentDate || !formData.doctorId || loadingSlots}
                                required
                            >
                                <option value="">
                                    {loadingSlots
                                        ? "Loading slots..."
                                        : !formData.appointmentDate || !formData.doctorId
                                        ? "Select date and doctor first"
                                        : availableSlots.length === 0
                                        ? "No slots available"
                                        : "Select a time slot"}
                                </option>
                                {availableSlots.map((slot) => (
                                    <option key={slot} value={slot}>
                                        {slot}
                                    </option>
                                ))}
                            </select>
                            {availableSlots.length > 0 && <span className={styles.hint}>{availableSlots.length} slots available</span>}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="reason">
                            Reason for Appointment <span className={styles.required}>*</span>
                        </label>
                        <textarea
                            id="reason"
                            name="reason"
                            className={styles.textarea}
                            value={formData.reason}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Enter the reason for this appointment"
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label} htmlFor="notes">
                            Additional Notes
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            className={styles.textarea}
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Any additional information (optional)"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button type="button" className={styles.btnCancel} onClick={handleCancel} disabled={loading}>
                        Cancel
                    </button>
                    <button type="submit" className={styles.btnSubmit} disabled={loading}>
                        {loading ? "Booking..." : "Book Appointment"}
                    </button>
                </div>
            </form>
        </div>
    );
}

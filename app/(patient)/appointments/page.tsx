"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { SearchBar } from "@/components/SearchBar";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Appointment, BookAppointmentDTO } from "@/lib/types";
import { Timestamp } from "firebase/firestore";
import styles from "./appointments.module.css";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { AppointmentRepository } from "@/lib/firestore/repositories/AppointmentRepository";
import { AppointmentService } from "@/lib/services/AppointmentService";
import { NotificationService } from "@/lib/services/NotificationService";

// Initialize services at module level
const appointmentRepo = new AppointmentRepository();
const notificationService = new NotificationService();
const appointmentService = new AppointmentService(appointmentRepo, notificationService);

export default function PatientAppointments() {
    const { user, loading: authLoading, userData } = useAuth();
    const router = useRouter();

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
    const [loading, setLoading] = useState(true);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [bookingData, setBookingData] = useState<Partial<BookAppointmentDTO>>({
        patientId: "",
        doctorId: "",
        departmentId: "",
        appointmentDate: Timestamp.now(),
        timeSlot: "",
        reason: "",
        status: "Scheduled",
    });
    const [rescheduleData, setRescheduleData] = useState({
        newDate: "",
        newTimeSlot: "",
    });

    useEffect(() => {
        // Redirect if not authenticated
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        // Fetch appointments when user is available
        if (user && userData) {
            fetchAppointments();
        }
    }, [user, userData, authLoading, router]);

    const fetchAppointments = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            const data = await appointmentService.getPatientAppointments(user.uid);
            setAppointments(data);
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setError("Failed to load appointments. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const filteredAppointments = appointments.filter((apt) => {
        const aptDate = apt.appointmentDate.toDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Search filter
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                apt.doctorId.toLowerCase().includes(searchLower) ||
                apt.departmentId.toLowerCase().includes(searchLower) ||
                apt.reason.toLowerCase().includes(searchLower);
            if (!matchesSearch) return false;
        }

        // Status filter
        if (filter === "upcoming") {
            return aptDate >= today && apt.status !== "Completed" && apt.status !== "Cancelled";
        } else if (filter === "past") {
            return aptDate < today || apt.status === "Completed" || apt.status === "Cancelled";
        }
        return true;
    });

    const upcomingCount = appointments.filter((a) => {
        const aptDate = a.appointmentDate.toDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return aptDate >= today && a.status !== "Completed" && a.status !== "Cancelled" && a.status !== "Confirmed" && a.status !== "CheckedIn";
    }).length;

    const todayCount = appointments.filter((a) => {
        const aptDate = a.appointmentDate.toDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
    }).length;

    const completedCount = appointments.filter((a) => a.status === "Completed" || a.status === "CheckedIn").length;

    const handleSearch = (query?: string) => {
        console.log("Searching:", query);
    };

    const handleCheckIn = async (id: string) => {
        try {
            await appointmentService.checkIn(id);
            await fetchAppointments(); // Refresh list
            alert("Successfully checked in!");
        } catch (err: any) {
            console.error("Error checking in:", err);
            alert(err.message || "Failed to check in. Please try again.");
        }
    };

    const handleReschedule = async (id: string) => {
        // Open reschedule modal with current appointment details
        const appointment = appointments.find((apt) => apt.id === id);
        if (appointment) {
            setSelectedAppointmentId(id);
            setRescheduleData({
                newDate: "",
                newTimeSlot: appointment.timeSlot, // Pre-fill with current time slot
            });
            setShowRescheduleModal(true);
        }
    };

    const handleRescheduleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedAppointmentId || !rescheduleData.newDate || !rescheduleData.newTimeSlot) {
            alert("Please select both date and time slot");
            return;
        }

        try {
            const newDate = Timestamp.fromDate(new Date(rescheduleData.newDate));
            await appointmentService.rescheduleAppointment(selectedAppointmentId, newDate, rescheduleData.newTimeSlot);
            await fetchAppointments(); // Refresh list
            setShowRescheduleModal(false);
            setSelectedAppointmentId(null);
            setRescheduleData({ newDate: "", newTimeSlot: "" });
            alert("Appointment rescheduled successfully!");
        } catch (err: any) {
            console.error("Error rescheduling appointment:", err);
            alert(err.message || "Failed to reschedule appointment. Please try again.");
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this appointment?")) {
            return;
        }

        try {
            await appointmentService.cancelAppointment(id);
            await fetchAppointments(); // Refresh list
            alert("Appointment cancelled successfully");
        } catch (err: any) {
            console.error("Error cancelling appointment:", err);
            alert(err.message || "Failed to cancel appointment. Please try again.");
        }
    };

    const handleBookSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !bookingData.doctorId || !bookingData.departmentId || !bookingData.timeSlot || !bookingData.reason) {
            alert("Please fill in all required fields");
            return;
        }

        try {
            const appointmentData: BookAppointmentDTO = {
                patientId: user.uid,
                doctorId: bookingData.doctorId,
                departmentId: bookingData.departmentId,
                appointmentDate: bookingData.appointmentDate || Timestamp.now(),
                timeSlot: bookingData.timeSlot,
                reason: bookingData.reason,
                status: "Scheduled",
                notes: "",
            };

            await appointmentService.bookAppointment(appointmentData);
            await fetchAppointments(); // Refresh list
            setShowBookingForm(false);
            // Reset form
            setBookingData({
                patientId: "",
                doctorId: "",
                departmentId: "",
                appointmentDate: Timestamp.now(),
                timeSlot: "",
                reason: "",
                status: "Scheduled",
            });
            alert("Appointment booked successfully!");
        } catch (err: any) {
            console.error("Error booking appointment:", err);
            alert(err.message || "Failed to book appointment. Please try again.");
        }
    };

    if (loading || authLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading appointments...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <p>{error}</p>
                    <button onClick={fetchAppointments} className={styles.retryBtn}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>My Appointments</h1>
                <p className={styles.subtitle}>Manage your medical appointments</p>
            </header>

            {/* Stats Cards */}
            <div className={styles.statsGrid}>
                <StatCard value={todayCount.toString()} label="Today" variant="pink" icon="📅" />
                <StatCard value={completedCount.toString()} label="Completed" variant="green" icon="✓" />
                <StatCard value={upcomingCount.toString()} label="Upcoming" variant="blue" icon="⏰" />
            </div>

            {/* Search Bar */}
            <div className={styles.searchSection}>
                <SearchBar
                    placeholder="Search by doctor, department, or reason..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSearch={handleSearch}
                />
            </div>

            {/* Book Button */}
            <button className={styles.bookBtn} onClick={() => setShowBookingForm(!showBookingForm)}>
                + Book Appointment
            </button>

            {/* Booking Form Modal */}
            {showBookingForm && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Book New Appointment</h2>
                            <button className={styles.closeBtn} onClick={() => setShowBookingForm(false)}>
                                ×
                            </button>
                        </div>
                        <form className={styles.form} onSubmit={handleBookSubmit}>
                            <div className={styles.formGroup}>
                                <label>Department*</label>
                                <select
                                    required
                                    value={bookingData.departmentId}
                                    onChange={(e) => setBookingData({ ...bookingData, departmentId: e.target.value })}
                                >
                                    <option value="">Select Department</option>
                                    <option value="dept-cardiology">Cardiology</option>
                                    <option value="dept-general">General Medicine</option>
                                    <option value="dept-orthopedics">Orthopedics</option>
                                    <option value="dept-pediatrics">Pediatrics</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Doctor*</label>
                                <select
                                    required
                                    value={bookingData.doctorId}
                                    onChange={(e) => setBookingData({ ...bookingData, doctorId: e.target.value })}
                                >
                                    <option value="">Select Doctor</option>
                                    <option value="doc-sarah">Dr. Sarah Johnson</option>
                                    <option value="doc-michael">Dr. Michael Chen</option>
                                    <option value="doc-emily">Dr. Emily Williams</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Date*</label>
                                <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) =>
                                        setBookingData({
                                            ...bookingData,
                                            appointmentDate: Timestamp.fromDate(new Date(e.target.value)),
                                        })
                                    }
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Time Slot*</label>
                                <select
                                    required
                                    value={bookingData.timeSlot}
                                    onChange={(e) => setBookingData({ ...bookingData, timeSlot: e.target.value })}
                                >
                                    <option value="">Select Time</option>
                                    <option value="09:00 AM">09:00 AM</option>
                                    <option value="10:00 AM">10:00 AM</option>
                                    <option value="11:00 AM">11:00 AM</option>
                                    <option value="02:00 PM">02:00 PM</option>
                                    <option value="03:00 PM">03:00 PM</option>
                                    <option value="04:00 PM">04:00 PM</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Reason for Visit*</label>
                                <textarea
                                    rows={3}
                                    placeholder="Describe your symptoms or reason for visit"
                                    required
                                    value={bookingData.reason}
                                    onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                                ></textarea>
                            </div>
                            <div className={styles.formActions}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowBookingForm(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn}>
                                    Book Appointment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {showRescheduleModal && selectedAppointmentId && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h2>Reschedule Appointment</h2>
                            <button className={styles.closeBtn} onClick={() => setShowRescheduleModal(false)}>
                                ×
                            </button>
                        </div>
                        <form className={styles.form} onSubmit={handleRescheduleSubmit}>
                            <div className={styles.formGroup}>
                                <label>New Date*</label>
                                <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split("T")[0]}
                                    value={rescheduleData.newDate}
                                    onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>New Time Slot*</label>
                                <select
                                    required
                                    value={rescheduleData.newTimeSlot}
                                    onChange={(e) => setRescheduleData({ ...rescheduleData, newTimeSlot: e.target.value })}
                                >
                                    <option value="">Select Time</option>
                                    <option value="09:00 AM">09:00 AM</option>
                                    <option value="10:00 AM">10:00 AM</option>
                                    <option value="11:00 AM">11:00 AM</option>
                                    <option value="02:00 PM">02:00 PM</option>
                                    <option value="03:00 PM">03:00 PM</option>
                                    <option value="04:00 PM">04:00 PM</option>
                                </select>
                            </div>
                            <div className={styles.infoBox}>
                                <p>💡 Your appointment will be rescheduled and notifications will be sent to you and the doctor.</p>
                            </div>
                            <div className={styles.formActions}>
                                <button
                                    type="button"
                                    className={styles.cancelBtn}
                                    onClick={() => {
                                        setShowRescheduleModal(false);
                                        setSelectedAppointmentId(null);
                                    }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className={styles.submitBtn}>
                                    Confirm Reschedule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
                <button className={`${styles.tab} ${filter === "all" ? styles.activeTab : ""}`} onClick={() => setFilter("all")}>
                    All
                </button>
                <button className={`${styles.tab} ${filter === "upcoming" ? styles.activeTab : ""}`} onClick={() => setFilter("upcoming")}>
                    Upcoming
                </button>
                <button className={`${styles.tab} ${filter === "past" ? styles.activeTab : ""}`} onClick={() => setFilter("past")}>
                    Past
                </button>
            </div>

            {/* Appointments List */}
            <div className={styles.appointmentsList}>
                {filteredAppointments.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📅</div>
                        <h3>No appointments found</h3>
                        <p>Book your first appointment to get started</p>
                        <button className={styles.bookBtn} onClick={() => setShowBookingForm(true)}>
                            Book Appointment
                        </button>
                    </div>
                ) : (
                    filteredAppointments.map((appointment) => (
                        <AppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            onCheckIn={handleCheckIn}
                            onReschedule={handleReschedule}
                            onCancel={handleCancel}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

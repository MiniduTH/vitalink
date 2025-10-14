"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { SearchBar } from "@/components/SearchBar";
import { AppointmentCard } from "@/components/AppointmentCard";
import { Appointment } from "@/lib/types";
import { Timestamp } from "firebase/firestore";
import styles from "./appointments.module.css";

export default function PatientAppointments() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filter, setFilter] = useState<"all" | "upcoming" | "past">("upcoming");
    const [loading, setLoading] = useState(true);
    const [showBookingForm, setShowBookingForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        // TODO: Replace with actual API call
        setTimeout(() => {
            setAppointments([
                {
                    id: "1",
                    patientId: "John Doe",
                    doctorId: "Dr. Sarah Johnson",
                    departmentId: "Cardiology",
                    appointmentDate: Timestamp.fromDate(new Date("2025-01-20")),
                    timeSlot: "09:00 AM",
                    reason: "Annual checkup",
                    status: "Scheduled",
                    notes: "",
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                },
                {
                    id: "2",
                    patientId: "John Doe",
                    doctorId: "Dr. Michael Chen",
                    departmentId: "General Medicine",
                    appointmentDate: Timestamp.fromDate(new Date("2025-01-25")),
                    timeSlot: "02:30 PM",
                    reason: "Follow-up consultation",
                    status: "Confirmed",
                    notes: "",
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                },
                {
                    id: "3",
                    patientId: "John Doe",
                    doctorId: "Dr. Emily Williams",
                    departmentId: "Orthopedics",
                    appointmentDate: Timestamp.fromDate(new Date("2024-12-15")),
                    timeSlot: "11:00 AM",
                    reason: "Knee pain assessment",
                    status: "Completed",
                    notes: "",
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                },
            ]);
            setLoading(false);
        }, 500);
    }, []);

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
        return aptDate >= today && a.status !== "Completed" && a.status !== "Cancelled";
    }).length;

    const todayCount = appointments.filter((a) => {
        const aptDate = a.appointmentDate.toDate();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        aptDate.setHours(0, 0, 0, 0);
        return aptDate.getTime() === today.getTime();
    }).length;

    const completedCount = appointments.filter((a) => a.status === "Completed").length;

    const handleSearch = (query?: string) => {
        console.log("Searching:", query);
    };

    const handleCheckIn = (id: string) => {
        console.log("Check in appointment:", id);
        // TODO: Implement check-in
    };

    const handleReschedule = (id: string) => {
        console.log("Reschedule appointment:", id);
        // TODO: Implement reschedule
    };

    const handleCancel = (id: string) => {
        console.log("Cancel appointment:", id);
        // TODO: Implement cancel
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading appointments...</p>
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
                        <form className={styles.form}>
                            <div className={styles.formGroup}>
                                <label>Department</label>
                                <select>
                                    <option>Select Department</option>
                                    <option>Cardiology</option>
                                    <option>General Medicine</option>
                                    <option>Orthopedics</option>
                                    <option>Pediatrics</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Doctor</label>
                                <select>
                                    <option>Select Doctor</option>
                                    <option>Dr. Sarah Johnson</option>
                                    <option>Dr. Michael Chen</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Date</label>
                                <input type="date" />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Time Slot</label>
                                <select>
                                    <option>Select Time</option>
                                    <option>09:00 AM</option>
                                    <option>10:00 AM</option>
                                    <option>02:00 PM</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Reason for Visit</label>
                                <textarea rows={3} placeholder="Describe your symptoms or reason for visit"></textarea>
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

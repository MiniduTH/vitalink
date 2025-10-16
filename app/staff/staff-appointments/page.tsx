"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Appointment } from "@/lib/types";
import { AppointmentCard } from "@/components/AppointmentCard";
import styles from "./page.module.css";

type AppointmentStatus = "All" | "Scheduled" | "Confirmed" | "CheckedIn" | "Completed" | "Cancelled";

export default function AppointmentsPage() {
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<AppointmentStatus>("All");
    const [dateFilter, setDateFilter] = useState("");

    useEffect(() => {
        fetchAppointments();
    }, [statusFilter]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            setError(null);

            let url = "/api/appointments";
            const params = new URLSearchParams();
            if (statusFilter !== "All") params.append("status", statusFilter);

            if (params.toString()) url += `?${params.toString()}`;

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Failed to fetch appointments");
            }

            const data = await response.json();
            if (data.success) {
                setAppointments(data.data);
            } else {
                throw new Error(data.error || "Failed to load appointments");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleCheckIn = async (id: string) => {
        if (!confirm("Check in this appointment?")) return;

        try {
            const response = await fetch(`/api/appointments/${id}/check-in`, {
                method: "POST",
            });

            if (!response.ok) throw new Error("Failed to check in");

            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            // Refresh appointments
            await fetchAppointments();
            alert("Patient checked in successfully!");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to check in");
        }
    };

    const handleCancel = async (id: string) => {
        if (!confirm("Are you sure you want to cancel this appointment?")) return;

        try {
            const response = await fetch(`/api/appointments/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "Cancelled" }),
            });

            if (!response.ok) throw new Error("Failed to cancel");

            const data = await response.json();
            if (!data.success) throw new Error(data.error);

            // Refresh appointments
            await fetchAppointments();
            alert("Appointment cancelled successfully!");
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to cancel appointment");
        }
    };

    const handleReschedule = (id: string) => {
        // Navigate to reschedule page (to be implemented)
        alert(`Reschedule functionality for appointment ${id} - To be implemented`);
    };

    const handleViewAppointment = (id: string) => {
        router.push(`/appointments/${id}`);
    };

    const handleNewAppointment = () => {
        router.push("/appointments/new");
    };

    // Filter by date (client-side)
    const filteredAppointments = dateFilter
        ? appointments.filter((apt) => {
              const aptDate = apt.appointmentDate.toDate ? apt.appointmentDate.toDate() : (apt.appointmentDate as any);
              const dateObj = aptDate instanceof Date ? aptDate : new Date(aptDate);
              return dateObj.toISOString().split("T")[0] === dateFilter;
          })
        : appointments;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Appointments</h1>
                <button className={styles.btnNew} onClick={handleNewAppointment}>
                    + Book Appointment
                </button>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Status:</label>
                    <select
                        className={styles.filterSelect}
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus)}
                    >
                        <option value="All">All</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="CheckedIn">Checked In</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Date:</label>
                    <input type="date" className={styles.filterInput} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
                </div>

                {dateFilter && (
                    <button className={styles.btnClearDate} onClick={() => setDateFilter("")}>
                        Clear Date
                    </button>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className={styles.error}>
                    <p>{error}</p>
                    <button onClick={fetchAppointments} className={styles.btnRetry}>
                        Retry
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading appointments...</p>
                </div>
            )}

            {/* Appointments Grid */}
            {!loading && !error && (
                <>
                    {filteredAppointments.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No appointments found</p>
                            {(statusFilter !== "All" || dateFilter) && (
                                <button
                                    onClick={() => {
                                        setStatusFilter("All");
                                        setDateFilter("");
                                    }}
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className={styles.stats}>
                                <p>
                                    Showing {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                            <div className={styles.grid}>
                                {filteredAppointments.map((appointment) => (
                                    <AppointmentCard
                                        key={appointment.id}
                                        appointment={appointment}
                                        onCheckIn={handleCheckIn}
                                        onCancel={handleCancel}
                                        onReschedule={handleReschedule}
                                        onClick={handleViewAppointment}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

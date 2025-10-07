import React from "react";
import styles from "./AppointmentCard.module.css";
import { Appointment } from "@/lib/types";

interface AppointmentCardProps {
    appointment: Appointment;
    onCheckIn?: (id: string) => void;
    onCancel?: (id: string) => void;
    onReschedule?: (id: string) => void;
    onClick?: (id: string) => void;
}

export function AppointmentCard({ appointment, onCheckIn, onCancel, onReschedule, onClick }: AppointmentCardProps) {
    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        });
    };

    const getStatusClass = () => {
        switch (appointment.status) {
            case "Scheduled":
                return styles.scheduled;
            case "Confirmed":
                return styles.confirmed;
            case "CheckedIn":
                return styles.checkedIn;
            case "Completed":
                return styles.completed;
            case "Cancelled":
                return styles.cancelled;
            default:
                return "";
        }
    };

    const canCheckIn = appointment.status === "Scheduled" || appointment.status === "Confirmed";
    const canCancel = appointment.status !== "Completed" && appointment.status !== "Cancelled";
    const canReschedule = appointment.status !== "Completed" && appointment.status !== "Cancelled";

    return (
        <div className={`${styles.appointmentCard} ${getStatusClass()}`} onClick={() => onClick?.(appointment.id)}>
            <div className={styles.cardContent}>
                <div className={styles.header}>
                    <h3 className={styles.patientName}>{appointment.patientId}</h3>
                    <button className={styles.arrowButton} aria-label="View details">
                        ›
                    </button>
                </div>

                <div className={styles.details}>
                    <p className={styles.doctor}>{appointment.doctorId}</p>
                    <div className={styles.timeInfo}>
                        <span className={styles.time}>{appointment.timeSlot}</span>
                        <span className={styles.separator}>•</span>
                        <span className={styles.date}>{formatDate(appointment.appointmentDate)}</span>
                    </div>
                </div>

                <div className={styles.actions}>
                    {onCheckIn && canCheckIn && (
                        <button
                            className={`${styles.btn} ${styles.btnCheckIn}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onCheckIn(appointment.id);
                            }}
                        >
                            Check In
                        </button>
                    )}
                    {onReschedule && canReschedule && (
                        <button
                            className={`${styles.btn} ${styles.btnReschedule}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onReschedule(appointment.id);
                            }}
                        >
                            Reschedule
                        </button>
                    )}
                    {onCancel && canCancel && (
                        <button
                            className={`${styles.btn} ${styles.btnCancel}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onCancel(appointment.id);
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

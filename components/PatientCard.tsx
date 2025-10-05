import React from "react";
import styles from "./PatientCard.module.css";
import { Patient } from "@/lib/types";

interface PatientCardProps {
    patient: Patient;
    onView?: (id: string) => void;
    onEdit?: (id: string) => void;
}

export function PatientCard({ patient, onView, onEdit }: PatientCardProps) {
    const formatDate = (timestamp: any) => {
        if (!timestamp) return "N/A";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString();
    };

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <h3 className={styles.name}>
                    {patient.firstName} {patient.lastName}
                </h3>
                <span className={styles.badge}>{patient.gender}</span>
            </div>

            <div className={styles.info}>
                <div className={styles.infoItem}>
                    <span className={styles.label}>DOB:</span>
                    <span className={styles.value}>{formatDate(patient.dateOfBirth)}</span>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.label}>Contact:</span>
                    <span className={styles.value}>{patient.contactNumber}</span>
                </div>
                <div className={styles.infoItem}>
                    <span className={styles.label}>Email:</span>
                    <span className={styles.value}>{patient.email}</span>
                </div>
            </div>

            <div className={styles.actions}>
                {onView && (
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => onView(patient.id)}>
                        View
                    </button>
                )}
                {onEdit && (
                    <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => onEdit(patient.id)}>
                        Edit
                    </button>
                )}
            </div>
        </div>
    );
}

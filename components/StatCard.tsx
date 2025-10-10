import React from "react";
import styles from "./StatCard.module.css";

interface StatCardProps {
    value: string | number;
    label: string;
    variant?: "pink" | "green" | "blue" | "teal";
    icon?: string;
}

export function StatCard({ value, label, variant = "pink", icon }: StatCardProps) {
    return (
        <div className={`${styles.statCard} ${styles[variant]}`}>
            {icon && <div className={styles.icon}>{icon}</div>}
            <div className={styles.content}>
                <h2 className={styles.value}>{value}</h2>
                <p className={styles.label}>{label}</p>
            </div>
        </div>
    );
}

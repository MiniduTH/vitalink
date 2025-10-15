"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { SearchBar } from "@/components/SearchBar";
import styles from "./health-records.module.css";

interface VitalSigns {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    weight: number;
    height: number;
}

interface Encounter {
    id: string;
    date: string;
    doctor: string;
    department: string;
    diagnosis: string;
    notes: string;
}

interface Medication {
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    status: "Active" | "Completed";
}

interface LabResult {
    id: string;
    testName: string;
    date: string;
    result: string;
    normalRange: string;
    status: "Normal" | "Abnormal" | "Critical";
}

export default function PatientHealthRecords() {
    const [activeTab, setActiveTab] = useState<"overview" | "encounters" | "medications" | "labs">("overview");
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    // Mock data
    const [vitalSigns] = useState<VitalSigns>({
        bloodPressure: "120/80",
        heartRate: 72,
        temperature: 98.6,
        weight: 70,
        height: 170,
    });

    const [encounters] = useState<Encounter[]>([
        {
            id: "1",
            date: "2024-12-15",
            doctor: "Dr. Sarah Johnson",
            department: "Cardiology",
            diagnosis: "Routine checkup - Normal",
            notes: "Patient is in good health. Continue current lifestyle and medications.",
        },
        {
            id: "2",
            date: "2024-11-20",
            doctor: "Dr. Michael Chen",
            department: "General Medicine",
            diagnosis: "Seasonal allergies",
            notes: "Prescribed antihistamines. Follow-up in 2 weeks if symptoms persist.",
        },
    ]);

    const [medications] = useState<Medication[]>([
        {
            name: "Lisinopril",
            dosage: "10mg",
            frequency: "Once daily",
            startDate: "2024-01-15",
            status: "Active",
        },
        {
            name: "Aspirin",
            dosage: "81mg",
            frequency: "Once daily",
            startDate: "2024-01-15",
            status: "Active",
        },
        {
            name: "Amoxicillin",
            dosage: "500mg",
            frequency: "Three times daily",
            startDate: "2024-11-20",
            endDate: "2024-11-27",
            status: "Completed",
        },
    ]);

    const [labResults] = useState<LabResult[]>([
        {
            id: "1",
            testName: "Complete Blood Count (CBC)",
            date: "2024-12-10",
            result: "Normal",
            normalRange: "4.5-11.0 K/uL",
            status: "Normal",
        },
        {
            id: "2",
            testName: "Lipid Panel",
            date: "2024-12-10",
            result: "Total Cholesterol: 180 mg/dL",
            normalRange: "<200 mg/dL",
            status: "Normal",
        },
        {
            id: "3",
            testName: "Blood Glucose",
            date: "2024-12-10",
            result: "95 mg/dL",
            normalRange: "70-100 mg/dL",
            status: "Normal",
        },
    ]);

    useEffect(() => {
        // TODO: Replace with actual API call
        setTimeout(() => setLoading(false), 500);
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const getLabStatusClass = (status: string) => {
        return styles[status.toLowerCase()];
    };

    const handleSearch = (query?: string) => {
        console.log("Searching:", query);
        // TODO: Implement search functionality
    };

    // Filter data based on search
    const filteredEncounters = encounters.filter(
        (e) =>
            !searchQuery ||
            e.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredMedications = medications.filter((m) => !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const filteredLabResults = labResults.filter((l) => !searchQuery || l.testName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading health records...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Health Records</h1>
                <p className={styles.subtitle}>Your complete medical history and health information</p>
            </header>

            {/* Stats Summary */}
            <div className={styles.statsGrid}>
                <StatCard value={encounters.length.toString()} label="Total Visits" variant="blue" icon="🏥" />
                <StatCard value={medications.filter((m) => m.status === "Active").length.toString()} label="Active Meds" variant="pink" icon="💊" />
                <StatCard value={labResults.length.toString()} label="Lab Tests" variant="green" icon="🔬" />
            </div>

            {/* Search Bar */}
            <div className={styles.searchSection}>
                <SearchBar
                    placeholder="Search records, medications, tests..."
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSearch={handleSearch}
                />
            </div>

            {/* Download Button */}
            <button className={styles.downloadBtn}>📥 Download Records</button>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === "overview" ? styles.activeTab : ""}`} onClick={() => setActiveTab("overview")}>
                    Overview
                </button>
                <button className={`${styles.tab} ${activeTab === "encounters" ? styles.activeTab : ""}`} onClick={() => setActiveTab("encounters")}>
                    Encounters
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "medications" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("medications")}
                >
                    Medications
                </button>
                <button className={`${styles.tab} ${activeTab === "labs" ? styles.activeTab : ""}`} onClick={() => setActiveTab("labs")}>
                    Lab Results
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
                <div className={styles.content}>
                    {/* Vital Signs */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Latest Vital Signs</h2>
                        <div className={styles.vitalsGrid}>
                            <div className={styles.vitalCard}>
                                <div className={styles.vitalIcon}>❤️</div>
                                <div className={styles.vitalInfo}>
                                    <span className={styles.vitalLabel}>Blood Pressure</span>
                                    <span className={styles.vitalValue}>{vitalSigns.bloodPressure}</span>
                                    <span className={styles.vitalUnit}>mmHg</span>
                                </div>
                            </div>
                            <div className={styles.vitalCard}>
                                <div className={styles.vitalIcon}>💓</div>
                                <div className={styles.vitalInfo}>
                                    <span className={styles.vitalLabel}>Heart Rate</span>
                                    <span className={styles.vitalValue}>{vitalSigns.heartRate}</span>
                                    <span className={styles.vitalUnit}>bpm</span>
                                </div>
                            </div>
                            <div className={styles.vitalCard}>
                                <div className={styles.vitalIcon}>🌡️</div>
                                <div className={styles.vitalInfo}>
                                    <span className={styles.vitalLabel}>Temperature</span>
                                    <span className={styles.vitalValue}>{vitalSigns.temperature}</span>
                                    <span className={styles.vitalUnit}>°F</span>
                                </div>
                            </div>
                            <div className={styles.vitalCard}>
                                <div className={styles.vitalIcon}>⚖️</div>
                                <div className={styles.vitalInfo}>
                                    <span className={styles.vitalLabel}>Weight</span>
                                    <span className={styles.vitalValue}>{vitalSigns.weight}</span>
                                    <span className={styles.vitalUnit}>kg</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Active Medications */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Active Medications</h2>
                        <div className={styles.medicationsList}>
                            {medications
                                .filter((med) => med.status === "Active")
                                .map((med, index) => (
                                    <div key={index} className={styles.medicationItem}>
                                        <div>
                                            <strong>{med.name}</strong> - {med.dosage}
                                        </div>
                                        <div className={styles.medicationFrequency}>{med.frequency}</div>
                                    </div>
                                ))}
                        </div>
                    </section>

                    {/* Recent Encounters */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Recent Visits</h2>
                        <div className={styles.encountersList}>
                            {filteredEncounters.slice(0, 3).map((encounter) => (
                                <div key={encounter.id} className={styles.encounterItem}>
                                    <div className={styles.encounterHeader}>
                                        <span className={styles.encounterDate}>{formatDate(encounter.date)}</span>
                                        <span className={styles.encounterDepartment}>{encounter.department}</span>
                                    </div>
                                    <div className={styles.encounterDoctor}>{encounter.doctor}</div>
                                    <div className={styles.encounterDiagnosis}>{encounter.diagnosis}</div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {/* Encounters Tab */}
            {activeTab === "encounters" && (
                <div className={styles.content}>
                    <div className={styles.encountersGrid}>
                        {filteredEncounters.map((encounter) => (
                            <div key={encounter.id} className={styles.encounterCard}>
                                <div className={styles.cardHeader}>
                                    <div>
                                        <div className={styles.encounterDate}>{formatDate(encounter.date)}</div>
                                        <div className={styles.encounterDoctor}>{encounter.doctor}</div>
                                        <div className={styles.encounterDepartment}>{encounter.department}</div>
                                    </div>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.field}>
                                        <strong>Diagnosis:</strong>
                                        <p>{encounter.diagnosis}</p>
                                    </div>
                                    <div className={styles.field}>
                                        <strong>Notes:</strong>
                                        <p>{encounter.notes}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Medications Tab */}
            {activeTab === "medications" && (
                <div className={styles.content}>
                    <div className={styles.medicationCards}>
                        {filteredMedications.map((med, index) => (
                            <div key={index} className={styles.medicationCard}>
                                <div className={styles.medHeader}>
                                    <h3 className={styles.medName}>{med.name}</h3>
                                    <span className={`${styles.statusBadge} ${styles[med.status.toLowerCase()]}`}>{med.status}</span>
                                </div>
                                <div className={styles.medDetails}>
                                    <div className={styles.medRow}>
                                        <span className={styles.medLabel}>Dosage:</span>
                                        <span className={styles.medValue}>{med.dosage}</span>
                                    </div>
                                    <div className={styles.medRow}>
                                        <span className={styles.medLabel}>Frequency:</span>
                                        <span className={styles.medValue}>{med.frequency}</span>
                                    </div>
                                    <div className={styles.medRow}>
                                        <span className={styles.medLabel}>Start Date:</span>
                                        <span className={styles.medValue}>{formatDate(med.startDate)}</span>
                                    </div>
                                    {med.endDate && (
                                        <div className={styles.medRow}>
                                            <span className={styles.medLabel}>End Date:</span>
                                            <span className={styles.medValue}>{formatDate(med.endDate)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Old table view hidden on mobile, shown on desktop */}
                    <div className={styles.medicationsTable}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Medication</th>
                                    <th>Dosage</th>
                                    <th>Frequency</th>
                                    <th>Start Date</th>
                                    <th>End Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMedications.map((med, index) => (
                                    <tr key={index}>
                                        <td>{med.name}</td>
                                        <td>{med.dosage}</td>
                                        <td>{med.frequency}</td>
                                        <td>{formatDate(med.startDate)}</td>
                                        <td>{med.endDate ? formatDate(med.endDate) : "Ongoing"}</td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[med.status.toLowerCase()]}`}>{med.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Lab Results Tab */}
            {activeTab === "labs" && (
                <div className={styles.content}>
                    <div className={styles.labsGrid}>
                        {filteredLabResults.map((lab) => (
                            <div key={lab.id} className={styles.labCard}>
                                <div className={styles.labHeader}>
                                    <h3>{lab.testName}</h3>
                                    <span className={`${styles.labStatus} ${getLabStatusClass(lab.status)}`}>{lab.status}</span>
                                </div>
                                <div className={styles.labBody}>
                                    <div className={styles.labDate}>📅 {formatDate(lab.date)}</div>
                                    <div className={styles.labResult}>
                                        <strong>Result:</strong> {lab.result}
                                    </div>
                                    <div className={styles.labRange}>
                                        <strong>Normal Range:</strong> {lab.normalRange}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

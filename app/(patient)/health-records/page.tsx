"use client";

import React, { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { SearchBar } from "@/components/SearchBar";
import styles from "./health-records.module.css";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { HealthRecordRepository } from "@/lib/firestore/repositories/HealthRecordRepository";
import { HealthRecordService } from "@/lib/services/HealthRecordService";
import { Patient, HealthRecord, Encounter, Medication } from "@/lib/types";

// Initialize services at module level
const healthRecordRepo = new HealthRecordRepository();
const healthRecordService = new HealthRecordService(healthRecordRepo);

interface VitalSigns {
    bloodPressure: string;
    heartRate: number;
    temperature: number;
    weight: number;
    height: number;
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
    const { user, loading: authLoading, userData } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"overview" | "encounters" | "medications" | "labs">("overview");
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);

    // Mock data for vitals (not in HealthRecord type yet)
    const [vitalSigns] = useState<VitalSigns>({
        bloodPressure: "120/80",
        heartRate: 72,
        temperature: 98.6,
        weight: 70,
        height: 170,
    });

    // Helper function to convert doctor IDs to names
    const getDoctorName = (doctorId: string) => {
        const doctors: Record<string, string> = {
            "doc-sarah": "Dr. Sarah Johnson",
            "doc-michael": "Dr. Michael Chen",
            "doc-emily": "Dr. Emily Williams",
        };
        return doctors[doctorId] || doctorId;
    };

    useEffect(() => {
        // Redirect if not authenticated
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        // Fetch health records when user is available
        if (user && userData) {
            fetchHealthRecords();
        }
    }, [user, userData, authLoading, router]);

    const fetchHealthRecords = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            // Try to get existing health record
            let record = await healthRecordService.getHealthRecordByPatientId(user.uid).catch(async (err) => {
                // If health record doesn't exist, create one automatically
                if (err.message === "Health record not found for patient") {
                    console.log("Creating initial health record for patient...");
                    const newRecord = await healthRecordRepo.create({
                        patientId: user.uid,
                        bloodType: "",
                        allergies: [],
                        chronicConditions: [],
                        encounters: [],
                    });
                    return healthRecordService.getHealthRecord(newRecord);
                }
                throw err; // Re-throw if it's a different error
            });

            setHealthRecord(record);
        } catch (err) {
            console.error("Error fetching health records:", err);
            setError("Failed to load health records. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string | Date) => {
        const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const formatTimestamp = (ts: any) => {
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return formatDate(date);
    };

    const getLabStatusClass = (status: string) => {
        return styles[status.toLowerCase()];
    };

    const handleSearch = (query?: string) => {
        console.log("Searching:", query);
    };

    const handleDownloadRecords = () => {
        if (!healthRecord) return;

        // Create a simple text summary of health records
        const recordsSummary = `
HEALTH RECORDS SUMMARY
========================

Patient: ${userData?.firstName} ${userData?.lastName}
Date Generated: ${new Date().toLocaleDateString()}

BASIC INFORMATION
-----------------
Blood Type: ${healthRecord.bloodType}

Allergies: ${healthRecord.allergies.length > 0 ? healthRecord.allergies.join(", ") : "None"}

Chronic Conditions: ${healthRecord.chronicConditions.length > 0 ? healthRecord.chronicConditions.join(", ") : "None"}

ENCOUNTERS (${healthRecord.encounters.length})
-----------------
${healthRecord.encounters
    .map(
        (e, i) => `
${i + 1}. Date: ${formatTimestamp(e.date)}
   Doctor: ${getDoctorName(e.doctorId)}
   Diagnosis: ${e.diagnosis}
   Notes: ${e.medicalNotes || "N/A"}
   Lab Results: ${e.labResults.length > 0 ? e.labResults.join(", ") : "None"}
`
    )
    .join("\n")}
========================
        `.trim();

        // Create a blob and download it
        const blob = new Blob([recordsSummary], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `health-records-${new Date().toISOString().split("T")[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Prepare data for display
    const encounters: Encounter[] = healthRecord?.encounters || [];
    const medications: Medication[] = healthRecord?.medications || [];

    // Note: Lab results are not in the current HealthRecord type
    // This would need to be added to the data model or fetched separately
    const labResults: LabResult[] = [];

    // Filter data based on search
    const filteredEncounters = encounters.filter(
        (e: Encounter) =>
            !searchQuery ||
            getDoctorName(e.doctorId).toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.medicalNotes.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredMedications = medications.filter((m: Medication) => !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const filteredLabResults = labResults.filter((l: LabResult) => !searchQuery || l.testName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (loading || authLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading health records...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <p>{error}</p>
                    <button onClick={fetchHealthRecords} className={styles.retryBtn}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!healthRecord) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <p>No health records found</p>
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
            <button className={styles.downloadBtn} onClick={handleDownloadRecords}>
                📥 Download Records
            </button>

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
                    {/* Health Profile */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Health Profile</h2>
                        <div className={styles.profileGrid}>
                            <div className={styles.profileCard}>
                                <div className={styles.profileIcon}>🩸</div>
                                <div className={styles.profileInfo}>
                                    <span className={styles.profileLabel}>Blood Type</span>
                                    <span className={styles.profileValue}>{healthRecord.bloodType || "Not specified"}</span>
                                </div>
                            </div>
                            <div className={styles.profileCard}>
                                <div className={styles.profileIcon}>⚠️</div>
                                <div className={styles.profileInfo}>
                                    <span className={styles.profileLabel}>Allergies</span>
                                    <span className={styles.profileValue}>
                                        {healthRecord.allergies.length > 0 ? healthRecord.allergies.join(", ") : "None"}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.profileCard}>
                                <div className={styles.profileIcon}>🏥</div>
                                <div className={styles.profileInfo}>
                                    <span className={styles.profileLabel}>Chronic Conditions</span>
                                    <span className={styles.profileValue}>
                                        {healthRecord.chronicConditions.length > 0 ? healthRecord.chronicConditions.join(", ") : "None"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

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
                        {medications.filter((med) => med.status === "Active").length > 0 ? (
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
                        ) : (
                            <div className={styles.emptyMessage}>
                                <p>💊 No active medications recorded</p>
                            </div>
                        )}
                    </section>

                    {/* Recent Encounters */}
                    <section className={styles.section}>
                        <h2 className={styles.sectionTitle}>Recent Visits</h2>
                        {filteredEncounters.length > 0 ? (
                            <div className={styles.encountersList}>
                                {filteredEncounters.slice(0, 3).map((encounter: Encounter) => (
                                    <div key={encounter.encounterId} className={styles.encounterItem}>
                                        <div className={styles.encounterHeader}>
                                            <span className={styles.encounterDate}>{formatTimestamp(encounter.date)}</span>
                                            <span className={styles.encounterDoctor}>{getDoctorName(encounter.doctorId)}</span>
                                        </div>
                                        <div className={styles.encounterDiagnosis}>
                                            <strong>Diagnosis:</strong> {encounter.diagnosis}
                                        </div>
                                        {encounter.medicalNotes && (
                                            <div className={styles.encounterNotes}>
                                                <strong>Notes:</strong> {encounter.medicalNotes}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={styles.emptyMessage}>
                                <p>🏥 No recent visits recorded</p>
                            </div>
                        )}
                    </section>
                </div>
            )}

            {/* Encounters Tab */}
            {activeTab === "encounters" && (
                <div className={styles.content}>
                    {filteredEncounters.length > 0 ? (
                        <div className={styles.encountersGrid}>
                            {filteredEncounters.map((encounter: Encounter) => (
                                <div key={encounter.encounterId} className={styles.encounterCard}>
                                    <div className={styles.cardHeader}>
                                        <div>
                                            <div className={styles.encounterDate}>📅 {formatTimestamp(encounter.date)}</div>
                                            <div className={styles.encounterDoctor}>👨‍⚕️ {getDoctorName(encounter.doctorId)}</div>
                                        </div>
                                    </div>
                                    <div className={styles.cardBody}>
                                        <div className={styles.field}>
                                            <strong>Diagnosis:</strong>
                                            <p>{encounter.diagnosis}</p>
                                        </div>
                                        {encounter.medicalNotes && (
                                            <div className={styles.field}>
                                                <strong>Medical Notes:</strong>
                                                <p>{encounter.medicalNotes}</p>
                                            </div>
                                        )}
                                        {encounter.labResults && encounter.labResults.length > 0 && (
                                            <div className={styles.field}>
                                                <strong>Lab Results:</strong>
                                                <ul className={styles.labResultsList}>
                                                    {encounter.labResults.map((result: string, idx: number) => (
                                                        <li key={idx}>🔬 {result}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🏥</div>
                            <h3>No encounters found</h3>
                            <p>{searchQuery ? "Try adjusting your search query" : "No medical encounters recorded yet"}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Medications Tab */}
            {activeTab === "medications" && (
                <div className={styles.content}>
                    {filteredMedications.length > 0 ? (
                        <>
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
                                                <span className={styles.medLabel}>Prescribed By:</span>
                                                <span className={styles.medValue}>{getDoctorName(med.prescribedBy)}</span>
                                            </div>
                                            <div className={styles.medRow}>
                                                <span className={styles.medLabel}>Start Date:</span>
                                                <span className={styles.medValue}>{formatTimestamp(med.startDate)}</span>
                                            </div>
                                            {med.endDate && (
                                                <div className={styles.medRow}>
                                                    <span className={styles.medLabel}>End Date:</span>
                                                    <span className={styles.medValue}>{formatTimestamp(med.endDate)}</span>
                                                </div>
                                            )}
                                            {med.notes && (
                                                <div className={styles.medRow}>
                                                    <span className={styles.medLabel}>Notes:</span>
                                                    <span className={styles.medValue}>{med.notes}</span>
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
                                            <th>Prescribed By</th>
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
                                                <td>{getDoctorName(med.prescribedBy)}</td>
                                                <td>{formatTimestamp(med.startDate)}</td>
                                                <td>{med.endDate ? formatTimestamp(med.endDate) : "Ongoing"}</td>
                                                <td>
                                                    <span className={`${styles.statusBadge} ${styles[med.status.toLowerCase()]}`}>{med.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>💊</div>
                            <h3>No medications found</h3>
                            <p>{searchQuery ? "Try adjusting your search query" : "Medication records are not currently tracked in the system"}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Lab Results Tab */}
            {activeTab === "labs" && (
                <div className={styles.content}>
                    {filteredLabResults.length > 0 ? (
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
                    ) : (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🔬</div>
                            <h3>No lab results found</h3>
                            <p>
                                {searchQuery
                                    ? "Try adjusting your search query"
                                    : "Lab results are stored within encounter records. Check the Encounters tab for detailed lab results."}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

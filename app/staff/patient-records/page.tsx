"use client";

import React, { useState, useEffect } from "react";
import styles from "./page.module.css";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { PatientRepository } from "@/lib/firestore/repositories/PatientRepository";
import { HealthRecordRepository } from "@/lib/firestore/repositories/HealthRecordRepository";
import { HealthRecordService } from "@/lib/services/HealthRecordService";
import { Patient, HealthRecord, Encounter, Medication } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

// Initialize services at module level
const patientRepo = new PatientRepository();
const healthRecordRepo = new HealthRecordRepository();
const healthRecordService = new HealthRecordService(healthRecordRepo);

export default function PatientRecordsPage() {
    const { user, loading: authLoading, userData } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [healthRecord, setHealthRecord] = useState<HealthRecord | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showAddEncounterModal, setShowAddEncounterModal] = useState(false);
    const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
    const [showAddMedicationModal, setShowAddMedicationModal] = useState(false);
    const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
    const [showUpdateMedicationModal, setShowUpdateMedicationModal] = useState(false);

    // Update forms state
    const [bloodType, setBloodType] = useState("");
    const [allergies, setAllergies] = useState("");
    const [chronicConditions, setChronicConditions] = useState("");

    // Add encounter form state
    const [encounterDiagnosis, setEncounterDiagnosis] = useState("");
    const [encounterNotes, setEncounterNotes] = useState("");
    const [encounterLabResults, setEncounterLabResults] = useState("");
    const [doctorId, setDoctorId] = useState("doc-sarah");

    // Update medical notes state
    const [showUpdateNotesModal, setShowUpdateNotesModal] = useState(false);
    const [updatedNotes, setUpdatedNotes] = useState("");

    // Medication form state
    const [medicationName, setMedicationName] = useState("");
    const [medicationDosage, setMedicationDosage] = useState("");
    const [medicationFrequency, setMedicationFrequency] = useState("");
    const [medicationStartDate, setMedicationStartDate] = useState("");
    const [medicationEndDate, setMedicationEndDate] = useState("");
    const [medicationStatus, setMedicationStatus] = useState<"Active" | "Completed" | "Discontinued">("Active");
    const [medicationNotes, setMedicationNotes] = useState("");

    useEffect(() => {
        // Redirect if not authenticated or not staff
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        if (user && userData) {
            fetchPatients();
        }
    }, [user, userData, authLoading, router]);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            setError(null);
            const allPatients = await patientRepo.findAll({ limit: 1000 });
            setPatients(allPatients);
        } catch (err) {
            console.error("Error fetching patients:", err);
            setError("Failed to load patients. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSelectPatient = async (patient: Patient) => {
        setSelectedPatient(patient);
        setLoading(true);
        try {
            // Fetch health record for selected patient
            let record = await healthRecordService.getHealthRecordByPatientId(patient.id).catch(async (err) => {
                // Auto-create if doesn't exist
                if (err.message === "Health record not found for patient") {
                    const newRecord = await healthRecordRepo.create({
                        patientId: patient.id,
                        bloodType: "",
                        allergies: [],
                        chronicConditions: [],
                        encounters: [],
                    });
                    return healthRecordService.getHealthRecord(newRecord);
                }
                throw err;
            });

            setHealthRecord(record);
            // Populate form with current data
            setBloodType(record.bloodType || "");
            setAllergies(record.allergies.join(", "));
            setChronicConditions(record.chronicConditions.join(", "));
        } catch (err) {
            console.error("Error fetching health record:", err);
            setError("Failed to load health record.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBasicInfo = async () => {
        if (!healthRecord) return;

        try {
            await healthRecordService.updateHealthRecord(healthRecord.id, {
                patientId: healthRecord.patientId,
                bloodType: bloodType,
                allergies: allergies
                    .split(",")
                    .map((a) => a.trim())
                    .filter(Boolean),
                chronicConditions: chronicConditions
                    .split(",")
                    .map((c) => c.trim())
                    .filter(Boolean),
            });

            // Refresh health record
            const updated = await healthRecordService.getHealthRecord(healthRecord.id);
            setHealthRecord(updated);
            setShowUpdateModal(false);
            alert("Health record updated successfully!");
        } catch (err: any) {
            console.error("Error updating health record:", err);
            alert(err.message || "Failed to update health record.");
        }
    };

    const handleAddEncounter = async () => {
        if (!selectedPatient) return;

        try {
            const labResultsArray = encounterLabResults
                .split(",")
                .map((r) => r.trim())
                .filter(Boolean);

            await healthRecordService.addEncounter(selectedPatient.id, {
                date: Timestamp.now(),
                diagnosis: encounterDiagnosis,
                medicalNotes: encounterNotes,
                labResults: labResultsArray,
                doctorId: doctorId,
            });

            // Refresh health record
            const updated = await healthRecordService.getHealthRecordByPatientId(selectedPatient.id);
            setHealthRecord(updated);

            // Reset form
            setEncounterDiagnosis("");
            setEncounterNotes("");
            setEncounterLabResults("");
            setDoctorId("doc-sarah");
            setShowAddEncounterModal(false);

            alert("Encounter added successfully!");
        } catch (err: any) {
            console.error("Error adding encounter:", err);
            alert(err.message || "Failed to add encounter.");
        }
    };

    const handleUpdateMedicalNotes = async () => {
        if (!selectedPatient || !selectedEncounter) return;

        try {
            await healthRecordService.updateMedicalNotes(selectedPatient.id, selectedEncounter.encounterId, updatedNotes, doctorId);

            // Refresh health record
            const updated = await healthRecordService.getHealthRecordByPatientId(selectedPatient.id);
            setHealthRecord(updated);

            setShowUpdateNotesModal(false);
            setSelectedEncounter(null);
            setUpdatedNotes("");

            alert("Medical notes updated successfully!");
        } catch (err: any) {
            console.error("Error updating medical notes:", err);
            alert(err.message || "Failed to update medical notes.");
        }
    };

    const handleAddMedication = async () => {
        if (!selectedPatient) return;

        try {
            const startDate = medicationStartDate ? Timestamp.fromDate(new Date(medicationStartDate)) : Timestamp.now();
            const endDate = medicationEndDate ? Timestamp.fromDate(new Date(medicationEndDate)) : undefined;

            await healthRecordService.addMedication(selectedPatient.id, {
                name: medicationName,
                dosage: medicationDosage,
                frequency: medicationFrequency,
                startDate: startDate,
                endDate: endDate,
                status: medicationStatus,
                prescribedBy: doctorId,
                notes: medicationNotes,
            });

            // Refresh health record
            const updated = await healthRecordService.getHealthRecordByPatientId(selectedPatient.id);
            setHealthRecord(updated);

            // Reset form
            setMedicationName("");
            setMedicationDosage("");
            setMedicationFrequency("");
            setMedicationStartDate("");
            setMedicationEndDate("");
            setMedicationStatus("Active");
            setMedicationNotes("");
            setDoctorId("doc-sarah");
            setShowAddMedicationModal(false);

            alert("Medication added successfully!");
        } catch (err: any) {
            console.error("Error adding medication:", err);
            alert(err.message || "Failed to add medication.");
        }
    };

    const handleUpdateMedication = async () => {
        if (!selectedPatient || !selectedMedication) return;

        try {
            const updates: any = {
                name: medicationName,
                dosage: medicationDosage,
                frequency: medicationFrequency,
                status: medicationStatus,
                notes: medicationNotes,
            };

            if (medicationStartDate) {
                updates.startDate = Timestamp.fromDate(new Date(medicationStartDate));
            }

            if (medicationEndDate) {
                updates.endDate = Timestamp.fromDate(new Date(medicationEndDate));
            }

            await healthRecordService.updateMedication(selectedPatient.id, selectedMedication.medicationId, updates);

            // Refresh health record
            const updated = await healthRecordService.getHealthRecordByPatientId(selectedPatient.id);
            setHealthRecord(updated);

            setShowUpdateMedicationModal(false);
            setSelectedMedication(null);

            alert("Medication updated successfully!");
        } catch (err: any) {
            console.error("Error updating medication:", err);
            alert(err.message || "Failed to update medication.");
        }
    };

    const formatDate = (ts: any) => {
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const getDoctorName = (doctorId: string) => {
        const doctors: Record<string, string> = {
            "doc-sarah": "Dr. Sarah Johnson",
            "doc-michael": "Dr. Michael Chen",
            "doc-emily": "Dr. Emily Williams",
        };
        return doctors[doctorId] || doctorId;
    };

    const filteredPatients = patients.filter(
        (p) =>
            !searchQuery ||
            p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading || authLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (error && !selectedPatient) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <p>{error}</p>
                    <button onClick={fetchPatients} className={styles.retryBtn}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Patient Health Records</h1>
                <p className={styles.subtitle}>Manage and update patient health information</p>
            </header>

            <div className={styles.contentWrapper}>
                {/* Patient Selection Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                    </div>

                    <div className={styles.patientList}>
                        {filteredPatients.length === 0 ? (
                            <div className={styles.emptyMessage}>No patients found</div>
                        ) : (
                            filteredPatients.map((patient) => (
                                <div
                                    key={patient.id}
                                    className={`${styles.patientItem} ${selectedPatient?.id === patient.id ? styles.selected : ""}`}
                                    onClick={() => handleSelectPatient(patient)}
                                >
                                    <div className={styles.patientName}>
                                        {patient.firstName} {patient.lastName}
                                    </div>
                                    <div className={styles.patientEmail}>{patient.email}</div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>

                {/* Health Record Details */}
                <main className={styles.mainContent}>
                    {!selectedPatient ? (
                        <div className={styles.placeholder}>
                            <div className={styles.placeholderIcon}>📋</div>
                            <h3>Select a Patient</h3>
                            <p>Choose a patient from the list to view and update their health records</p>
                        </div>
                    ) : !healthRecord ? (
                        <div className={styles.loading}>
                            <div className={styles.spinner}></div>
                            <p>Loading health record...</p>
                        </div>
                    ) : (
                        <>
                            {/* Patient Header */}
                            <div className={styles.patientHeader}>
                                <div>
                                    <h2 className={styles.patientTitle}>
                                        {selectedPatient.firstName} {selectedPatient.lastName}
                                    </h2>
                                    <p className={styles.patientInfo}>
                                        {selectedPatient.email} • {formatDate(selectedPatient.dateOfBirth)}
                                    </p>
                                </div>
                                <button className={styles.updateBtn} onClick={() => setShowUpdateModal(true)}>
                                    Update Basic Info
                                </button>
                            </div>

                            {/* Basic Health Info */}
                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>Basic Health Information</h3>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoCard}>
                                        <span className={styles.infoLabel}>Blood Type</span>
                                        <span className={styles.infoValue}>{healthRecord.bloodType || "Not specified"}</span>
                                    </div>
                                    <div className={styles.infoCard}>
                                        <span className={styles.infoLabel}>Allergies</span>
                                        <span className={styles.infoValue}>
                                            {healthRecord.allergies.length > 0 ? healthRecord.allergies.join(", ") : "None"}
                                        </span>
                                    </div>
                                    <div className={styles.infoCard}>
                                        <span className={styles.infoLabel}>Chronic Conditions</span>
                                        <span className={styles.infoValue}>
                                            {healthRecord.chronicConditions.length > 0 ? healthRecord.chronicConditions.join(", ") : "None"}
                                        </span>
                                    </div>
                                </div>
                            </section>

                            {/* Encounters */}
                            <section className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <h3 className={styles.sectionTitle}>Medical Encounters ({healthRecord.encounters.length})</h3>
                                    <button className={styles.addBtn} onClick={() => setShowAddEncounterModal(true)}>
                                        + Add Encounter
                                    </button>
                                </div>

                                {healthRecord.encounters.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <p>No encounters recorded</p>
                                    </div>
                                ) : (
                                    <div className={styles.encountersList}>
                                        {healthRecord.encounters.map((encounter) => (
                                            <div key={encounter.encounterId} className={styles.encounterCard}>
                                                <div className={styles.encounterHeader}>
                                                    <div>
                                                        <div className={styles.encounterDate}>{formatDate(encounter.date)}</div>
                                                        <div className={styles.encounterDoctor}>{getDoctorName(encounter.doctorId)}</div>
                                                    </div>
                                                    <button
                                                        className={styles.editBtn}
                                                        onClick={() => {
                                                            setSelectedEncounter(encounter);
                                                            setUpdatedNotes(encounter.medicalNotes);
                                                            setShowUpdateNotesModal(true);
                                                        }}
                                                    >
                                                        Edit Notes
                                                    </button>
                                                </div>
                                                <div className={styles.encounterBody}>
                                                    <div className={styles.encounterField}>
                                                        <strong>Diagnosis:</strong> {encounter.diagnosis}
                                                    </div>
                                                    {encounter.medicalNotes && (
                                                        <div className={styles.encounterField}>
                                                            <strong>Medical Notes:</strong> {encounter.medicalNotes}
                                                        </div>
                                                    )}
                                                    {encounter.labResults.length > 0 && (
                                                        <div className={styles.encounterField}>
                                                            <strong>Lab Results:</strong>
                                                            <ul className={styles.labList}>
                                                                {encounter.labResults.map((result, idx) => (
                                                                    <li key={idx}>{result}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Medications */}
                            <section className={styles.section}>
                                <div className={styles.sectionHeader}>
                                    <h3 className={styles.sectionTitle}>Medications ({healthRecord.medications?.length || 0})</h3>
                                    <button className={styles.addBtn} onClick={() => setShowAddMedicationModal(true)}>
                                        + Add Medication
                                    </button>
                                </div>

                                {!healthRecord.medications || healthRecord.medications.length === 0 ? (
                                    <div className={styles.emptyState}>
                                        <p>No medications recorded</p>
                                    </div>
                                ) : (
                                    <div className={styles.medicationsList}>
                                        {healthRecord.medications.map((medication) => (
                                            <div key={medication.medicationId} className={styles.medicationCard}>
                                                <div className={styles.medicationHeader}>
                                                    <div>
                                                        <div className={styles.medicationName}>{medication.name}</div>
                                                        <div className={styles.medicationDosage}>
                                                            {medication.dosage} - {medication.frequency}
                                                        </div>
                                                    </div>
                                                    <div className={styles.medicationActions}>
                                                        <span className={`${styles.statusBadge} ${styles[medication.status.toLowerCase()]}`}>
                                                            {medication.status}
                                                        </span>
                                                        <button
                                                            className={styles.editBtn}
                                                            onClick={() => {
                                                                setSelectedMedication(medication);
                                                                setMedicationName(medication.name);
                                                                setMedicationDosage(medication.dosage);
                                                                setMedicationFrequency(medication.frequency);
                                                                setMedicationStartDate(
                                                                    formatDate(medication.startDate).split("/").reverse().join("-")
                                                                );
                                                                setMedicationEndDate(
                                                                    medication.endDate
                                                                        ? formatDate(medication.endDate).split("/").reverse().join("-")
                                                                        : ""
                                                                );
                                                                setMedicationStatus(medication.status);
                                                                setMedicationNotes(medication.notes || "");
                                                                setShowUpdateMedicationModal(true);
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className={styles.medicationBody}>
                                                    <div className={styles.medicationField}>
                                                        <strong>Prescribed By:</strong> {getDoctorName(medication.prescribedBy)}
                                                    </div>
                                                    <div className={styles.medicationField}>
                                                        <strong>Start Date:</strong> {formatDate(medication.startDate)}
                                                    </div>
                                                    {medication.endDate && (
                                                        <div className={styles.medicationField}>
                                                            <strong>End Date:</strong> {formatDate(medication.endDate)}
                                                        </div>
                                                    )}
                                                    {medication.notes && (
                                                        <div className={styles.medicationField}>
                                                            <strong>Notes:</strong> {medication.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </main>
            </div>

            {/* Update Basic Info Modal */}
            {showUpdateModal && (
                <div className={styles.modalOverlay} onClick={() => setShowUpdateModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Update Basic Health Information</h2>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Blood Type</label>
                            <select value={bloodType} onChange={(e) => setBloodType(e.target.value)} className={styles.select}>
                                <option value="">Select blood type</option>
                                <option value="A+">A+</option>
                                <option value="A-">A-</option>
                                <option value="B+">B+</option>
                                <option value="B-">B-</option>
                                <option value="AB+">AB+</option>
                                <option value="AB-">AB-</option>
                                <option value="O+">O+</option>
                                <option value="O-">O-</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Allergies (comma-separated)</label>
                            <input
                                type="text"
                                value={allergies}
                                onChange={(e) => setAllergies(e.target.value)}
                                placeholder="e.g., Penicillin, Peanuts"
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Chronic Conditions (comma-separated)</label>
                            <input
                                type="text"
                                value={chronicConditions}
                                onChange={(e) => setChronicConditions(e.target.value)}
                                placeholder="e.g., Diabetes, Hypertension"
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowUpdateModal(false)}>
                                Cancel
                            </button>
                            <button className={styles.saveBtn} onClick={handleUpdateBasicInfo}>
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Encounter Modal */}
            {showAddEncounterModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAddEncounterModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Add New Encounter</h2>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Doctor</label>
                            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={styles.select}>
                                <option value="doc-sarah">Dr. Sarah Johnson</option>
                                <option value="doc-michael">Dr. Michael Chen</option>
                                <option value="doc-emily">Dr. Emily Williams</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Diagnosis *</label>
                            <input
                                type="text"
                                value={encounterDiagnosis}
                                onChange={(e) => setEncounterDiagnosis(e.target.value)}
                                placeholder="Enter diagnosis"
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Medical Notes</label>
                            <textarea
                                value={encounterNotes}
                                onChange={(e) => setEncounterNotes(e.target.value)}
                                placeholder="Enter medical notes and observations"
                                className={styles.textarea}
                                rows={4}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Lab Results (comma-separated)</label>
                            <input
                                type="text"
                                value={encounterLabResults}
                                onChange={(e) => setEncounterLabResults(e.target.value)}
                                placeholder="e.g., Blood test: Normal, X-ray: Clear"
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowAddEncounterModal(false)}>
                                Cancel
                            </button>
                            <button className={styles.saveBtn} onClick={handleAddEncounter} disabled={!encounterDiagnosis.trim()}>
                                Add Encounter
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Medical Notes Modal */}
            {showUpdateNotesModal && selectedEncounter && (
                <div className={styles.modalOverlay} onClick={() => setShowUpdateNotesModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Update Medical Notes</h2>

                        <div className={styles.encounterInfo}>
                            <p>
                                <strong>Date:</strong> {formatDate(selectedEncounter.date)}
                            </p>
                            <p>
                                <strong>Diagnosis:</strong> {selectedEncounter.diagnosis}
                            </p>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Medical Notes</label>
                            <textarea
                                value={updatedNotes}
                                onChange={(e) => setUpdatedNotes(e.target.value)}
                                placeholder="Enter updated medical notes"
                                className={styles.textarea}
                                rows={6}
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowUpdateNotesModal(false)}>
                                Cancel
                            </button>
                            <button className={styles.saveBtn} onClick={handleUpdateMedicalNotes}>
                                Update Notes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Medication Modal */}
            {showAddMedicationModal && (
                <div className={styles.modalOverlay} onClick={() => setShowAddMedicationModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Add New Medication</h2>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Prescribing Doctor</label>
                            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} className={styles.select}>
                                <option value="doc-sarah">Dr. Sarah Johnson</option>
                                <option value="doc-michael">Dr. Michael Chen</option>
                                <option value="doc-emily">Dr. Emily Williams</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Medication Name *</label>
                            <input
                                type="text"
                                value={medicationName}
                                onChange={(e) => setMedicationName(e.target.value)}
                                placeholder="e.g., Aspirin, Lisinopril"
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Dosage *</label>
                            <input
                                type="text"
                                value={medicationDosage}
                                onChange={(e) => setMedicationDosage(e.target.value)}
                                placeholder="e.g., 100mg, 5ml"
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Frequency *</label>
                            <input
                                type="text"
                                value={medicationFrequency}
                                onChange={(e) => setMedicationFrequency(e.target.value)}
                                placeholder="e.g., Twice daily, Once a day"
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Start Date</label>
                                <input
                                    type="date"
                                    value={medicationStartDate}
                                    onChange={(e) => setMedicationStartDate(e.target.value)}
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>End Date (Optional)</label>
                                <input
                                    type="date"
                                    value={medicationEndDate}
                                    onChange={(e) => setMedicationEndDate(e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Status</label>
                            <select
                                value={medicationStatus}
                                onChange={(e) => setMedicationStatus(e.target.value as "Active" | "Completed" | "Discontinued")}
                                className={styles.select}
                            >
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="Discontinued">Discontinued</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Notes (Optional)</label>
                            <textarea
                                value={medicationNotes}
                                onChange={(e) => setMedicationNotes(e.target.value)}
                                placeholder="Any special instructions or notes"
                                className={styles.textarea}
                                rows={3}
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowAddMedicationModal(false)}>
                                Cancel
                            </button>
                            <button
                                className={styles.saveBtn}
                                onClick={handleAddMedication}
                                disabled={!medicationName.trim() || !medicationDosage.trim() || !medicationFrequency.trim()}
                            >
                                Add Medication
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Medication Modal */}
            {showUpdateMedicationModal && selectedMedication && (
                <div className={styles.modalOverlay} onClick={() => setShowUpdateMedicationModal(false)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Update Medication</h2>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Medication Name *</label>
                            <input
                                type="text"
                                value={medicationName}
                                onChange={(e) => setMedicationName(e.target.value)}
                                placeholder="e.g., Aspirin, Lisinopril"
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Dosage *</label>
                            <input
                                type="text"
                                value={medicationDosage}
                                onChange={(e) => setMedicationDosage(e.target.value)}
                                placeholder="e.g., 100mg, 5ml"
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Frequency *</label>
                            <input
                                type="text"
                                value={medicationFrequency}
                                onChange={(e) => setMedicationFrequency(e.target.value)}
                                placeholder="e.g., Twice daily, Once a day"
                                className={styles.input}
                                required
                            />
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Start Date</label>
                                <input
                                    type="date"
                                    value={medicationStartDate}
                                    onChange={(e) => setMedicationStartDate(e.target.value)}
                                    className={styles.input}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.label}>End Date (Optional)</label>
                                <input
                                    type="date"
                                    value={medicationEndDate}
                                    onChange={(e) => setMedicationEndDate(e.target.value)}
                                    className={styles.input}
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Status</label>
                            <select
                                value={medicationStatus}
                                onChange={(e) => setMedicationStatus(e.target.value as "Active" | "Completed" | "Discontinued")}
                                className={styles.select}
                            >
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                                <option value="Discontinued">Discontinued</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Notes (Optional)</label>
                            <textarea
                                value={medicationNotes}
                                onChange={(e) => setMedicationNotes(e.target.value)}
                                placeholder="Any special instructions or notes"
                                className={styles.textarea}
                                rows={3}
                            />
                        </div>

                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setShowUpdateMedicationModal(false)}>
                                Cancel
                            </button>
                            <button
                                className={styles.saveBtn}
                                onClick={handleUpdateMedication}
                                disabled={!medicationName.trim() || !medicationDosage.trim() || !medicationFrequency.trim()}
                            >
                                Update Medication
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

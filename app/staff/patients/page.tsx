"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Patient } from "@/lib/types";
import { PatientCard } from "@/components/PatientCard";
import styles from "./page.module.css";

export default function PatientsPage() {
    const router = useRouter();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // Fetch all patients on mount
    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch("/api/patients");

            if (!response.ok) {
                throw new Error("Failed to fetch patients");
            }

            const data = await response.json();
            if (data.success) {
                setPatients(data.data);
            } else {
                throw new Error(data.error || "Failed to load patients");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();

        if (searchTerm.trim().length < 2) {
            setError("Search term must be at least 2 characters");
            return;
        }

        try {
            setIsSearching(true);
            setError(null);
            const response = await fetch(`/api/patients?search=${encodeURIComponent(searchTerm)}`);

            if (!response.ok) {
                throw new Error("Search failed");
            }

            const data = await response.json();
            if (data.success) {
                setPatients(data.data);
            } else {
                throw new Error(data.error || "Search failed");
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Search failed");
        } finally {
            setIsSearching(false);
        }
    };

    const handleClearSearch = () => {
        setSearchTerm("");
        fetchPatients();
    };

    const handleViewPatient = (id: string) => {
        router.push(`/patients/${id}`);
    };

    const handleEditPatient = (id: string) => {
        router.push(`/patients/${id}/edit`);
    };

    const handleNewPatient = () => {
        router.push("/staff/patients/new");
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Patients</h1>
                <button className={styles.btnNew} onClick={handleNewPatient}>
                    + New Patient
                </button>
            </div>

            {/* Search Bar */}
            <form className={styles.searchForm} onSubmit={handleSearch}>
                <input
                    type="text"
                    className={styles.searchInput}
                    placeholder="Search by name, email, or contact number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className={styles.btnSearch} disabled={isSearching}>
                    {isSearching ? "Searching..." : "Search"}
                </button>
                {searchTerm && (
                    <button type="button" className={styles.btnClear} onClick={handleClearSearch}>
                        Clear
                    </button>
                )}
            </form>

            {/* Error Message */}
            {error && (
                <div className={styles.error}>
                    <p>{error}</p>
                    <button onClick={fetchPatients} className={styles.btnRetry}>
                        Retry
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading patients...</p>
                </div>
            )}

            {/* Patients Grid */}
            {!loading && !error && (
                <>
                    {patients.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No patients found</p>
                            {searchTerm && <button onClick={handleClearSearch}>Clear search</button>}
                        </div>
                    ) : (
                        <>
                            <div className={styles.stats}>
                                <p>
                                    Showing {patients.length} patient{patients.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                            <div className={styles.grid}>
                                {patients.map((patient) => (
                                    <PatientCard key={patient.id} patient={patient} onView={handleViewPatient} onEdit={handleEditPatient} />
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

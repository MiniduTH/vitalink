"use client";

import React, { useState, useEffect } from "react";
import styles from "./profile.module.css";
import { Timestamp, doc, setDoc } from "firebase/firestore";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { PatientRepository } from "@/lib/firestore/repositories/PatientRepository";
import { HealthRecordRepository } from "@/lib/firestore/repositories/HealthRecordRepository";
import { PatientService } from "@/lib/services/PatientService";
import { Patient, CreatePatientDTO } from "@/lib/types";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";

// Initialize services at module level
const patientRepo = new PatientRepository();
const healthRecordRepo = new HealthRecordRepository();
const patientService = new PatientService(patientRepo, healthRecordRepo);

export default function PatientProfile() {
    const { user, loading: authLoading, userData } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<"personal" | "security">("personal");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [profileData, setProfileData] = useState<Patient | null>(null);
    const [formData, setFormData] = useState<Partial<CreatePatientDTO>>({});
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        // Redirect if not authenticated
        if (!authLoading && !user) {
            router.push("/login");
            return;
        }

        // Fetch patient data when user is available
        if (user && userData) {
            fetchPatientData();
        }
    }, [user, userData, authLoading, router]);

    const fetchPatientData = async () => {
        if (!user) return;

        try {
            setLoading(true);
            setError(null);

            // Try to get existing patient data
            let patient = await patientService.getPatient(user.uid).catch(async (err) => {
                // If patient doesn't exist, create from userData
                if (err.message === "Patient not found" && userData) {
                    console.log("Creating patient profile from user data...");

                    // Create patient document in Firestore using setDoc to use the user's UID as document ID
                    const patientDocRef = doc(db, "patients", user.uid);
                    await setDoc(patientDocRef, {
                        firstName: userData.firstName || "User",
                        lastName: userData.lastName || "Name",
                        email: userData.email || user.email || "",
                        contactNumber: userData.contactNumber || "",
                        dateOfBirth: userData.dateOfBirth || Timestamp.fromDate(new Date("2000-01-01")),
                        gender: userData.gender || "Other",
                        address: userData.address || "",
                        emergencyContact: userData.emergencyContact || {
                            name: "",
                            relationship: "",
                            phone: "",
                        },
                        createdAt: Timestamp.now(),
                        updatedAt: Timestamp.now(),
                    });

                    // Fetch the newly created patient
                    return patientService.getPatient(user.uid);
                }
                throw err; // Re-throw if it's a different error
            });

            setProfileData(patient);
            setFormData({
                firstName: patient.firstName,
                lastName: patient.lastName,
                email: patient.email,
                contactNumber: patient.contactNumber,
                dateOfBirth: patient.dateOfBirth,
                gender: patient.gender,
                address: patient.address,
                emergencyContact: patient.emergencyContact,
            });
        } catch (err) {
            console.error("Error fetching patient data:", err);
            setError("Failed to load profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name.startsWith("emergencyContact.")) {
            const field = name.split(".")[1];
            setFormData({
                ...formData,
                emergencyContact: {
                    ...(formData.emergencyContact || { name: "", relationship: "", phone: "" }),
                    [field]: value,
                },
            });
        } else if (name === "dateOfBirth") {
            setFormData({
                ...formData,
                [name]: Timestamp.fromDate(new Date(value)),
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleSaveProfile = async () => {
        if (!user || !formData) return;

        setSaveLoading(true);
        try {
            await patientService.updatePatient(user.uid, formData as Partial<CreatePatientDTO>);
            await fetchPatientData(); // Refresh data
            setIsEditing(false);
            alert("Profile updated successfully!");
        } catch (err: any) {
            console.error("Error updating profile:", err);
            alert(err.message || "Failed to update profile. Please try again.");
        } finally {
            setSaveLoading(false);
        }
    };

    const handleCancelEdit = () => {
        if (profileData) {
            setFormData({
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                email: profileData.email,
                contactNumber: profileData.contactNumber,
                dateOfBirth: profileData.dateOfBirth,
                gender: profileData.gender,
                address: profileData.address,
                emergencyContact: profileData.emergencyContact,
            });
        }
        setIsEditing(false);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            alert("New passwords do not match!");
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            alert("Password must be at least 8 characters long!");
            return;
        }

        if (!auth.currentUser || !user?.email) {
            alert("Not authenticated");
            return;
        }

        try {
            // Reauthenticate user before changing password
            const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);

            // Update password
            await updatePassword(auth.currentUser, passwordForm.newPassword);

            alert("Password updated successfully!");
            setPasswordForm({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (err: any) {
            console.error("Error changing password:", err);
            if (err.code === "auth/wrong-password") {
                alert("Current password is incorrect");
            } else if (err.code === "auth/requires-recent-login") {
                alert("Please log out and log in again before changing your password");
            } else {
                alert(err.message || "Failed to change password. Please try again.");
            }
        }
    };

    const formatDate = (ts: Timestamp | string) => {
        if (!ts) return "N/A";
        const date = typeof ts === "string" ? new Date(ts) : (ts as Timestamp).toDate();
        return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    };

    const formatDateForInput = (ts: Timestamp | string | undefined) => {
        if (!ts) return "";
        const date = typeof ts === "string" ? new Date(ts) : (ts as Timestamp).toDate();
        return date.toISOString().split("T")[0];
    };

    if (loading || authLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <p>{error}</p>
                    <button onClick={fetchPatientData} className={styles.retryBtn}>
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!profileData) {
        return (
            <div className={styles.container}>
                <div className={styles.emptyState}>
                    <p>No profile data found</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>My Profile</h1>
                <p className={styles.subtitle}>Manage your account information and settings</p>
            </header>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === "personal" ? styles.activeTab : ""}`} onClick={() => setActiveTab("personal")}>
                    Personal Information
                </button>
                <button className={`${styles.tab} ${activeTab === "security" ? styles.activeTab : ""}`} onClick={() => setActiveTab("security")}>
                    Security
                </button>
            </div>

            {/* Personal Information Tab */}
            {activeTab === "personal" && (
                <div className={styles.content}>
                    <div className={styles.profileCard}>
                        {/* Avatar Section with Edit Button */}
                        <div className={styles.avatarSection}>
                            <div className={styles.avatarContainer}>
                                <div className={styles.avatar}>
                                    {profileData.firstName.charAt(0)}
                                    {profileData.lastName.charAt(0)}
                                </div>
                                <button className={styles.uploadBtn}>📷</button>
                            </div>
                            <div className={styles.avatarInfo}>
                                <h2>
                                    {profileData.firstName} {profileData.lastName}
                                </h2>
                                <p>{profileData.email}</p>
                                {!isEditing && (
                                    <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
                                        ✏️ Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Basic Information */}
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Basic Information</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formField}>
                                    <label>First Name</label>
                                    {isEditing ? (
                                        <input type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                                    ) : (
                                        <div className={styles.fieldValue}>{profileData.firstName}</div>
                                    )}
                                </div>

                                <div className={styles.formField}>
                                    <label>Last Name</label>
                                    {isEditing ? (
                                        <input type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                                    ) : (
                                        <div className={styles.fieldValue}>{profileData.lastName}</div>
                                    )}
                                </div>

                                <div className={styles.formField}>
                                    <label>Email Address</label>
                                    {isEditing ? (
                                        <input type="email" name="email" value={formData.email} onChange={handleInputChange} required />
                                    ) : (
                                        <div className={styles.fieldValue}>{profileData.email}</div>
                                    )}
                                </div>

                                <div className={styles.formField}>
                                    <label>Contact Number</label>
                                    {isEditing ? (
                                        <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} required />
                                    ) : (
                                        <div className={styles.fieldValue}>{profileData.contactNumber}</div>
                                    )}
                                </div>

                                <div className={styles.formField}>
                                    <label>Date of Birth</label>
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            value={formatDateForInput(formData.dateOfBirth)}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    ) : (
                                        <div className={styles.fieldValue}>{formatDate(profileData.dateOfBirth)}</div>
                                    )}
                                </div>

                                <div className={styles.formField}>
                                    <label>Gender</label>
                                    {isEditing ? (
                                        <select name="gender" value={formData.gender} onChange={handleInputChange} required>
                                            <option value="">Select Gender</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    ) : (
                                        <div className={styles.fieldValue}>{profileData.gender}</div>
                                    )}
                                </div>

                                <div className={`${styles.formField} ${styles.fullWidth}`}>
                                    <label>Address</label>
                                    {isEditing ? (
                                        <textarea name="address" value={formData.address} onChange={handleInputChange} rows={2} required />
                                    ) : (
                                        <div className={styles.fieldValue}>{profileData.address}</div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Emergency Contact */}
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Emergency Contact</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formField}>
                                    <label>Contact Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="emergencyContact.name"
                                            value={formData.emergencyContact?.name || ""}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    ) : (
                                        <div className={styles.fieldValue}>{profileData.emergencyContact.name}</div>
                                    )}
                                </div>

                                <div className={styles.formField}>
                                    <label>Relationship</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="emergencyContact.relationship"
                                            value={formData.emergencyContact?.relationship || ""}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    ) : (
                                        <div className={styles.fieldValue}>{profileData.emergencyContact.relationship}</div>
                                    )}
                                </div>

                                <div className={styles.formField}>
                                    <label>Phone Number</label>
                                    {isEditing ? (
                                        <input
                                            type="tel"
                                            name="emergencyContact.phone"
                                            value={formData.emergencyContact?.phone || ""}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    ) : (
                                        <div className={styles.fieldValue}>{profileData.emergencyContact.phone}</div>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Save/Cancel Buttons */}
                        {isEditing && (
                            <div className={styles.formActions}>
                                <button className={styles.cancelBtn} onClick={handleCancelEdit} disabled={saveLoading}>
                                    Cancel
                                </button>
                                <button className={styles.saveBtn} onClick={handleSaveProfile} disabled={saveLoading}>
                                    {saveLoading ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
                <div className={styles.content}>
                    <div className={styles.profileCard}>
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Change Password</h3>
                            <form onSubmit={handlePasswordChange} className={styles.passwordForm}>
                                <div className={styles.formField}>
                                    <label>Current Password</label>
                                    <input
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className={styles.formField}>
                                    <label>New Password</label>
                                    <input
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        minLength={8}
                                        required
                                    />
                                    <small>Must be at least 8 characters</small>
                                </div>

                                <div className={styles.formField}>
                                    <label>Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                        minLength={8}
                                        required
                                    />
                                </div>

                                <button type="submit" className={styles.saveBtn}>
                                    Update Password
                                </button>
                            </form>
                        </section>

                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Two-Factor Authentication</h3>
                            <div className={styles.twoFactorBox}>
                                <div className={styles.twoFactorInfo}>
                                    <span className={styles.twoFactorIcon}>🔐</span>
                                    <div>
                                        <strong>Enhanced Security</strong>
                                        <p>Add an extra layer of protection to your account</p>
                                    </div>
                                </div>
                                <button className={styles.enableBtn}>Enable 2FA</button>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Active Sessions</h3>
                            <div className={styles.sessionsList}>
                                <div className={styles.sessionItem}>
                                    <div className={styles.sessionIcon}>💻</div>
                                    <div className={styles.sessionDetails}>
                                        <strong>Windows - Chrome</strong>
                                        <p>Colombo, Sri Lanka • Active now</p>
                                    </div>
                                    <span className={styles.currentBadge}>Current</span>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}

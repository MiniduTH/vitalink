"use client";

import React, { useState, useEffect } from "react";
import styles from "./profile.module.css";
import { Timestamp } from "firebase/firestore";
import { StatCard } from "@/components/StatCard";

interface ProfileData {
    firstName: string;
    lastName: string;
    email: string;
    contactNumber: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    emergencyContact: {
        name: string;
        relationship: string;
        phone: string;
    };
}

export default function PatientProfile() {
    const [activeTab, setActiveTab] = useState<"personal" | "security" | "preferences">("personal");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);

    const [profileData, setProfileData] = useState<ProfileData>({
        firstName: "",
        lastName: "",
        email: "",
        contactNumber: "",
        dateOfBirth: "",
        gender: "",
        address: "",
        emergencyContact: {
            name: "",
            relationship: "",
            phone: "",
        },
    });

    const [formData, setFormData] = useState<ProfileData>(profileData);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        // TODO: Replace with actual API call to fetch patient data
        setTimeout(() => {
            const mockData: ProfileData = {
                firstName: "John",
                lastName: "Doe",
                email: "john.doe@example.com",
                contactNumber: "0771234567",
                dateOfBirth: "1990-01-15",
                gender: "Male",
                address: "123 Main Street, Colombo 07, Sri Lanka",
                emergencyContact: {
                    name: "Jane Doe",
                    relationship: "Spouse",
                    phone: "0779876543",
                },
            };
            setProfileData(mockData);
            setFormData(mockData);
            setLoading(false);
        }, 500);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name.startsWith("emergencyContact.")) {
            const field = name.split(".")[1];
            setFormData({
                ...formData,
                emergencyContact: {
                    ...formData.emergencyContact,
                    [field]: value,
                },
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleSaveProfile = async () => {
        setSaveLoading(true);
        // TODO: Implement actual API call to update patient profile
        setTimeout(() => {
            setProfileData(formData);
            setIsEditing(false);
            setSaveLoading(false);
            alert("Profile updated successfully!");
        }, 1000);
    };

    const handleCancelEdit = () => {
        setFormData(profileData);
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

        // TODO: Implement actual password change API call
        alert("Password change would happen here. Integration with Firebase Auth needed.");
        setPasswordForm({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "N/A";
        return new Date(dateStr).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading profile...</p>
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

            {/* Stats Cards - Quick Overview */}
            <div className={styles.statsGrid}>
                <StatCard value="3" label="Upcoming Visits" variant="blue" icon="📅" />
                <StatCard value="12" label="Total Visits" variant="green" icon="✓" />
                <StatCard value="Active" label="Account Status" variant="pink" icon="👤" />
            </div>

            {/* Tabs */}
            <div className={styles.tabs}>
                <button className={`${styles.tab} ${activeTab === "personal" ? styles.activeTab : ""}`} onClick={() => setActiveTab("personal")}>
                    Personal Information
                </button>
                <button className={`${styles.tab} ${activeTab === "security" ? styles.activeTab : ""}`} onClick={() => setActiveTab("security")}>
                    Security
                </button>
                <button
                    className={`${styles.tab} ${activeTab === "preferences" ? styles.activeTab : ""}`}
                    onClick={() => setActiveTab("preferences")}
                >
                    Preferences
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
                                        <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} required />
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
                                            value={formData.emergencyContact.name}
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
                                            value={formData.emergencyContact.relationship}
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
                                            value={formData.emergencyContact.phone}
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

            {/* Preferences Tab */}
            {activeTab === "preferences" && (
                <div className={styles.content}>
                    <div className={styles.profileCard}>
                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Notifications</h3>
                            <div className={styles.preferencesList}>
                                <div className={styles.preferenceItem}>
                                    <div className={styles.preferenceInfo}>
                                        <strong>Email Notifications</strong>
                                        <p>Receive appointment reminders via email</p>
                                    </div>
                                    <label className={styles.toggle}>
                                        <input type="checkbox" defaultChecked />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>

                                <div className={styles.preferenceItem}>
                                    <div className={styles.preferenceInfo}>
                                        <strong>SMS Notifications</strong>
                                        <p>Get text alerts for upcoming appointments</p>
                                    </div>
                                    <label className={styles.toggle}>
                                        <input type="checkbox" defaultChecked />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>

                                <div className={styles.preferenceItem}>
                                    <div className={styles.preferenceInfo}>
                                        <strong>Billing Updates</strong>
                                        <p>Notifications about bills and payments</p>
                                    </div>
                                    <label className={styles.toggle}>
                                        <input type="checkbox" defaultChecked />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>

                                <div className={styles.preferenceItem}>
                                    <div className={styles.preferenceInfo}>
                                        <strong>Health Record Updates</strong>
                                        <p>Alerts when new records are added</p>
                                    </div>
                                    <label className={styles.toggle}>
                                        <input type="checkbox" />
                                        <span className={styles.slider}></span>
                                    </label>
                                </div>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Language & Region</h3>
                            <div className={styles.formGrid}>
                                <div className={styles.formField}>
                                    <label>Language</label>
                                    <select>
                                        <option value="en">English</option>
                                        <option value="si">Sinhala</option>
                                        <option value="ta">Tamil</option>
                                    </select>
                                </div>

                                <div className={styles.formField}>
                                    <label>Time Zone</label>
                                    <select>
                                        <option value="Asia/Colombo">Asia/Colombo (GMT+5:30)</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Privacy</h3>
                            <div className={styles.privacyOptions}>
                                <button className={styles.privacyBtn}>Download My Data</button>
                                <button className={`${styles.privacyBtn} ${styles.dangerBtn}`}>Delete Account</button>
                            </div>
                        </section>
                    </div>
                </div>
            )}
        </div>
    );
}

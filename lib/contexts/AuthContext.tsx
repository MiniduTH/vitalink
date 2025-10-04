"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/config";
import { onAuthStateChanged, User, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    userType: "patient" | "staff" | null;
    userData: any | null;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    userType: null,
    userData: null,
    signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userType, setUserType] = useState<"patient" | "staff" | null>(null);
    const [userData, setUserData] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Subscribe to auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                try {
                    // Try to get user from patients collection first
                    const patientRef = doc(db, "patients", firebaseUser.uid);
                    const patientDoc = await getDoc(patientRef);

                    if (patientDoc.exists()) {
                        setUserType("patient");
                        setUserData({ id: patientDoc.id, ...patientDoc.data() });
                    } else {
                        // If not a patient, check staff collection
                        const staffRef = doc(db, "staff", firebaseUser.uid);
                        const staffDoc = await getDoc(staffRef);

                        if (staffDoc.exists()) {
                            setUserType("staff");
                            setUserData({ id: staffDoc.id, ...staffDoc.data() });
                        } else {
                            // User exists in Firebase Auth but not in collections
                            console.warn("User authenticated but no profile found");
                            setUserType(null);
                            setUserData(null);
                        }
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                    setUserType(null);
                    setUserData(null);
                }
            } else {
                setUserType(null);
                setUserData(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUser(null);
            setUserType(null);
            setUserData(null);
        } catch (error) {
            console.error("Error signing out:", error);
            throw error;
        }
    };

    return <AuthContext.Provider value={{ user, loading, userType, userData, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

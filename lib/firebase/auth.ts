import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, User } from "firebase/auth";
import { auth } from "./config";

export async function signInWithEmail(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string) {
    return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOutUser() {
    return signOut(auth);
}

export async function getCurrentUser(): Promise<User | null> {
    return auth.currentUser;
}

export class UnauthorizedError extends Error {
    constructor(message = "Unauthorized access") {
        super(message);
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends Error {
    constructor(message = "Forbidden: insufficient permissions") {
        super(message);
        this.name = "ForbiddenError";
    }
}

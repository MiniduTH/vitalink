import { Timestamp } from "firebase/firestore";

// ==================== Patient Types ====================
export interface Patient {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Timestamp;
    gender: string;
    contactNumber: string;
    email: string;
    address: string;
    emergencyContact: EmergencyContact;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface EmergencyContact {
    name: string;
    relationship: string;
    phone: string;
}

export interface CreatePatientDTO {
    firstName: string;
    lastName: string;
    dateOfBirth: Timestamp;
    gender: string;
    contactNumber: string;
    email: string;
    address: string;
    emergencyContact: EmergencyContact;
}

// ==================== Health Record Types ====================
export interface HealthRecord {
    id: string;
    patientId: string;
    bloodType: string;
    allergies: string[];
    chronicConditions: string[];
    encounters: Encounter[];
    digitalHealthCardId: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface Encounter {
    encounterId: string;
    date: Timestamp;
    diagnosis: string;
    labResults: string[];
    medicalNotes: string;
    doctorId: string;
}

export interface CreateHealthRecordDTO {
    patientId: string;
    bloodType: string;
    allergies: string[];
    chronicConditions: string[];
    encounters?: Encounter[];
    digitalHealthCardId?: string;
}

// ==================== Digital Health Card Types ====================
export interface DigitalHealthCard {
    id: string;
    patientId: string;
    cardNumber: string;
    qrCode: string;
    status: "Active" | "Inactive" | "Expired";
    issuedDate: Timestamp;
    expiryDate: Timestamp;
}

export interface CreateHealthCardDTO {
    patientId: string;
    cardNumber: string;
    qrCode: string;
    status: "Active" | "Inactive" | "Expired";
    issuedDate: Timestamp;
    expiryDate: Timestamp;
}

// ==================== Appointment Types ====================
export interface Appointment {
    id: string;
    patientId: string;
    doctorId: string;
    departmentId: string;
    appointmentDate: Timestamp;
    timeSlot: string;
    status: "Scheduled" | "Confirmed" | "CheckedIn" | "Completed" | "Cancelled";
    reason: string;
    notes: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

export interface CreateAppointmentDTO {
    patientId: string;
    doctorId: string;
    departmentId: string;
    appointmentDate: Timestamp;
    timeSlot: string;
    reason: string;
    notes?: string;
}

export interface BookAppointmentDTO extends CreateAppointmentDTO {
    status?: "Scheduled" | "Confirmed";
}

// ==================== Payment Types ====================
export interface Payment {
    id: string;
    appointmentId: string;
    patientId: string;
    amount: number;
    insuranceCoverage: number;
    patientPortion: number;
    status: "Pending" | "Completed" | "Failed" | "Refunded";
    paymentMethod: "Cash" | "Card" | "Insurance" | "Mixed";
    insuranceClaimId?: string;
    transactionId: string;
    paidAt?: Timestamp;
    createdAt: Timestamp;
}

export interface CreatePaymentDTO {
    appointmentId: string;
    patientId: string;
    amount: number;
    insuranceCoverage?: number;
    patientPortion: number;
    paymentMethod: "Cash" | "Card" | "Insurance" | "Mixed";
    insuranceClaimId?: string;
}

// ==================== Insurance Types ====================
export interface InsurancePolicy {
    id: string;
    patientId: string;
    policyNumber: string;
    provider: string;
    coveragePercentage: number;
    maxCoverage: number;
    startDate: Timestamp;
    endDate: Timestamp;
    status: "Active" | "Expired" | "Suspended";
}

export interface InsuranceClaim {
    id: string;
    policyId: string;
    paymentId: string;
    claimAmount: number;
    approvedAmount: number;
    status: "Submitted" | "Approved" | "Rejected" | "Pending";
    submittedAt: Timestamp;
    processedAt?: Timestamp;
}

export interface CheckEligibilityDTO {
    policyNumber: string;
    patientId: string;
    amount: number;
}

export interface EligibilityResponse {
    eligible: boolean;
    coveragePercentage: number;
    approvedAmount: number;
    claimId: string;
}

// ==================== Staff Types ====================
export interface Staff {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    firebaseUid: string;
    role: "Staff" | "Doctor" | "PaymentsOfficer" | "Manager";
    departmentId?: string;
    specialization?: string; // for doctors
    licenseNumber?: string; // for doctors
    createdAt: Timestamp;
}

export interface CreateStaffDTO {
    firstName: string;
    lastName: string;
    email: string;
    firebaseUid: string;
    role: "Staff" | "Doctor" | "PaymentsOfficer" | "Manager";
    departmentId?: string;
    specialization?: string;
    licenseNumber?: string;
}

// ==================== Department Types ====================
export interface Department {
    id: string;
    name: string;
    hospitalId: string;
    description: string;
}

export interface CreateDepartmentDTO {
    name: string;
    hospitalId: string;
    description: string;
}

// ==================== Hospital Types ====================
export interface Hospital {
    id: string;
    name: string;
    type: "Public" | "Private" | "SemiPrivate";
    address: string;
    contactNumber: string;
}

export interface CreateHospitalDTO {
    name: string;
    type: "Public" | "Private" | "SemiPrivate";
    address: string;
    contactNumber: string;
}

// ==================== Report Types ====================
export interface PatientFlowReport {
    totalAppointments: number;
    scheduledAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    averageWaitTime: number;
    departmentBreakdown: DepartmentStats[];
    dateRange: {
        start: Date;
        end: Date;
    };
}

export interface DepartmentStats {
    departmentId: string;
    departmentName: string;
    appointmentCount: number;
    averageWaitTime: number;
}

export interface RevenueReport {
    totalRevenue: number;
    cashPayments: number;
    cardPayments: number;
    insurancePayments: number;
    pendingPayments: number;
    refunds: number;
    dateRange: {
        start: Date;
        end: Date;
    };
    dailyBreakdown: DailyRevenue[];
}

export interface DailyRevenue {
    date: string;
    revenue: number;
    transactions: number;
}

// ==================== Common Error Types ====================
export class NotFoundError extends Error {
    constructor(message = "Resource not found") {
        super(message);
        this.name = "NotFoundError";
    }
}

export class ValidationError extends Error {
    constructor(message = "Validation failed") {
        super(message);
        this.name = "ValidationError";
    }
}

export class ConflictError extends Error {
    constructor(message = "Resource conflict") {
        super(message);
        this.name = "ConflictError";
    }
}

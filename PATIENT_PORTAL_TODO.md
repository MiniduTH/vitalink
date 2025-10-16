# Patient Portal - TODO Features & Implementation Plan

**Status:** Currently using mock data throughout the portal  
**Goal:** Replace all mock data with real Firestore data and implement missing features  
**Architecture:** ⚡ **Serverless** - Direct Firebase SDK usage, NO API routes needed

---

## 🏗️ Architecture Pattern (Serverless-First)

### ✅ Correct Approach:

```typescript
Component → Service → Repository → Firestore
```

### ❌ Don't Use (Unnecessary):

```typescript
Component → API Route → Service → Repository → Firestore
```

**Why?** Firebase SDK works client-side. API routes add unnecessary complexity, latency, and maintenance overhead. Direct service usage is simpler, faster, and more type-safe.

---

## 🎯 Critical Priority: Replace Mock Data with Firestore

### 1. **Dashboard (`/dashboard`)** ⚠️ HIGH PRIORITY

**File:** `app/(patient)/dashboard/page.tsx`

#### Current State:

-   Using `setTimeout()` to simulate API calls
-   Stats data is hardcoded:
    ```typescript
    todayAppointments: 23,
    completedToday: 3,
    upcomingAppointments: 12,
    pendingBills: 2
    ```

#### Implementation Needed:

**Direct Service Usage Pattern:**

```typescript
import { AppointmentService } from "@/lib/services/AppointmentService";
import { AppointmentRepository } from "@/lib/firestore/repositories/AppointmentRepository";
import { NotificationService } from "@/lib/services/NotificationService";
import { useAuth } from "@/lib/contexts/AuthContext";

const { user } = useAuth();
const appointmentRepo = new AppointmentRepository();
const notificationService = new NotificationService();
const appointmentService = new AppointmentService(appointmentRepo, notificationService);

// Fetch appointments
const appointments = await appointmentService.getAppointmentsByPatient(user.uid);
```

-   [ ] Remove all API endpoint dependencies
-   [ ] Create service instances in component
-   [ ] Use `DashboardService` (needs to be created) with methods:
    -   `getTodayAppointmentsCount(patientId: string)`
    -   `getCompletedTodayCount(patientId: string)`
    -   `getUpcomingAppointmentsCount(patientId: string)`
    -   `getPendingBillsCount(patientId: string)`
-   [ ] Fetch real stats from Firestore via service layer
-   [ ] Add personalized greeting with user's firstName from `AuthContext`
-   [ ] Handle loading and error states properly

**Files to Create/Modify:**

-   Create: `lib/services/DashboardService.ts`
-   ~~Create: `app/api/dashboard/stats/route.ts`~~ ❌ NOT NEEDED
-   Modify: `app/(patient)/dashboard/page.tsx`

---

### 2. **Appointments (`/appointments`)** ⚠️ HIGH PRIORITY

**File:** `app/(patient)/appointments/page.tsx`

#### Current State:

-   Mock appointments array with 3 hardcoded appointments
-   Using `setTimeout()` to simulate loading
-   Actions (check-in, reschedule, cancel) only log to console

#### Implementation Needed:

**Direct Service Usage:**

```typescript
import { AppointmentService } from "@/lib/services/AppointmentService";
import { useAuth } from "@/lib/contexts/AuthContext";

const { user } = useAuth();
const appointmentService = new AppointmentService(appointmentRepo, notificationService);

// Fetch, book, update appointments directly
const appointments = await appointmentService.getAppointmentsByPatient(user.uid);
await appointmentService.bookAppointment(appointmentData);
await appointmentService.checkIn(appointmentId);
await appointmentService.rescheduleAppointment(id, newDate, newTimeSlot);
await appointmentService.cancelAppointment(appointmentId);
```

-   [ ] **Fetch Appointments:** Use `appointmentService.getAppointmentsByPatient(user.uid)`
-   [ ] **Book Appointment:**
    -   Implement form validation
    -   Call `appointmentService.bookAppointment(data)` directly
    -   Refresh appointments list after booking
-   [ ] **Check-In:**
    -   Call `appointmentService.checkIn(appointmentId)` directly
    -   Update appointment status to "CheckedIn"
    -   Show success message
-   [ ] **Reschedule:**
    -   Create modal/form for selecting new date/time
    -   Call `appointmentService.rescheduleAppointment(id, date, timeSlot)` directly
-   [ ] **Cancel:**
    -   Add confirmation dialog
    -   Call `appointmentService.cancelAppointment(id)` directly
-   [ ] Get patient ID from `AuthContext.user.uid`
-   [ ] Replace mock data with real service calls

**Services Available (Already Exist):**

-   ✅ `AppointmentService.getAppointmentsByPatient(patientId)` - Fetch appointments
-   ✅ `AppointmentService.bookAppointment(data)` - Create appointment
-   ✅ `AppointmentService.checkIn(id)` - Check-in
-   ✅ `AppointmentService.rescheduleAppointment(id, date, timeSlot)` - Update/Reschedule
-   ✅ `AppointmentService.cancelAppointment(id)` - Cancel

**Files to Modify:**

-   `app/(patient)/appointments/page.tsx` - Replace all mock data and implement actions

---

### 3. **Billing (`/billing`)** ⚠️ HIGH PRIORITY

**File:** `app/(patient)/billing/page.tsx`

#### Current State:

-   Mock bills, insurance, and payment history arrays
-   Payment modal exists but shows alert instead of processing
-   Using `setTimeout()` to simulate loading

#### Implementation Needed:

**Direct Service Usage:**

```typescript
import { BillingService } from "@/lib/services/BillingService";
import { InsuranceService } from "@/lib/services/InsuranceService";
import { useAuth } from "@/lib/contexts/AuthContext";

const { user } = useAuth();
const billingService = new BillingService(paymentRepo, insuranceService, notificationService);

// Fetch bills and process payments directly
const bills = await billingService.getPaymentsByPatient(user.uid);
const payment = await billingService.processPayment(billId, paymentDetails);
```

-   [ ] **Fetch Bills:** Use `billingService.getPaymentsByPatient(user.uid)` directly
-   [ ] **Fetch Insurance:** Use `insuranceService.getPolicyByPatient(user.uid)` directly
-   [ ] **Process Payment:**
    -   Validate card details client-side
    -   Call `billingService.processPayment(billId, paymentDetails)` directly
    -   BillingService already has mock payment gateway integration (90% success rate)
    -   Update bill status to "Paid"
    -   Add payment to history
-   [ ] **Download Receipt:**
    -   Generate PDF receipt using bill and payment data
    -   Use library like `jspdf` or `react-pdf`
-   [ ] **Update Insurance:**
    -   Create form modal for insurance details
    -   Call `insuranceService.createPolicy()` or `insuranceService.updatePolicy()` directly
-   [ ] Get patient ID from `AuthContext.user.uid`

**Services Available (Already Exist):**

-   ✅ `BillingService.getPaymentsByPatient(patientId)` - Fetch payments/bills
-   ✅ `BillingService.getPayment(id)` - Fetch specific bill
-   ✅ `BillingService.processPayment(billId, paymentDetails)` - Process payment with mock gateway
-   ✅ `InsuranceService.getPolicyByPatient(patientId)` - Fetch insurance
-   ✅ `InsuranceService.createPolicy(data)` - Create insurance policy
-   ✅ `InsuranceService.updatePolicy(id, data)` - Update insurance policy

**Files to Modify:**

-   `app/(patient)/billing/page.tsx` - Use services directly instead of API calls

---

### 4. **Health Records (`/health-records`)** ⚠️ MEDIUM PRIORITY

**File:** `app/(patient)/health-records/page.tsx`

#### Current State:

-   All data is hardcoded mock arrays:
    -   Vital signs
    -   Encounters (2 items)
    -   Medications (3 items)
    -   Lab results (5 items)
    -   Allergies (2 items)
    -   Vaccinations (3 items)
-   Search functionality only logs to console

#### Implementation Needed:

**Direct Service Usage:**

```typescript
import { HealthRecordService } from "@/lib/services/HealthRecordService";
import { useAuth } from "@/lib/contexts/AuthContext";

const { user } = useAuth();
const healthRecordService = new HealthRecordService(healthRecordRepo);

// Fetch health record directly
const healthRecord = await healthRecordService.getHealthRecordByPatientId(user.uid);
```

-   [ ] **Fetch Health Record:** Use `healthRecordService.getHealthRecordByPatientId(user.uid)` directly
-   [ ] **Display Data:**
    -   Vital signs from latest encounter
    -   All encounters with expandable details
    -   Current medications (status: "Active")
    -   Recent lab results (last 6 months)
    -   Allergies from health record
    -   Vaccination history from encounters
-   [ ] **Search/Filter:**
    -   Implement client-side search across encounters, medications, lab results
    -   Filter by date range
    -   Filter by status (for medications)
-   [ ] **Export Records:**
    -   Generate PDF with all health record data
    -   Download as structured document
-   [ ] Get patient ID from `AuthContext.user.uid`

**Services Available (Already Exist):**

-   ✅ `HealthRecordService.getHealthRecordByPatientId(patientId)` - Fetch complete health record
-   ✅ `HealthRecordService.updateHealthRecord(id, data)` - Update health record

**Files to Modify:**

-   `app/(patient)/health-records/page.tsx` - Use services directly

---

### 5. **Profile (`/profile`)** ⚠️ MEDIUM PRIORITY

**File:** `app/(patient)/profile/page.tsx`

#### Current State:

-   Mock profile data with hardcoded values
-   Edit functionality shows alert instead of saving
-   Password change shows alert instead of updating
-   Using `setTimeout()` to simulate loading

#### Implementation Needed:

**Direct Service Usage:**

```typescript
import { PatientService } from "@/lib/services/PatientService";
import { updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useAuth } from "@/lib/contexts/AuthContext";

const { user } = useAuth();
const patientService = new PatientService(patientRepo, healthRecordRepo);

// Fetch and update profile directly
const patient = await patientService.getPatient(user.uid);
await patientService.updatePatient(user.uid, updatedData);

// Change password using Firebase Auth directly
await updatePassword(auth.currentUser, newPassword);
```

-   [ ] **Fetch Profile:** Use `patientService.getPatient(user.uid)` directly
-   [ ] **Update Profile:**
    -   Validate form data
    -   Call `patientService.updatePatient(user.uid, data)` directly
    -   Update `AuthContext` with new data
    -   Show success message
-   [ ] **Change Password:**
    -   Validate current password
    -   Call Firebase Auth `updatePassword(auth.currentUser, newPassword)` directly
    -   Show success/error messages
-   [ ] **Upload Profile Picture:** (Future enhancement)
    -   Add file upload
    -   Store in Firebase Storage
    -   Update patient record with image URL
-   [ ] Get patient ID from `AuthContext.user.uid`
-   [ ] Pre-fill form with current user data from `AuthContext`

**Services Available (Already Exist):**

-   ✅ `PatientService.getPatient(id)` - Fetch patient profile
-   ✅ `PatientService.updatePatient(id, data)` - Update patient profile

**Firebase Auth Methods:**

-   `updatePassword(user, newPassword)` - Change password
-   `reauthenticateWithCredential(user, credential)` - Verify current password

**Files to Modify:**

-   `app/(patient)/profile/page.tsx` - Use services directly

---

## 🔧 Additional Features to Implement

### 6. **Client-Side Search** (Dashboard - Removed)

-   ✅ Search functionality removed from dashboard as requested
-   Search still exists in other pages (appointments, billing, health records)
-   Current implementation: Client-side filtering based on `searchQuery` state
-   Works correctly for filtering displayed data

---

### 7. **Authentication Integration**

**Priority:** CRITICAL (Required for all pages)

#### Current Issues:

-   Pages don't use `AuthContext` to get logged-in user
-   Patient ID is not being passed to API calls
-   No user verification before fetching data

#### Implementation Needed:

-   [ ] Import `useAuth` from `@/lib/contexts/AuthContext` in all patient pages
-   [ ] Get `user.uid` as patientId for all API calls
-   [ ] Add loading state while auth initializes
-   [ ] Redirect to `/login` if user is not authenticated
-   [ ] Show user's name in dashboard header

**Example Pattern:**

```typescript
import { useAuth } from "@/lib/contexts/AuthContext";

export default function PatientPage() {
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login?redirect=/dashboard");
            return;
        }

        if (user?.uid) {
            fetchData(user.uid);
        }
    }, [user, authLoading]);
}
```

**Files to Modify:**

-   `app/(patient)/dashboard/page.tsx`
-   `app/(patient)/appointments/page.tsx`
-   `app/(patient)/billing/page.tsx`
-   `app/(patient)/health-records/page.tsx`
-   `app/(patient)/profile/page.tsx`

---

## 📊 Summary of TODOs by Priority

### 🔴 Critical (Must Complete First)

1. **Authentication Integration** - Add `AuthContext` to all pages (5 files)
2. **Dashboard Stats** - Fetch real appointment/billing counts using services directly
3. **Appointments** - Fetch, book, check-in, reschedule, cancel using `AppointmentService`
4. **Profile** - Fetch and update patient data using `PatientService`, change password with Firebase Auth

### 🟡 High Priority

5. **Billing** - Fetch bills, process payments, manage insurance using `BillingService` and `InsuranceService`
6. **Health Records** - Fetch and display complete medical history using `HealthRecordService`

### 🟢 Nice to Have

7. Client-side search improvements
8. PDF export for receipts and health records
9. Profile picture upload
10. Appointment reminders/notifications
11. Insurance claim tracking

---

## 🎯 Recommended Implementation Order

### **Phase 1: Authentication (Week 1)** ⚠️ CRITICAL

-   Add `AuthContext` to all 5 patient pages
-   Verify user is logged in before fetching data
-   Use `user.uid` for all service calls
-   **No API routes needed** - Direct service usage

### **Phase 2: Core Data Fetching (Week 2)** - Serverless Approach

-   Dashboard: Real stats from Firestore via `DashboardService`
-   Appointments: Fetch patient appointments via `AppointmentService`
-   Profile: Fetch and display patient data via `PatientService`
-   Health Records: Fetch health record via `HealthRecordService`
-   **All using direct service calls, no API routes**

### **Phase 3: Actions & Updates (Week 3)**

-   Appointments: Book, check-in, reschedule, cancel via `AppointmentService`
-   Profile: Update profile via `PatientService`, change password via Firebase Auth
-   Billing: Fetch bills via `BillingService`
-   **All client-side service calls**

### **Phase 4: Payment Processing (Week 4)**

-   Billing: Process payments with mock gateway via `BillingService.processPayment()`
-   Billing: Insurance management via `InsuranceService`
-   Billing: Receipt generation (client-side PDF)

### **Phase 5: Polish & Enhancements (Week 5)**

-   Error handling improvements
-   Loading state optimizations
-   Search functionality improvements
-   PDF exports

---

## 📝 Notes

**Architecture Update:**

-   ⚡ **Serverless-first approach** - No API routes needed for CRUD operations
-   All services work client-side with Firebase SDK
-   Components directly instantiate and use services
-   Simpler, faster, more maintainable

**Backend Services (All Ready to Use):**

-   ✅ `PatientService` - Patient CRUD operations
-   ✅ `AppointmentService` - Appointment management with transactions
-   ✅ `BillingService` - Payment processing with mock gateway
-   ✅ `InsuranceService` - Insurance policy management
-   ✅ `HealthRecordService` - Medical record operations
-   ✅ `NotificationService` - Centralized notifications
-   ✅ `ReportingService` - Analytics and reports

**What We DON'T Need:**

-   ❌ API routes for CRUD operations
-   ❌ API route creation and maintenance
-   ❌ JSON serialization/deserialization overhead
-   ❌ Extra network hops

**What We DO Need:**

-   ✅ Service instances in components
-   ✅ Direct Firestore queries via repositories
-   ✅ Firebase Auth for password changes
-   ✅ Client-side validation and error handling

**Testing:**

-   All services have 93.11% test coverage
-   Services are already tested and production-ready
-   Focus testing on component integration with services

---

## ✅ Next Steps

1. **Start with authentication integration** across all pages (Phase 1)
2. **Instantiate services** in components instead of calling APIs
3. **Test each page** with real Firebase Auth user
4. **Implement data fetching** using direct service calls
5. **Test with actual Firestore data** in your Firebase project
6. **Implement actions** (create, update, delete) with proper error handling
7. **Update documentation** after each phase

**Example First Step:**

```typescript
// Old way (unnecessary)
const response = await fetch("/api/appointments?patientId=" + userId);
const data = await response.json();

// New way (serverless)
const appointmentService = new AppointmentService(appointmentRepo, notificationService);
const appointments = await appointmentService.getAppointmentsByPatient(userId);
```

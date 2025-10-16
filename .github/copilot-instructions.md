# Copilot Instructions for Vitalink

## Project Overview

**Vitalink** is a production-ready Smart Healthcare System built with Next.js 14 (App Router), TypeScript, and Firebase. It implements a strict 3-layer architecture (Repository → Service → API) with dual portals for patients and staff.

**Current Status:** Backend 100% (21 API endpoints), Patient Portal 100%, Staff Portal 100%, Authentication System 100% (Firebase Auth fully integrated), Testing 93.11% coverage.

---

## � Evaluation Criteria (Critical!)

**These criteria determine project success - follow strictly:**

### 1. Implementation Accuracy (40%)

-   All use cases fully implemented
-   Sequence diagrams accurately translated to code
-   Complete end-to-end functionality
-   No missing features from design

### 2. Code Quality (30%)

-   Clean, readable, well-documented code
-   SOLID principles applied
-   Appropriate design patterns
-   No code smells or anti-patterns

### 3. Testing Quality (30%)

-   > 80% code coverage
-   Meaningful test cases
-   Positive, negative, edge, and error cases
-   Clear assertions and test structure

---

## �🏗️ Architecture: Repository → Service → API (Non-Negotiable)

### Critical Pattern: Module-Level Service Instantiation

```typescript
// ✅ app/api/patients/route.ts - Instantiate ONCE at module level
const patientRepo = new PatientRepository();
const healthRecordRepo = new HealthRecordRepository();
const patientService = new PatientService(patientRepo, healthRecordRepo);

export async function POST(request: NextRequest) {
    const patient = await patientService.registerPatient(data); // ✅ Call service
    return NextResponse.json({ success: true, data: patient });
}

// ❌ NEVER instantiate in handlers or call repositories directly
```

**Why:** Services orchestrate multi-step operations (`PatientService.registerPatient` creates patient + auto-creates health record + validates email uniqueness). Repositories are pure data access. Example: `app/api/patients/route.ts` → `lib/services/PatientService.ts` → `lib/firestore/repositories/PatientRepository.ts`.

### Service Layer (7 services in `lib/services/`)

Services use **constructor dependency injection** and handle cross-repository operations:

-   `AppointmentService`: Firestore transactions for double-booking prevention
-   `BillingService`: Insurance coverage calculation
-   `ReportingService`: Multi-repository analytics aggregations
-   `NotificationService`: Centralized notification hub (console logs, ready for email/SMS)

---

## 🔥 Firebase Critical Patterns

### 1. Timestamp Conversion (MUST DO)

```typescript
// ✅ API: Convert ISO strings to Firestore Timestamp
import { Timestamp } from "firebase/firestore";
const data = { ...body, appointmentDate: Timestamp.fromDate(new Date(body.appointmentDate)) };

// ✅ Frontend: Convert Timestamp to Date for display
const formatDate = (ts: any) => (ts.toDate ? ts.toDate() : new Date(ts)).toLocaleDateString();
```

**Why:** Firestore stores `Timestamp` objects, not JavaScript `Date`. API receives ISO strings from clients.

### 2. Firestore Query Constraints

```typescript
// ✅ Use QueryConstraint array for dynamic filters
import { query, collection, where, orderBy, QueryConstraint } from "firebase/firestore";
const constraints: QueryConstraint[] = [orderBy("createdAt", "desc")];
if (status) constraints.push(where("status", "==", status));
const q = query(collection(db, "appointments"), ...constraints);

// ❌ Plain objects don't work: query(collection(db, "appointments"), { status })
```

**Pattern:** See `lib/firestore/repositories/AppointmentRepository.ts` for query building.

### 3. Firebase Auth Integration (COMPLETE ✅)

-   **AuthContext** (`lib/contexts/AuthContext.tsx`): Global auth state with `onAuthStateChanged`, auto-fetches user profile from Firestore
-   **Middleware** (`middleware.ts`): Cookie-based route protection, redirects to `/login` with `?redirect=` param
-   **Login Flow**: `signInWithEmailAndPassword` → check `patients/` or `staff/` collection → verify `userType` match → redirect to portal
-   **Registration Flow**: Multi-step form → `createUserWithEmailAndPassword` → create Firestore profile (`patients/` or `staff/`) → auto-create health record for patients
-   **Google OAuth**: `signInWithPopup` → verify user exists in Firestore → redirect (requires prior registration)
-   **Password Reset**: `sendPasswordResetEmail` → user receives link → resets password via Firebase

**Auth Pages:**

-   `app/(auth)/login/page.tsx` - Email/password + Google sign-in with user type verification
-   `app/(auth)/register/page.tsx` - Multi-step registration (account info → personal details → emergency contact for patients)
-   `app/(auth)/forgot-password/page.tsx` - Password reset flow with email confirmation

---

## 📂 Next.js Route Groups (Critical!)

**Folder structure ≠ URL structure:**

```
app/(auth)/login/page.tsx              → URL: /login (NOT /auth/login)
app/(patient)/dashboard/page.tsx       → URL: /dashboard
app/staff/staff-dashboard/page.tsx     → URL: /staff/staff-dashboard
```

**⚠️ CRITICAL LIMITATION:** You **CANNOT** have two pages in different route groups resolve to the same URL. This would cause a build error:

```
❌ app/(patient)/dashboard/page.tsx → /dashboard
❌ app/(staff)/dashboard/page.tsx  → /dashboard  // ERROR: Conflict!

✅ app/(patient)/dashboard/page.tsx       → /dashboard
✅ app/staff/staff-dashboard/page.tsx    → /staff/staff-dashboard  // Different URL
```

**Route groups `(name)` are for code organization only** - parentheses don't appear in URLs. Use for:

-   Applying different layouts per user role (patient vs staff portal)
-   Organizing code by feature/domain
-   **NOT for sharing the same URL** - each page must have a unique final path

**Each route group MUST have `layout.tsx`** wrapping pages with role-specific navigation. See `app/(patient)/layout.tsx`.

**Solution for dual portals:** Use different URL paths:

-   Patient portal: `/dashboard`, `/appointments`, `/billing`, `/health-records`, `/profile`
-   Staff portal: `/staff/staff-dashboard`, `/staff/staff-appointments`, `/staff/staff-billing`, `/staff/patients`, `/staff/reports`

**Current Structure:**

```
app/
├── (auth)/                  # Route group → /login, /register, /forgot-password
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── (patient)/               # Route group → /dashboard, /appointments, etc.
│   ├── dashboard/
│   ├── appointments/
│   ├── billing/
│   ├── health-records/
│   └── profile/
└── staff/                   # Regular folder → /staff/*
    ├── staff-dashboard/
    ├── patients/
    ├── staff-appointments/
    ├── staff-billing/
    └── reports/
```

Reference: [Next.js Route Groups Docs](https://nextjs.org/docs/app/building-your-application/routing/route-groups)

---

## 🎨 Styling & UI Conventions

### Design Token System (`styles/variables.css`)

**ALL styles MUST use CSS custom properties from `styles/variables.css` (100+ tokens). Never hardcode values.**

**Import at page/component level:**

```css
/* Import in every CSS module */
@import "@/styles/variables.css";
```

**Color Palette (Soft & Clean):**

```css
/* Primary Colors - Soft Pastels */
--primary-pink: #ffb6c1; /* Today's appointments, active states */
--primary-green: #e8f5c8; /* Completed items, success states */
--primary-blue: #a8d5e2; /* Info states, links */
--accent-teal: #66d9e8; /* Buttons, CTAs */

/* Neutrals */
--white: #ffffff;
--bg-light: #f8f9fa;
--text-dark: #2d3748;
--text-gray: #718096;
--text-light: #a0aec0;
--border-light: #e2e8f0;

/* Status Colors */
--status-scheduled: #fff4b6;
--status-confirmed: #e8f5c8;
--status-checkedin: #a8d5e2;
--status-completed: #e8f5c8;
--status-cancelled: #ffd6d6;
```

**Spacing Scale (use instead of raw rem/px):**

```css
--space-2xs: 0.125rem; /* 2px */
--space-xs: 0.25rem; /* 4px */
--space-sm: 0.5rem; /* 8px */
--space-md: 1rem; /* 16px - Base */
--space-lg: 1.5rem; /* 24px */
--space-xl: 2rem; /* 32px */
--space-2xl: 3rem; /* 48px */
```

**Typography System:**

```css
/* Font Sizes */
--text-2xs: 0.625rem; /* 10px */
--text-xs: 0.75rem; /* 12px */
--text-sm: 0.875rem; /* 14px */
--text-base: 1rem; /* 16px - Body */
--text-lg: 1.125rem; /* 18px */
--text-xl: 1.25rem; /* 20px */
--text-2xl: 1.5rem; /* 24px - Mobile headings */
--text-3xl: 2rem; /* 32px - Desktop headings */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

**Borders & Shadows:**

```css
/* Border Radius */
--radius-sm: 0.375rem; /* 6px */
--radius-md: 0.5rem; /* 8px */
--radius-lg: 0.75rem; /* 12px */
--radius-xl: 1rem; /* 16px */
--radius-full: 9999px; /* Fully rounded */

/* Shadows */
--shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
--shadow-md: 0 2px 8px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 4px 12px rgba(0, 0, 0, 0.12);
--shadow-xl: 0 8px 24px rgba(0, 0, 0, 0.15);

/* Transitions */
--transition-fast: 150ms ease-in-out;
--transition-base: 200ms ease-in-out;
--transition-slow: 300ms ease-in-out;
```

### Mobile-First CSS Pattern (4 Breakpoints)

**CRITICAL: Write mobile (320px) styles FIRST, then enhance with media queries.**

```css
/* ✅ CORRECT: Mobile-first approach */
.container {
    /* Mobile: 320px-768px (BASE - write this first) */
    padding: var(--space-md);
    max-width: 100%;
}

/* Tablet: 768px+ */
@media (min-width: 768px) {
    .container {
        padding: var(--space-lg) var(--space-xl);
    }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
    .container {
        padding: var(--space-xl) var(--space-2xl);
        max-width: 1200px;
        margin: 0 auto;
    }
}

/* Large: 1440px+ */
@media (min-width: 1440px) {
    .container {
        max-width: 1400px;
    }
}

/* ❌ NEVER use max-width queries - mobile-first means min-width only */
```

**Example: Dashboard Stats Grid**

```css
.statsGrid {
    /* Mobile: 2 columns stacked */
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-md);
}

@media (min-width: 768px) {
    .statsGrid {
        /* Tablet/Desktop: 4 columns horizontal */
        grid-template-columns: repeat(4, 1fr);
        gap: var(--space-lg);
    }
}
```

### Component Pattern - Appointment Card Example

```typescript
import styles from "./Component.module.css";

// Card with soft colors and rounded corners
export function AppointmentCard({ appointment }: { appointment: Appointment }) {
    const formatDate = (ts: any) => {
        const date = ts.toDate ? ts.toDate() : new Date(ts);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <div className={styles.appointmentCard}>
            <div className={styles.cardHeader}>
                <h3 className={styles.patientName}>{appointment.patientName}</h3>
                <div className={styles.appointmentMeta}>
                    <span className={styles.doctor}>{appointment.doctorName}</span>
                    <span className={styles.time}>{appointment.time}</span>
                    <span className={styles.date}>{formatDate(appointment.date)}</span>
                </div>
            </div>
            <div className={styles.cardActions}>
                <button className={`${styles.btn} ${styles.btnPrimary}`}>Check In</button>
                <button className={`${styles.btn} ${styles.btnSecondary}`}>Reschedule</button>
            </div>
        </div>
    );
}
```

### CSS Module Pattern (Using Design Tokens)

```css
/* ALWAYS import variables first */
@import "@/styles/variables.css";

/* Card with soft shadows and rounded corners */
.appointmentCard {
    background: var(--white);
    border-radius: var(--radius-xl); /* 16px */
    padding: var(--space-lg);
    margin-bottom: var(--space-md);
    box-shadow: var(--shadow-md);
    border-left: 4px solid var(--accent-teal);
    transition: transform var(--transition-base);
}

.appointmentCard:active {
    transform: scale(0.98); /* Mobile tap feedback */
}

/* Summary stats with pastel backgrounds */
.statBox {
    background: var(--primary-pink); /* or --primary-green */
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    text-align: center;
}

.statBox.completed {
    background: var(--primary-green);
}

/* Mobile-optimized buttons */
.btn {
    padding: var(--space-sm) var(--space-lg);
    border-radius: var(--radius-md);
    border: none;
    font-weight: var(--font-medium);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: all var(--transition-base);
    min-height: 44px; /* Touch-friendly */
}

.btnPrimary {
    background: var(--accent-teal);
    color: var(--white);
}

.btnSecondary {
    background: var(--bg-light);
    color: var(--text-dark);
}
```

### Key Design Principles

1. **Touch-Friendly Targets:** Minimum 44x44px for all interactive elements
2. **Generous Spacing:** Use 16px (1rem) base spacing between cards
3. **Soft Shadows:** `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)` for depth
4. **Rounded Corners:** 12-16px border-radius for modern look
5. **Pastel Backgrounds:** Use pink/green for stats, white for content cards
6. **Mobile Gestures:** Add active states with scale transforms
7. **Readable Typography:** Minimum 16px font-size for body text
8. **High Contrast:** Ensure text passes WCAG AA standards

---

## ✅ Testing Standards (93.11% Coverage)

**Framework:** Jest 29.7.0 + React Testing Library v16.3.0 | **Total:** 105 tests passing

### Critical Testing Patterns

**1. Environment Directives** (MUST include at top of test files):

```typescript
/**
 * @jest-environment jsdom  // For React components (needs DOM APIs)
 * @jest-environment node    // For services/API (default)
 */
```

**2. Firebase Mocking** (`jest.setup.js` auto-mocks, no manual setup needed):

```typescript
// ✅ Already configured globally - just import and use
import { auth, db } from "@/lib/firebase/config";
```

**3. Repository Mocking Pattern**:

```typescript
jest.mock("@/lib/firestore/repositories/PatientRepository");
const mockRepo = new PatientRepository() as jest.Mocked<PatientRepository>;

// ⚠️ CRITICAL: Mock objects MUST include Timestamp fields
const mockPatient = {
    id: "patient123",
    firstName: "John",
    email: "john@test.com",
    createdAt: Timestamp.now(), // Required!
    updatedAt: Timestamp.now(), // Required!
};
mockRepo.findById.mockResolvedValue(mockPatient);
```

**Why:** All Firestore entities have `createdAt`/`updatedAt` timestamps. Services access these for sorting/logging.

**4. Test Structure** (Positive + Negative + Edge cases):

```typescript
describe("ServiceName", () => {
    // ✅ Shared data at describe level for all nested tests
    const validData = { firstName: "John", ... };

    beforeEach(() => jest.clearAllMocks());

    describe("methodName", () => {
        it("should succeed with valid data", async () => { /* positive */ });
        it("should throw ValidationError for invalid input", async () => { /* negative */ });
        it("should handle edge case: empty array", async () => { /* edge */ });
    });
});
```

**Test Coverage by Service:**

-   PatientService: 13 tests | AppointmentService: 18 tests (includes Firestore transactions)
-   BillingService: 15 tests (payment gateway mocking) | InsuranceService: 9 tests
-   ReportingService: 10 tests | HealthRecordService: 12 tests | NotificationService: 8 tests

**Run Commands:**

```bash
npm test                # Watch mode
npm run test:coverage   # Generate coverage report (opens in browser)
```

---

## 🚀 Development Workflow

```bash
npm run dev              # http://localhost:3000
npm test                 # Watch mode
npm run test:coverage    # Coverage report
```

### API Testing (curl)

```bash
# Create patient
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@test.com","contactNumber":"0771234567","dateOfBirth":"1990-01-01","gender":"Male","address":"123 Main St","emergencyContact":{"name":"Jane","relationship":"Spouse","phone":"0779876543"}}'

# Search patients
curl "http://localhost:3000/api/patients?search=John"

# Mock payment gateway (90% success rate)
curl -X POST http://localhost:3000/api/mock/payment-gateway \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000, "cardNumber": "4111111111111111", "cvv": "123"}'
```

---

## 📖 Key Reference Files

-   **Architecture Deep-Dive:** `IMPLEMENTATION.md`
-   **Quick Onboarding:** `QUICK_START.md`
-   **Firebase Setup:** `FIREBASE_INTEGRATION_COMPLETE.md`
-   **Testing Guide:** `TESTING_GUIDE.md`
-   **Example Service:** `lib/services/PatientService.ts` (shows validation, duplicate checking, auto-create health record)
-   **Example API:** `app/api/patients/route.ts` (module-level instantiation, error handling)
-   **Example Component:** `components/PatientCard.tsx` (responsive CSS, Timestamp formatting)
-   **Example Test:** `__tests__/services/PatientService.test.ts` (13 test cases: positive/negative/edge)

---

## 🔐 Environment Setup

Copy `.env.example` to `.env.local` and add Firebase credentials (all need `NEXT_PUBLIC_` prefix for client access):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Singleton pattern** in `lib/firebase/config.ts` prevents re-initialization during Next.js hot reload:

```typescript
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
```

---

## ⚠️ Common Pitfalls

1. **Don't instantiate services in API handlers** - do it at module level
2. **Don't use relative imports** - always use `@/` path aliases (prevents TypeScript caching issues)
3. **Don't forget Timestamp conversion** - API receives ISO strings, Firestore needs Timestamp
4. **Don't use route group names in URLs** - `(auth)/login` → `/login` not `/auth/login`
5. **Don't create same URL in different route groups** - `(patient)/dashboard` and `(staff)/dashboard` both resolve to `/dashboard` which causes build errors
6. **Don't hardcode CSS values** - ALWAYS use design tokens from `styles/variables.css` (spacing, colors, shadows, typography, etc.)
7. **Don't create markdown docs for minor changes** - only for major features/guides

---

## 📊 Project Status

-   Backend: 21 API endpoints ✅
-   Patient Portal: Dashboard, Appointments, Health Records, Billing, Profile ✅
-   Staff Portal: Staff Dashboard, Patients, Staff Appointments, Staff Billing, Reports ✅
-   Authentication: Login, Register, Password Reset, AuthContext, Middleware ✅
-   Testing: 93.11% coverage (105 tests) ✅

**All URL conflicts resolved** - Patient and Staff portals now have unique URL paths. 5. **Don't create same URL in different route groups** - `(patient)/dashboard` and `(staff)/dashboard` both resolve to `/dashboard` which causes build errors 6. **Don't hardcode CSS values** - ALWAYS use design tokens from `styles/variables.css` (spacing, colors, shadows, typography, etc.) 7. **Don't create markdown docs for minor changes** - only for major features/guides

---

## 📊 Project Status

-   Backend: 21 API endpoints ✅
-   Patient Portal: Dashboard, Appointments, Health Records, Billing, Profile ✅
-   Staff Portal: Staff Dashboard, Patients, Staff Appointments, Staff Billing, Reports ✅
-   Authentication: Login, Register, Password Reset, AuthContext, Middleware ✅
-   Testing: 93.11% coverage (105 tests) ✅

**All URL conflicts resolved** - Patient and Staff portals now have unique URL paths.

# Vitalink - Smart Healthcare System

A comprehensive Next.js full-stack application for managing healthcare operations in urban hospitals in Sri Lanka, featuring patient management, appointment scheduling, billing, insurance processing, and operational reporting.

## 🏥 Project Overview

Vitalink is a production-ready smart healthcare system implementing:

-   **Patient Health Record Management**
-   **Appointment Booking & Check-In System**
-   **Billing & Insurance Processing**
-   **Operational Reports & Analytics**
-   **Mobile-First Responsive Design**
-   **Comprehensive Test Coverage (>80% target)**

## 🛠️ Technology Stack

-   **Framework**: Next.js 14 (App Router + Pages Router hybrid)
-   **Database**: Firebase Cloud Firestore
-   **Authentication**: Firebase Auth
-   **Language**: TypeScript
-   **Testing**: Jest + React Testing Library
-   **Styling**: CSS Modules (mobile-first responsive)

## 📁 Project Structure

```
vitalink/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── patients/            # Patient CRUD endpoints
│   │   ├── appointments/        # Appointment management
│   │   ├── billing/             # Payment processing
│   │   ├── reports/             # Reporting endpoints
│   │   └── mock/                # Mock external APIs
│   ├── (auth)/                  # Authentication pages
│   ├── (staff)/                 # Staff-facing pages
│   └── (patient)/               # Patient portal pages
├── lib/
│   ├── firebase/                # Firebase configuration
│   │   ├── config.ts           # Firebase app initialization
│   │   └── auth.ts             # Authentication helpers
│   ├── types/                   # TypeScript type definitions
│   │   └── index.ts            # All domain models
│   ├── firestore/              # Data access layer
│   │   └── repositories/       # Repository pattern implementations
│   └── services/               # Business logic services
│       ├── PatientService.ts
│       ├── HealthRecordService.ts
│       ├── AppointmentService.ts
│       ├── BillingService.ts
│       ├── InsuranceService.ts
│       ├── ReportingService.ts
│       └── NotificationService.ts
├── components/                  # Reusable React components
├── styles/                      # Global styles
└── __tests__/                  # Test files
```

## 🚀 Getting Started

### Prerequisites

-   Node.js 18+
-   Firebase account
-   npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/MiniduTH/vitalink.git
cd vitalink
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure Firebase**

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. **Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## 🧪 Testing

Run all tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:ci
```

## 📊 Core Features

### 1. Patient Health Record Management (UC-1)

-   **Register Patient** (Staff)
-   **Update Demographics** (Staff)
-   **Update Lab Results** (Staff)
-   **Update Medical Notes** (Doctor)
-   **View Medical History** (Patient)

**API Endpoints:**

-   `POST /api/patients` - Register new patient
-   `GET /api/patients/:id` - Get patient details
-   `PUT /api/patients/:id` - Update patient
-   `GET /api/patients/:id/health-record` - Get health record
-   `PUT /api/patients/:id/health-record` - Update health record

### 2. Appointment Booking & Check-In (UC-2)

-   **Book Appointment** (Patient/Staff)
-   **Check Available Slots**
-   **Check-In** (Staff)
-   **Cancel/Reschedule** (Patient/Staff)

**API Endpoints:**

-   `POST /api/appointments` - Book appointment
-   `GET /api/appointments` - List appointments
-   `GET /api/appointments/available-slots` - Check availability
-   `POST /api/appointments/:id/check-in` - Check-in patient
-   `PUT /api/appointments/:id` - Update/reschedule
-   `DELETE /api/appointments/:id` - Cancel appointment

### 3. Billing & Insurance Processing (UC-3)

-   **Generate Bill** (Payments Officer)
-   **Check Insurance Eligibility** (Mock External API)
-   **Process Payment** (Mock Payment Gateway)
-   **Handle Payment Failures**

**API Endpoints:**

-   `POST /api/billing` - Generate bill
-   `POST /api/billing/process-payment` - Process payment
-   `GET /api/billing/:id` - Get payment details
-   `POST /api/mock/insurance-provider` - Mock insurance check
-   `POST /api/mock/payment-gateway` - Mock payment processing

### 4. Operational Reports (UC-4)

-   **Patient Flow Report** (Healthcare Manager)
-   **Revenue Report** (Healthcare Manager)
-   **Export to PDF/CSV**

**API Endpoints:**

-   `GET /api/reports/patient-flow?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
-   `GET /api/reports/revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
-   `POST /api/reports/export` - Export report

## 🏗️ Architecture & Design Patterns

### Repository Pattern

Separates data access logic from business logic:

```typescript
class PatientRepository {
    async findById(id: string): Promise<Patient | null>;
    async findAll(filters?: any): Promise<Patient[]>;
    async create(data: CreatePatientDTO): Promise<string>;
    async update(id: string, data: Partial<Patient>): Promise<void>;
}
```

### Service Layer Pattern

Implements business logic with SOLID principles:

```typescript
class AppointmentService {
    constructor(private appointmentRepo: AppointmentRepository, private notificationService: NotificationService) {}

    async bookAppointment(data: BookAppointmentDTO): Promise<Appointment> {
        // 1. Validate input
        // 2. Check availability (uses Firestore transactions)
        // 3. Create appointment
        // 4. Send notification
    }
}
```

### Design Patterns Implemented

-   ✅ **Repository Pattern**: Data access abstraction
-   ✅ **Service Layer Pattern**: Business logic separation
-   ✅ **Factory Pattern**: Report generation
-   ✅ **Strategy Pattern**: Payment method processing
-   ✅ **Observer Pattern**: Notifications
-   ✅ **Dependency Injection**: Service composition
-   ✅ **Singleton Pattern**: Firebase initialization

## 🎨 Mobile-First Responsive Design

All components follow mobile-first CSS methodology:

```css
/* Mobile: 320px - 768px (base) */
.container {
    padding: 1rem;
    max-width: 100%;
}

/* Tablet: 768px+ */
@media (min-width: 768px) {
    .container {
        padding: 2rem;
        max-width: 720px;
    }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
    .container {
        padding: 3rem;
        max-width: 1200px;
    }
}
```

## 🔒 Security & Access Control

### User Roles

-   **Patient**: Book appointments, view medical history
-   **Staff**: Manage patient records and appointments
-   **Doctor** (extends Staff): Update medical notes
-   **Payments Handling Officer** (extends Staff): Manage billing and insurance
-   **Healthcare Manager**: Generate operational reports

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isStaff() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/staff/$(request.auth.uid)).data.role in
        ['Staff', 'Doctor', 'PaymentsOfficer', 'Manager'];
    }

    match /patients/{patientId} {
      allow read: if isAuthenticated();
      allow write: if isStaff();
    }
  }
}
```

## 📈 Testing Strategy

### Test Categories

1. **Unit Tests**: Service layer and utility functions
2. **Integration Tests**: API routes
3. **Component Tests**: React components
4. **Edge Cases**: Boundary conditions, race conditions
5. **Error Cases**: Network failures, validation errors

### Example Test

```typescript
describe("AppointmentService", () => {
    it("should successfully book appointment with valid data", async () => {
        const mockData = {
            patientId: "123",
            doctorId: "456",
            appointmentDate: Timestamp.now(),
        };
        const result = await appointmentService.bookAppointment(mockData);
        expect(result.status).toBe("Scheduled");
    });

    it("should throw ConflictError when slot is unavailable", async () => {
        // Test negative case
    });
});
```

## 🚦 Implementation Status

### ✅ Completed (Phase 1-3)

-   ✅ Firebase configuration (Auth + Firestore)
-   ✅ Domain models and TypeScript types
-   ✅ Repository pattern implementation (6 repositories)
-   ✅ Service layer with business logic (7 services)
-   ✅ API routes (15+ endpoints)
-   ✅ Mock external APIs (payment gateway, insurance provider)
-   ✅ Sample UI components with mobile-first CSS
-   ✅ SOLID principles applied throughout
-   ✅ Error handling and validation

### ⏳ Remaining Tasks (Phase 4)

-   🔄 Complete UI pages (staff and patient portals)
-   🔄 Comprehensive test suite (targeting >80% coverage)
-   🔄 Additional UI components
-   🔄 End-to-end integration testing

## 🎯 Next Steps

1. **Create Authentication Pages** (`/app/(auth)/login` and `/app/(auth)/register`)
2. **Build Staff Dashboard** (`/app/(staff)/patients`, `/app/(staff)/appointments`, etc.)
3. **Build Patient Portal** (`/app/(patient)/dashboard`, `/app/(patient)/appointments`, etc.)
4. **Write Unit Tests** for all services
5. **Write Integration Tests** for all API routes
6. **Write Component Tests** for all React components
7. **Add Global CSS** for consistent styling
8. **Implement Real-time Features** (optional enhancement)

## 📚 API Documentation

### Authentication

All protected endpoints require Firebase Authentication token in headers:

```
Authorization: Bearer <firebase_id_token>
```

### Error Response Format

```json
{
    "success": false,
    "error": "Error message description"
}
```

### Success Response Format

```json
{
    "success": true,
    "data": {
        /* response data */
    }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

CSSE Project - Vitalink Healthcare System

---

**Built with ❤️ using Next.js, TypeScript, and Firebase**

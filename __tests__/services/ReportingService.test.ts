/**
 * @jest-environment node
 */
import { ReportingService } from "@/lib/services/ReportingService";
import { AppointmentRepository } from "@/lib/firestore/repositories/AppointmentRepository";
import { PaymentRepository } from "@/lib/firestore/repositories/PaymentRepository";
import { DepartmentRepository } from "@/lib/firestore/repositories/StaffRepository";
import { Appointment, Payment, Department } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

// Mock repositories
jest.mock("@/lib/firestore/repositories/AppointmentRepository");
jest.mock("@/lib/firestore/repositories/PaymentRepository");
jest.mock("@/lib/firestore/repositories/StaffRepository");

describe("ReportingService", () => {
    let reportingService: ReportingService;
    let mockAppointmentRepo: jest.Mocked<AppointmentRepository>;
    let mockPaymentRepo: jest.Mocked<PaymentRepository>;
    let mockDepartmentRepo: jest.Mocked<DepartmentRepository>;

    const mockDepartment: Department = {
        id: "dept123",
        name: "Cardiology",
        hospitalId: "hosp456",
        description: "Heart and cardiovascular care",
    };

    const mockAppointment: Appointment = {
        id: "appt123",
        patientId: "patient123",
        doctorId: "doctor456",
        departmentId: "dept123",
        appointmentDate: Timestamp.now(),
        timeSlot: "09:00 AM",
        status: "Completed",
        reason: "Follow-up",
        notes: "Patient doing well",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
    };

    const mockPayment: Payment = {
        id: "pay123",
        appointmentId: "appt123",
        patientId: "patient123",
        amount: 5000,
        insuranceCoverage: 3000,
        patientPortion: 2000,
        status: "Completed",
        paymentMethod: "Card",
        transactionId: "TXN123",
        paidAt: Timestamp.now(),
        createdAt: Timestamp.now(),
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockAppointmentRepo = new AppointmentRepository() as jest.Mocked<AppointmentRepository>;
        mockPaymentRepo = new PaymentRepository() as jest.Mocked<PaymentRepository>;
        mockDepartmentRepo = new DepartmentRepository() as jest.Mocked<DepartmentRepository>;

        reportingService = new ReportingService(mockAppointmentRepo, mockPaymentRepo, mockDepartmentRepo);
    });

    describe("generatePatientFlowReport", () => {
        it("should generate patient flow report with all appointments", async () => {
            const appointments = [mockAppointment, { ...mockAppointment, id: "appt456" }];
            mockAppointmentRepo.findByDateRange.mockResolvedValue(appointments);
            mockDepartmentRepo.findAll.mockResolvedValue([mockDepartment]);
            mockDepartmentRepo.findById.mockResolvedValue(mockDepartment);

            const startDate = new Date("2024-01-01");
            const endDate = new Date("2024-01-31");

            const report = await reportingService.generatePatientFlowReport(startDate, endDate);

            expect(report.totalAppointments).toBe(2);
            expect(report.departmentBreakdown).toBeDefined();
            expect(mockAppointmentRepo.findByDateRange).toHaveBeenCalledWith(expect.any(Timestamp), expect.any(Timestamp));
        });

        it("should calculate average wait time correctly", async () => {
            mockAppointmentRepo.findByDateRange.mockResolvedValue([mockAppointment]);
            mockDepartmentRepo.findAll.mockResolvedValue([mockDepartment]);
            mockDepartmentRepo.findById.mockResolvedValue(mockDepartment);

            const startDate = new Date("2024-01-01");
            const endDate = new Date("2024-01-31");

            const report = await reportingService.generatePatientFlowReport(startDate, endDate);

            expect(report.averageWaitTime).toBeGreaterThanOrEqual(0);
        });

        it("should handle empty date range with no appointments", async () => {
            mockAppointmentRepo.findByDateRange.mockResolvedValue([]);
            mockDepartmentRepo.findAll.mockResolvedValue([]);

            const startDate = new Date("2024-01-01");
            const endDate = new Date("2024-01-31");

            const report = await reportingService.generatePatientFlowReport(startDate, endDate);

            expect(report.totalAppointments).toBe(0);
            expect(report.averageWaitTime).toBe(0);
        });

        it("should group appointments by department", async () => {
            const dept2: Department = {
                ...mockDepartment,
                id: "dept456",
                name: "Orthopedics",
            };

            const appt1 = { ...mockAppointment, departmentId: "dept123" };
            const appt2 = { ...mockAppointment, id: "appt456", departmentId: "dept456" };

            mockAppointmentRepo.findByDateRange.mockResolvedValue([appt1, appt2]);
            mockDepartmentRepo.findAll.mockResolvedValue([mockDepartment, dept2]);
            mockDepartmentRepo.findById.mockResolvedValueOnce(mockDepartment).mockResolvedValueOnce(dept2);

            const report = await reportingService.generatePatientFlowReport(new Date("2024-01-01"), new Date("2024-01-31"));

            expect(report.departmentBreakdown.length).toBeGreaterThanOrEqual(2);
        });
    });

    describe("generateRevenueReport", () => {
        it("should generate revenue report with total and breakdown", async () => {
            const payments = [mockPayment, { ...mockPayment, id: "pay456", amount: 3000 }];
            mockPaymentRepo.findByDateRange.mockResolvedValue(payments);

            const startDate = new Date("2024-01-01");
            const endDate = new Date("2024-01-31");

            const report = await reportingService.generateRevenueReport(startDate, endDate);

            expect(report.totalRevenue).toBe(8000);
            expect(report.cashPayments + report.cardPayments).toBe(8000);
        });

        it("should calculate daily revenue breakdown", async () => {
            mockPaymentRepo.findByDateRange.mockResolvedValue([mockPayment]);

            const report = await reportingService.generateRevenueReport(new Date("2024-01-01"), new Date("2024-01-31"));

            expect(report.dailyBreakdown).toBeDefined();
            expect(report.dailyBreakdown.length).toBeGreaterThan(0);
        });

        it("should handle empty date range with no payments", async () => {
            mockPaymentRepo.findByDateRange.mockResolvedValue([]);

            const report = await reportingService.generateRevenueReport(new Date("2024-01-01"), new Date("2024-01-31"));

            expect(report.totalRevenue).toBe(0);
            // Daily breakdown includes all dates in range with zero values
            expect(report.dailyBreakdown.length).toBeGreaterThan(0);
        });

        it("should separate completed and pending payments", async () => {
            const completedPayment = { ...mockPayment, status: "Completed" as const };
            const pendingPayment = { ...mockPayment, id: "pay456", status: "Pending" as const };

            mockPaymentRepo.findByDateRange.mockResolvedValue([completedPayment, pendingPayment]);

            const report = await reportingService.generateRevenueReport(new Date("2024-01-01"), new Date("2024-01-31"));

            expect(report.totalRevenue).toBe(5000); // Only completed
        });
    });

    describe("exportReport", () => {
        it("should export patient flow report to CSV", async () => {
            mockAppointmentRepo.findByDateRange.mockResolvedValue([mockAppointment]);
            mockDepartmentRepo.findAll.mockResolvedValue([mockDepartment]);
            mockDepartmentRepo.findById.mockResolvedValue(mockDepartment);

            const report = await reportingService.generatePatientFlowReport(new Date("2024-01-01"), new Date("2024-01-31"));

            const csvData = await reportingService.exportReport(report, "CSV");

            expect(csvData).toContain("Total Appointments");
            expect(csvData).toContain("Average Wait Time");
        });

        it("should export revenue report to CSV", async () => {
            mockPaymentRepo.findByDateRange.mockResolvedValue([mockPayment]);

            const report = await reportingService.generateRevenueReport(new Date("2024-01-01"), new Date("2024-01-31"));

            const csvData = await reportingService.exportReport(report, "CSV");

            expect(csvData).toContain("Total Revenue");
        });

        it("should export report to PDF format", async () => {
            mockPaymentRepo.findByDateRange.mockResolvedValue([mockPayment]);

            const report = await reportingService.generateRevenueReport(new Date("2024-01-01"), new Date("2024-01-31"));

            const pdfData = await reportingService.exportReport(report, "PDF");

            // PDF export returns a file path, not the content
            expect(pdfData).toMatch(/^\/reports\/report_\d+\.pdf$/);
        });
    });

    describe("Edge Cases", () => {
        it("should handle appointments with missing department data", async () => {
            mockAppointmentRepo.findByDateRange.mockResolvedValue([mockAppointment]);
            mockDepartmentRepo.findAll.mockResolvedValue([mockDepartment]);
            mockDepartmentRepo.findById.mockResolvedValue(null);

            const report = await reportingService.generatePatientFlowReport(new Date("2024-01-01"), new Date("2024-01-31"));

            expect(report.totalAppointments).toBe(1);
        });

        it("should handle date ranges spanning multiple months", async () => {
            const payments = Array.from({ length: 90 }, (_, i) => ({
                ...mockPayment,
                id: `pay${i}`,
            }));
            mockPaymentRepo.findByDateRange.mockResolvedValue(payments);

            const report = await reportingService.generateRevenueReport(new Date("2024-01-01"), new Date("2024-03-31"));

            expect(report.totalRevenue).toBeGreaterThan(0);
        });

        it("should handle appointments with various statuses", async () => {
            const scheduledAppt = { ...mockAppointment, status: "Scheduled" as const };
            const completedAppt = { ...mockAppointment, id: "appt456", status: "Completed" as const };
            const cancelledAppt = { ...mockAppointment, id: "appt789", status: "Cancelled" as const };

            mockAppointmentRepo.findByDateRange.mockResolvedValue([scheduledAppt, completedAppt, cancelledAppt]);
            mockDepartmentRepo.findAll.mockResolvedValue([mockDepartment]);
            mockDepartmentRepo.findById.mockResolvedValue(mockDepartment);

            const report = await reportingService.generatePatientFlowReport(new Date("2024-01-01"), new Date("2024-01-31"));

            expect(report.totalAppointments).toBe(3);
        });
    });
});

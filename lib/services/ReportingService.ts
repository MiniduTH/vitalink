import { AppointmentRepository } from "@/lib/firestore/repositories/AppointmentRepository";
import { PaymentRepository } from "@/lib/firestore/repositories/PaymentRepository";
import { DepartmentRepository } from "@/lib/firestore/repositories/StaffRepository";
import { PatientFlowReport, RevenueReport, DailyRevenue, DepartmentStats } from "@/lib/types";
import { Timestamp } from "firebase/firestore";

export class ReportingService {
    constructor(
        private appointmentRepo: AppointmentRepository,
        private paymentRepo: PaymentRepository,
        private departmentRepo: DepartmentRepository
    ) {}

    async generatePatientFlowReport(startDate: Date, endDate: Date): Promise<PatientFlowReport> {
        const start = Timestamp.fromDate(startDate);
        const end = Timestamp.fromDate(endDate);

        // Fetch appointments in date range
        const appointments = await this.appointmentRepo.findByDateRange(start, end);

        // Calculate metrics
        const totalAppointments = appointments.length;
        const scheduledAppointments = appointments.filter((apt) => apt.status === "Scheduled" || apt.status === "Confirmed").length;
        const completedAppointments = appointments.filter((apt) => apt.status === "Completed").length;
        const cancelledAppointments = appointments.filter((apt) => apt.status === "Cancelled").length;

        // Calculate average wait time (mock calculation)
        const averageWaitTime = this.calculateAverageWaitTime(appointments);

        // Department breakdown
        const departmentBreakdown = await this.calculateDepartmentStats(appointments);

        return {
            totalAppointments,
            scheduledAppointments,
            completedAppointments,
            cancelledAppointments,
            averageWaitTime,
            departmentBreakdown,
            dateRange: {
                start: startDate,
                end: endDate,
            },
        };
    }

    async generateRevenueReport(startDate: Date, endDate: Date): Promise<RevenueReport> {
        const start = Timestamp.fromDate(startDate);
        const end = Timestamp.fromDate(endDate);

        // Fetch payments in date range
        const payments = await this.paymentRepo.findByDateRange(start, end);

        // Calculate revenue metrics
        const totalRevenue = payments.filter((p) => p.status === "Completed").reduce((sum, p) => sum + p.amount, 0);

        const cashPayments = payments.filter((p) => p.status === "Completed" && p.paymentMethod === "Cash").reduce((sum, p) => sum + p.amount, 0);

        const cardPayments = payments.filter((p) => p.status === "Completed" && p.paymentMethod === "Card").reduce((sum, p) => sum + p.amount, 0);

        const insurancePayments = payments.filter((p) => p.status === "Completed").reduce((sum, p) => sum + p.insuranceCoverage, 0);

        const pendingPayments = payments.filter((p) => p.status === "Pending").reduce((sum, p) => sum + p.amount, 0);

        const refunds = payments.filter((p) => p.status === "Refunded").reduce((sum, p) => sum + p.amount, 0);

        // Daily breakdown
        const dailyBreakdown = this.calculateDailyRevenue(payments, startDate, endDate);

        return {
            totalRevenue,
            cashPayments,
            cardPayments,
            insurancePayments,
            pendingPayments,
            refunds,
            dateRange: {
                start: startDate,
                end: endDate,
            },
            dailyBreakdown,
        };
    }

    async exportReport(reportData: PatientFlowReport | RevenueReport, format: "PDF" | "CSV"): Promise<string> {
        // Mock export functionality
        // In production, this would generate actual PDF/CSV files
        const reportJson = JSON.stringify(reportData, null, 2);

        if (format === "CSV") {
            return this.convertToCSV(reportData);
        } else {
            // Return mock PDF path
            return `/reports/report_${Date.now()}.pdf`;
        }
    }

    private calculateAverageWaitTime(appointments: any[]): number {
        // Mock calculation - in production, would calculate based on check-in and appointment times
        if (appointments.length === 0) return 0;

        const completedAppointments = appointments.filter((apt) => apt.status === "Completed");
        if (completedAppointments.length === 0) return 0;

        // Mock: average wait time between 15-45 minutes
        return Math.floor(Math.random() * 30) + 15;
    }

    private async calculateDepartmentStats(appointments: any[]): Promise<DepartmentStats[]> {
        const departments = await this.departmentRepo.findAll();
        const stats: DepartmentStats[] = [];

        for (const dept of departments) {
            const deptAppointments = appointments.filter((apt) => apt.departmentId === dept.id);

            stats.push({
                departmentId: dept.id,
                departmentName: dept.name,
                appointmentCount: deptAppointments.length,
                averageWaitTime: this.calculateAverageWaitTime(deptAppointments),
            });
        }

        return stats;
    }

    private calculateDailyRevenue(payments: any[], startDate: Date, endDate: Date): DailyRevenue[] {
        const dailyMap = new Map<string, { revenue: number; transactions: number }>();

        // Initialize all dates in range
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateKey = currentDate.toISOString().split("T")[0];
            dailyMap.set(dateKey, { revenue: 0, transactions: 0 });
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Aggregate payments by date
        payments.forEach((payment) => {
            if (payment.status === "Completed" && payment.paidAt) {
                const date = payment.paidAt.toDate();
                const dateKey = date.toISOString().split("T")[0];

                if (dailyMap.has(dateKey)) {
                    const stats = dailyMap.get(dateKey)!;
                    stats.revenue += payment.amount;
                    stats.transactions += 1;
                }
            }
        });

        // Convert to array
        return Array.from(dailyMap.entries()).map(([date, stats]) => ({
            date,
            revenue: stats.revenue,
            transactions: stats.transactions,
        }));
    }

    private convertToCSV(data: any): string {
        // Simple CSV conversion
        // In production, use a proper CSV library
        if ("totalAppointments" in data) {
            // Patient Flow Report
            return `Metric,Value
Total Appointments,${data.totalAppointments}
Scheduled,${data.scheduledAppointments}
Completed,${data.completedAppointments}
Cancelled,${data.cancelledAppointments}
Average Wait Time,${data.averageWaitTime} minutes`;
        } else {
            // Revenue Report
            return `Metric,Value
Total Revenue,${data.totalRevenue}
Cash Payments,${data.cashPayments}
Card Payments,${data.cardPayments}
Insurance Payments,${data.insurancePayments}
Pending Payments,${data.pendingPayments}
Refunds,${data.refunds}`;
        }
    }
}

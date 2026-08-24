import { apiClient, ApiSuccessResponse } from '@/lib/axios';

export interface MemberReport {
  total: number;
  active: number;
  onLeave: number;
  inactive: number;
  byTeam: { teamId: string; teamName: string; memberCount: number }[];
}

export interface EventReport {
  total: number;
  completed: number;
  cancelled: number;
  byStatus: { status: string; count: number }[];
}

export interface AttendanceReport {
  totalSessions: number;
  present: number;
  absentWithPermission: number;
  absentWithoutPermission: number;
  attendanceRate: number;
}

export interface SalaryReport {
  byMember: { memberId: string; memberName: string; month: number; year: number; totalAmount: number; status: string }[];
  totalByMonth: { month: string; total: number }[];
  totalByEvent: { eventName: string; total: number }[];
  grandTotal: number;
}

export interface MonthlyAttendanceMatrixEvent {
  eventId: string;
  eventCode: string;
  name: string;
  eventDate: string;
  location: string;
  status: string;
  attendeeCount: number;
}

export interface MonthlyAttendanceMatrixMember {
  memberId: string;
  memberCode: string;
  fullName: string;
  phone?: string | null;
  status: string;
  teamNames: string;
  positionNames: string;
  totalAttended: number;
  shows: Record<
    string,
    {
      isAttended: boolean;
      attendanceStatus: string | null;
      isAssigned: boolean;
      positionName: string | null;
    }
  >;
}

export interface MonthlyAttendanceMatrix {
  month: number;
  year: number;
  events: MonthlyAttendanceMatrixEvent[];
  members: MonthlyAttendanceMatrixMember[];
  totalEvents: number;
  totalMembers: number;
}

export const reportService = {
  async members() {
    const res = await apiClient.get<ApiSuccessResponse<MemberReport>>('/reports/members');
    return res.data.data;
  },
  async events() {
    const res = await apiClient.get<ApiSuccessResponse<EventReport>>('/reports/events');
    return res.data.data;
  },
  async attendance() {
    const res = await apiClient.get<ApiSuccessResponse<AttendanceReport>>('/reports/attendance');
    return res.data.data;
  },
  async salary(month?: number, year?: number) {
    const res = await apiClient.get<ApiSuccessResponse<SalaryReport>>('/reports/salary', {
      params: { month, year },
    });
    return res.data.data;
  },
  async monthlyMatrix(month?: number, year?: number) {
    const res = await apiClient.get<ApiSuccessResponse<MonthlyAttendanceMatrix>>('/reports/monthly-matrix', {
      params: { month, year },
    });
    return res.data.data;
  },

  getSalaryExportUrl(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.set('month', String(month));
    if (year) params.set('year', String(year));
    return `/reports/salary/export?${params.toString()}`;
  },

  getMatrixExportUrl(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.set('month', String(month));
    if (year) params.set('year', String(year));
    return `/reports/monthly-matrix/export?${params.toString()}`;
  },

  // Tải file Excel báo cáo tiền công về máy
  async downloadSalaryExcel(month?: number, year?: number) {
    const res = await apiClient.get(this.getSalaryExportUrl(month, year), { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-tien-cong-${month || 'all'}-${year || ''}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  // Tải file Excel báo cáo ma trận đi show về máy
  async downloadMatrixExcel(month?: number, year?: number) {
    const res = await apiClient.get(this.getMatrixExportUrl(month, year), { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ma-tran-di-show-thang-${month || 'all'}-${year || ''}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

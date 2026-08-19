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
  getSalaryExportUrl(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.set('month', String(month));
    if (year) params.set('year', String(year));
    return `/reports/salary/export?${params.toString()}`;
  },

  // Tải file Excel báo cáo tiền công về máy (dùng axios để đính kèm Authorization header)
  async downloadSalaryExcel(month?: number, year?: number) {
    const res = await apiClient.get(this.getSalaryExportUrl(month, year), { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bao-cao-tien-cong.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

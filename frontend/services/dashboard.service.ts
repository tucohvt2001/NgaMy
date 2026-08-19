import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import { DashboardSummary } from '@/types/models';

export interface DashboardCharts {
  eventsByMonth: { month: number; count: number }[];
  salaryByMonth: { month: number; total: number }[];
  attendanceRate: { total: number; present: number; rate: number };
  memberStatus: { active: number; inactive: number; onLeave: number };
}

export const dashboardService = {
  async getSummary() {
    const res = await apiClient.get<ApiSuccessResponse<DashboardSummary>>('/dashboard/summary');
    return res.data.data;
  },

  async getCharts(year: number) {
    const res = await apiClient.get<ApiSuccessResponse<DashboardCharts>>('/dashboard/charts', {
      params: { year },
    });
    return res.data.data;
  },
};

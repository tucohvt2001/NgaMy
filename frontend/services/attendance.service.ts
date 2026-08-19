import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import { Attendance, PaginatedResult } from '@/types/models';

export interface AttendanceListParams {
  eventId?: string;
  memberId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export const attendanceService = {
  async list(params: AttendanceListParams) {
    const res = await apiClient.get<ApiSuccessResponse<PaginatedResult<Attendance>>>('/attendance', { params });
    return res.data.data;
  },

  async checkIn(eventId: string) {
    const res = await apiClient.post<ApiSuccessResponse<Attendance>>('/attendance/check-in', { eventId });
    return res.data.data;
  },

  async checkOut(eventId: string) {
    const res = await apiClient.post<ApiSuccessResponse<Attendance>>('/attendance/check-out', { eventId });
    return res.data.data;
  },

  async confirm(id: string, status: string, note?: string) {
    const res = await apiClient.put<ApiSuccessResponse<Attendance>>(`/attendance/${id}/confirm`, {
      status,
      note,
    });
    return res.data.data;
  },
};

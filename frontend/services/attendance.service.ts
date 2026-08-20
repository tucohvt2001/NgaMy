import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import { Attendance, EventItem, Member, PaginatedResult, Position } from '@/types/models';

export interface AttendanceListParams {
  eventId?: string;
  memberId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface EventAttendanceItem {
  member: Member;
  position: Position | null;
  attendance: Attendance | null;
  isAssigned: boolean;
}

export interface EventAttendanceStats {
  totalAssigned: number;
  totalRecords: number;
  present: number;
  late: number;
  absentWithPermission: number;
  absentWithoutPermission: number;
  replaced: number;
  unmarked: number;
}

export interface EventAttendanceSheet {
  event: EventItem;
  members: EventAttendanceItem[];
  stats: EventAttendanceStats;
}

export interface AdminRecordAttendancePayload {
  eventId: string;
  memberId: string;
  status: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  note?: string | null;
}

export interface AdminBatchAttendanceItemPayload {
  memberId: string;
  status: string;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  note?: string | null;
}

export interface AdminBatchAttendancePayload {
  eventId: string;
  items: AdminBatchAttendanceItemPayload[];
}

export const attendanceService = {
  async getEventSheet(eventId: string) {
    const res = await apiClient.get<ApiSuccessResponse<EventAttendanceSheet>>(`/attendance/event/${eventId}`);
    return res.data.data;
  },

  async recordByAdmin(payload: AdminRecordAttendancePayload) {
    const res = await apiClient.post<ApiSuccessResponse<Attendance>>('/attendance/record', payload);
    return res.data.data;
  },

  async batchRecordByAdmin(payload: AdminBatchAttendancePayload) {
    const res = await apiClient.post<ApiSuccessResponse<Attendance[]>>('/attendance/batch', payload);
    return res.data.data;
  },

  async delete(id: string) {
    const res = await apiClient.delete<ApiSuccessResponse<null>>(`/attendance/${id}`);
    return res.data.data;
  },

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

import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import { LeaveRequest, PaginatedResult } from '@/types/models';

export interface LeaveListParams {
  memberId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface LeaveInput {
  fromDate: string;
  toDate: string;
  reason: string;
}

export const leaveService = {
  async list(params: LeaveListParams) {
    const res = await apiClient.get<ApiSuccessResponse<PaginatedResult<LeaveRequest>>>('/leaves', { params });
    return res.data.data;
  },

  async create(input: LeaveInput) {
    const res = await apiClient.post<ApiSuccessResponse<{ leave: LeaveRequest; warnings: string[] }>>(
      '/leaves',
      input,
    );
    return res.data.data;
  },

  async approve(id: string) {
    const res = await apiClient.put<ApiSuccessResponse<LeaveRequest>>(`/leaves/${id}/approve`);
    return res.data.data;
  },

  async reject(id: string) {
    const res = await apiClient.put<ApiSuccessResponse<LeaveRequest>>(`/leaves/${id}/reject`);
    return res.data.data;
  },
};

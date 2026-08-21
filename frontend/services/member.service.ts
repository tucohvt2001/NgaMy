import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import { Member, MemberStatus, PaginatedResult } from '@/types/models';

export interface MemberListParams {
  page?: number;
  limit?: number;
  search?: string;
  teamId?: string;
  status?: MemberStatus;
}

export interface MemberInput {
  memberCode?: string;
  fullName: string;
  gender?: string | null;
  phone?: string | null;
  address?: string | null;
  dateOfBirth?: string | null;
  joinDate?: string | null;
  teamIds?: string[];
  positionIds?: string[];
  status?: MemberStatus;
  bankAccount?: string | null;
  bankName?: string | null;
  bankCode?: string | null;
  bankBin?: string | null;
  bankId?: string | null;
  note?: string | null;
}

export const memberService = {
  async list(params: MemberListParams) {
    const res = await apiClient.get<ApiSuccessResponse<PaginatedResult<Member>>>('/members', { params });
    return res.data.data;
  },

  async getStats() {
    const res = await apiClient.get<ApiSuccessResponse<{
      total: number;
      active: number;
      onLeave: number;
      inactive: number;
      withBank: number;
    }>>('/members/stats');
    return res.data.data;
  },

  async getById(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<Member>>(`/members/${id}`);
    return res.data.data;
  },

  async create(input: MemberInput) {
    const res = await apiClient.post<ApiSuccessResponse<Member>>('/members', input);
    return res.data.data;
  },

  async update(id: string, input: Partial<MemberInput>) {
    const res = await apiClient.put<ApiSuccessResponse<Member>>(`/members/${id}`, input);
    return res.data.data;
  },

  async remove(id: string) {
    await apiClient.delete(`/members/${id}`);
  },
};

import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import { Member, Team } from '@/types/models';

export interface TeamInput {
  name: string;
  description?: string | null;
  leaderId?: string | null;
  isActive?: boolean;
}

export const teamService = {
  async list() {
    const res = await apiClient.get<ApiSuccessResponse<Team[]>>('/teams');
    return res.data.data;
  },

  async getById(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<Team>>(`/teams/${id}`);
    return res.data.data;
  },

  async getMembers(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<Member[]>>(`/teams/${id}/members`);
    return res.data.data;
  },

  async create(input: TeamInput) {
    const res = await apiClient.post<ApiSuccessResponse<Team>>('/teams', input);
    return res.data.data;
  },

  async update(id: string, input: Partial<TeamInput>) {
    const res = await apiClient.put<ApiSuccessResponse<Team>>(`/teams/${id}`, input);
    return res.data.data;
  },

  async remove(id: string) {
    await apiClient.delete(`/teams/${id}`);
  },
};

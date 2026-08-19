import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import { Position } from '@/types/models';

export interface PositionInput {
  name: string;
  description?: string | null;
  isActive?: boolean;
}

export const positionService = {
  async list() {
    const res = await apiClient.get<ApiSuccessResponse<Position[]>>('/positions');
    return res.data.data;
  },

  async create(input: PositionInput) {
    const res = await apiClient.post<ApiSuccessResponse<Position>>('/positions', input);
    return res.data.data;
  },

  async update(id: string, input: Partial<PositionInput>) {
    const res = await apiClient.put<ApiSuccessResponse<Position>>(`/positions/${id}`, input);
    return res.data.data;
  },

  async remove(id: string) {
    await apiClient.delete(`/positions/${id}`);
  },
};

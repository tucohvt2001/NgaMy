import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import { EventTypeModel } from '@/types/models';

export interface EventTypeInput {
  code: string;
  name: string;
  description?: string | null;
  color?: string | null;
  isActive?: boolean;
}

export const eventTypeService = {
  async list(params?: { isActive?: boolean; search?: string }) {
    const res = await apiClient.get<ApiSuccessResponse<EventTypeModel[]>>('/event-types', { params });
    return res.data.data;
  },

  async getById(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<EventTypeModel>>(`/event-types/${id}`);
    return res.data.data;
  },

  async create(input: EventTypeInput) {
    const res = await apiClient.post<ApiSuccessResponse<EventTypeModel>>('/event-types', input);
    return res.data.data;
  },

  async update(id: string, input: Partial<EventTypeInput>) {
    const res = await apiClient.put<ApiSuccessResponse<EventTypeModel>>(`/event-types/${id}`, input);
    return res.data.data;
  },

  async remove(id: string) {
    const res = await apiClient.delete<ApiSuccessResponse<void>>(`/event-types/${id}`);
    return res.data.data;
  },
};

import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import { Bank } from '@/types/models';

export const bankService = {
  async getBanks(params?: { search?: string; transferOnly?: boolean }): Promise<Bank[]> {
    const res = await apiClient.get<ApiSuccessResponse<Bank[]>>('/banks', { params });
    return res.data.data;
  },

  async getBankById(id: string): Promise<Bank> {
    const res = await apiClient.get<ApiSuccessResponse<Bank>>(`/banks/${id}`);
    return res.data.data;
  },

  async syncBanks(): Promise<Bank[]> {
    const res = await apiClient.post<ApiSuccessResponse<Bank[]>>('/banks/sync');
    return res.data.data;
  },
};

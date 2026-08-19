import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import { PaginatedResult, SalaryConfig, SalaryRecord } from '@/types/models';

export interface SalaryListParams {
  memberId?: string;
  month?: number;
  year?: number;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CalculateSalaryInput {
  memberId: string;
  month: number;
  year: number;
  allowance?: number;
  bonus?: number;
  deduction?: number;
}

export interface SalaryConfigInput {
  positionId?: string | null;
  memberId?: string | null;
  eventId?: string | null;
  amount: number;
  note?: string | null;
  isActive?: boolean;
}

export const salaryService = {
  async list(params: SalaryListParams) {
    const res = await apiClient.get<ApiSuccessResponse<PaginatedResult<SalaryRecord>>>('/salaries', { params });
    return res.data.data;
  },

  async getById(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<SalaryRecord>>(`/salaries/${id}`);
    return res.data.data;
  },

  async calculate(input: CalculateSalaryInput) {
    const res = await apiClient.post<ApiSuccessResponse<SalaryRecord>>('/salaries/calculate', input);
    return res.data.data;
  },

  async confirm(id: string) {
    const res = await apiClient.post<ApiSuccessResponse<SalaryRecord>>(`/salaries/${id}/confirm`);
    return res.data.data;
  },

  async listConfigs() {
    const res = await apiClient.get<ApiSuccessResponse<SalaryConfig[]>>('/salaries/configs');
    return res.data.data;
  },

  async createConfig(input: SalaryConfigInput) {
    const res = await apiClient.post<ApiSuccessResponse<SalaryConfig>>('/salaries/configs', input);
    return res.data.data;
  },

  async removeConfig(id: string) {
    await apiClient.delete(`/salaries/configs/${id}`);
  },
};

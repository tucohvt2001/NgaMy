import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import { PaginatedResult, SalaryConfig, SalaryRecord } from '@/types/models';

export interface SalaryListParams {
  memberId?: string;
  month?: number;
  year?: number;
  status?: string;
  autoCalculate?: 'true' | 'false';
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

export interface CalculateMonthInput {
  month: number;
  year: number;
}

export interface SalaryConfigInput {
  eventType?: string | null;
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

  async calculateMonth(input: CalculateMonthInput) {
    const res = await apiClient.post<ApiSuccessResponse<SalaryRecord[]>>('/salaries/calculate-month', input);
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

  async batchSavePositionConfigs(configs: Array<{ positionId: string; amount: number; note?: string | null }>) {
    const res = await apiClient.post<ApiSuccessResponse<SalaryConfig[]>>('/salaries/configs/batch-positions', {
      configs,
    });
    return res.data.data;
  },

  async batchSaveMatrixConfigs(
    configs: Array<{ eventType: string; positionId: string; amount: number; note?: string | null }>,
  ) {
    const res = await apiClient.post<ApiSuccessResponse<SalaryConfig[]>>('/salaries/configs/matrix', {
      configs,
    });
    return res.data.data;
  },

  async getMembersToDate(params?: { fromDate?: string; toDate?: string; teamId?: string; search?: string }) {
    const res = await apiClient.get<ApiSuccessResponse<MemberSalaryToDateResponse>>('/salaries/members-to-date', {
      params,
    });
    return res.data.data;
  },

  async saveEventRate(data: { eventId: string; amount: number; note?: string | null }) {
    const res = await apiClient.post<ApiSuccessResponse<SalaryConfig>>('/salaries/configs/event-rate', data);
    return res.data.data;
  },

  async removeConfig(id: string) {
    const res = await apiClient.delete<ApiSuccessResponse<null>>(`/salaries/configs/${id}`);
    return res.data.data;
  },
};

export interface MemberSalaryToDateEvent {
  eventId: string;
  eventCode: string;
  eventName: string;
  eventType: string | null;
  eventDate: string;
  location: string;
  roles: string[];
  amount: number;
  status: string;
}

export interface MemberSalaryToDateRecord {
  id: string;
  month: number;
  year: number;
  totalAmount: number;
  status: string;
  confirmedAt?: string | null;
}

export interface MemberSalaryToDateItem {
  memberId: string;
  memberCode: string;
  fullName: string;
  avatar?: string | null;
  phone?: string | null;
  status: string;
  bankAccount?: string | null;
  bankName?: string | null;
  bankCode?: string | null;
  bankBin?: string | null;
  teams: string[];
  positions: string[];
  totalEvents: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  events: MemberSalaryToDateEvent[];
  salaryRecords: MemberSalaryToDateRecord[];
}

export interface MemberSalaryToDateSummary {
  totalMembers: number;
  activeMembersWithEarnings: number;
  grandTotalAmount: number;
  grandPaidAmount: number;
  grandRemainingAmount: number;
  grandTotalEvents: number;
}

export interface MemberSalaryToDateResponse {
  summary: MemberSalaryToDateSummary;
  members: MemberSalaryToDateItem[];
}

import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import {
  PaginatedResult,
  Transaction,
  TransactionInput,
  TransactionQueryParams,
  TransactionSummary,
} from '@/types/models';

export const transactionService = {
  async list(params?: TransactionQueryParams) {
    const res = await apiClient.get<ApiSuccessResponse<PaginatedResult<Transaction>>>('/transactions', {
      params,
    });
    return res.data.data;
  },

  async getSummary(params?: { fromDate?: string; toDate?: string; year?: number }) {
    const res = await apiClient.get<ApiSuccessResponse<TransactionSummary>>(
      '/transactions/summary',
      { params },
    );
    return res.data.data;
  },

  async getById(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<Transaction>>(`/transactions/${id}`);
    return res.data.data;
  },

  async create(input: TransactionInput) {
    const res = await apiClient.post<ApiSuccessResponse<Transaction>>('/transactions', input);
    return res.data.data;
  },

  async update(id: string, input: Partial<TransactionInput>) {
    const res = await apiClient.put<ApiSuccessResponse<Transaction>>(
      `/transactions/${id}`,
      input,
    );
    return res.data.data;
  },

  async remove(id: string) {
    const res = await apiClient.delete<ApiSuccessResponse<{ success: boolean }>>(
      `/transactions/${id}`,
    );
    return res.data.data;
  },

  async downloadExcel(params?: TransactionQueryParams) {
    const res = await apiClient.get('/transactions/export/excel', {
      params,
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `so-quy-thu-chi-${new Date().toISOString().slice(0, 10)}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

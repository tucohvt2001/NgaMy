import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import { Account, PaginatedResult, Role } from '@/types/models';

export interface AccountInput {
  username: string;
  email: string;
  password: string;
  roleId: string;
  memberId?: string | null;
  isActive?: boolean;
}

export const accountService = {
  async list(page = 1, limit = 20) {
    const res = await apiClient.get<ApiSuccessResponse<PaginatedResult<Account>>>('/accounts', {
      params: { page, limit },
    });
    return res.data.data;
  },

  async create(input: AccountInput) {
    const res = await apiClient.post<ApiSuccessResponse<Account>>('/accounts', input);
    return res.data.data;
  },

  async update(id: string, input: Partial<AccountInput>) {
    const res = await apiClient.put<ApiSuccessResponse<Account>>(`/accounts/${id}`, input);
    return res.data.data;
  },

  async remove(id: string) {
    await apiClient.delete(`/accounts/${id}`);
  },

  async listRoles() {
    const res = await apiClient.get<ApiSuccessResponse<Role[]>>('/roles');
    return res.data.data;
  },
};

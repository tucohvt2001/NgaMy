import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import { AuthUser } from '@/types/models';

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const authService = {
  async login(identifier: string, password: string) {
    const res = await apiClient.post<ApiSuccessResponse<LoginResponse>>('/auth/login', {
      identifier,
      password,
    });
    return res.data.data;
  },

  async logout() {
    await apiClient.post('/auth/logout');
  },

  async me() {
    const res = await apiClient.get<ApiSuccessResponse<AuthUser>>('/auth/me');
    return res.data.data;
  },
};

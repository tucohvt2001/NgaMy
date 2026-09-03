import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '@/constants/config';
import { useAuthStore } from '@/stores/authStore';
import { useLoadingStore } from '@/stores/loadingStore';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  message: string;
  errors: unknown[];
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Đính kèm access token và quản lý trạng thái loading toàn cục
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    useLoadingStore.getState().startLoading();
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    useLoadingStore.getState().stopLoading();
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    useLoadingStore.getState().stopLoading();
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    useLoadingStore.getState().stopLoading();
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        const isPublicRoute =
          path.startsWith('/login') ||
          path.startsWith('/review') ||
          path.startsWith('/feedback');
        if (!isPublicRoute) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);


import { AxiosError } from 'axios';
import { ApiErrorResponse } from '@/lib/axios';

export function getErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.message) return data.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

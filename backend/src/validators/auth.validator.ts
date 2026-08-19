import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Vui lòng nhập tên đăng nhập hoặc email'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Thiếu refresh token'),
});

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;

import { z } from 'zod';

export const createAccountSchema = z.object({
  username: z.string().min(3, 'Tên đăng nhập tối thiểu 3 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  roleId: z.string().min(1, 'Vui lòng chọn vai trò'),
  memberId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = z.object({
  email: z.string().email('Email không hợp lệ').optional(),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').optional(),
  roleId: z.string().min(1).optional(),
  memberId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

export const listQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
});

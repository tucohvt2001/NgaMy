import { z } from 'zod';

export const createLeaveSchema = z.object({
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
  reason: z.string().min(1, 'Vui lòng nhập lý do nghỉ'),
});
export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;

export const listLeaveQuerySchema = z.object({
  memberId: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type ListLeaveQuery = z.infer<typeof listLeaveQuerySchema>;

import { z } from 'zod';

export const calculateSalarySchema = z.object({
  memberId: z.string().min(1, 'Vui lòng chọn thành viên'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
  allowance: z.coerce.number().optional(),
  bonus: z.coerce.number().optional(),
  deduction: z.coerce.number().optional(),
});
export type CalculateSalaryInput = z.infer<typeof calculateSalarySchema>;

export const calculateMonthSchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
});
export type CalculateMonthInput = z.infer<typeof calculateMonthSchema>;

export const listSalaryQuerySchema = z.object({
  memberId: z.string().optional(),
  month: z.string().optional(),
  year: z.string().optional(),
  status: z.enum(['DRAFT', 'CONFIRMED']).optional(),
  autoCalculate: z.enum(['true', 'false']).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type ListSalaryQuery = z.infer<typeof listSalaryQuerySchema>;

export const createSalaryConfigSchema = z
  .object({
    eventType: z.string().optional().nullable(),
    positionId: z.string().optional().nullable(),
    memberId: z.string().optional().nullable(),
    eventId: z.string().optional().nullable(),
    amount: z.coerce.number().min(0, 'Mức tiền công không được âm'),
    note: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => data.eventType || data.positionId || data.memberId || data.eventId, {
    message: 'Cần chọn ít nhất một trong EventType/Position/Member/Event để cấu hình mức tiền công',
  });
export type CreateSalaryConfigInput = z.infer<typeof createSalaryConfigSchema>;

export const updateSalaryConfigSchema = z.object({
  amount: z.coerce.number().min(0).optional(),
  note: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});
export type UpdateSalaryConfigInput = z.infer<typeof updateSalaryConfigSchema>;

export const batchPositionConfigSchema = z.object({
  configs: z.array(
    z.object({
      positionId: z.string().min(1, 'Vui lòng chọn vị trí'),
      amount: z.coerce.number().min(0, 'Mức lương không được âm'),
      note: z.string().optional().nullable(),
    }),
  ),
});
export type BatchPositionConfigInput = z.infer<typeof batchPositionConfigSchema>;

export const batchMatrixConfigSchema = z.object({
  configs: z.array(
    z.object({
      eventType: z.string().min(1, 'Vui lòng chọn loại show'),
      positionId: z.string().min(1, 'Vui lòng chọn vị trí'),
      amount: z.coerce.number().min(0, 'Mức thù lao không được âm'),
      note: z.string().optional().nullable(),
    }),
  ),
});
export type BatchMatrixConfigInput = z.infer<typeof batchMatrixConfigSchema>;

export const eventRateConfigSchema = z.object({
  eventId: z.string().min(1, 'Vui lòng chọn sự kiện'),
  amount: z.coerce.number().min(0, 'Mức thù lao không được âm'),
  note: z.string().optional().nullable(),
});
export type EventRateConfigInput = z.infer<typeof eventRateConfigSchema>;

import { z } from 'zod';

export const createEventTypeSchema = z.object({
  code: z
    .string()
    .min(1, 'Mã loại show không được để trống')
    .regex(/^[A-Z0-9_]+$/, 'Mã loại show chỉ chứa chữ hoa, số và dấu gạch dưới (vd: KHAI_TRUONG, TRUNG_THU)'),
  name: z.string().min(1, 'Tên loại show không được để trống'),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});
export type CreateEventTypeInput = z.infer<typeof createEventTypeSchema>;

export const updateEventTypeSchema = z.object({
  code: z
    .string()
    .min(1, 'Mã loại show không được để trống')
    .regex(/^[A-Z0-9_]+$/, 'Mã loại show chỉ chứa chữ hoa, số và dấu gạch dưới')
    .optional(),
  name: z.string().min(1, 'Tên loại show không được để trống').optional(),
  description: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});
export type UpdateEventTypeInput = z.infer<typeof updateEventTypeSchema>;

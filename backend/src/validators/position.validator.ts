import { z } from 'zod';

export const createPositionSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên chức vụ'),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreatePositionInput = z.infer<typeof createPositionSchema>;

export const updatePositionSchema = createPositionSchema.partial();
export type UpdatePositionInput = z.infer<typeof updatePositionSchema>;

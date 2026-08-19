import { z } from 'zod';

export const createTeamSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên đội/nhóm'),
  description: z.string().optional().nullable(),
  leaderId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export const updateTeamSchema = createTeamSchema.partial();
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;

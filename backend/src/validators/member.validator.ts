import { z } from 'zod';
import { GENDERS, MEMBER_STATUSES } from '../types/enums';

export const createMemberSchema = z.object({
  memberCode: z.string().optional(),
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  avatar: z.string().optional().nullable(),
  dateOfBirth: z.coerce.date().optional().nullable(),
  gender: z.enum(GENDERS).optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  joinDate: z.coerce.date().optional().nullable(),
  teamIds: z.array(z.string()).optional(),
  positionIds: z.array(z.string()).optional(),
  status: z.enum(MEMBER_STATUSES).optional(),
  bankAccount: z.string().optional().nullable(),
  bankName: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export type CreateMemberInput = z.infer<typeof createMemberSchema>;

export const updateMemberSchema = createMemberSchema.partial();
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

export const listMemberQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  teamId: z.string().optional(),
  status: z.enum(MEMBER_STATUSES).optional(),
});

export type ListMemberQuery = z.infer<typeof listMemberQuerySchema>;

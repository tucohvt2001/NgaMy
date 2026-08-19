import { z } from 'zod';
import { EVENT_MEMBER_STATUSES } from '../types/enums';

export const createEventMemberSchema = z.object({
  memberId: z.string().min(1, 'Vui lòng chọn thành viên'),
  positionId: z.string().min(1, 'Vui lòng chọn vị trí'),
  status: z.enum(EVENT_MEMBER_STATUSES).optional(),
  note: z.string().optional().nullable(),
});

export type CreateEventMemberInput = z.infer<typeof createEventMemberSchema>;

export const batchAssignMemberSchema = z.object({
  assignments: z
    .array(
      z.object({
        memberId: z.string().min(1, 'Vui lòng chọn thành viên'),
        positionId: z.string().min(1, 'Vui lòng chọn vị trí'),
        status: z.enum(EVENT_MEMBER_STATUSES).optional(),
        note: z.string().optional().nullable(),
      }),
    )
    .min(1, 'Danh sách phân công không được để trống'),
});

export type BatchAssignMemberInput = z.infer<typeof batchAssignMemberSchema>;

export const updateEventMemberSchema = z.object({
  positionId: z.string().optional(),
  status: z.enum(EVENT_MEMBER_STATUSES).optional(),
  note: z.string().optional().nullable(),
});

export type UpdateEventMemberInput = z.infer<typeof updateEventMemberSchema>;


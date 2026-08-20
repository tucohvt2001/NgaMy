import { z } from 'zod';
import { ATTENDANCE_STATUSES } from '../types/enums';

export const checkInSchema = z.object({
  eventId: z.string().min(1, 'Vui lòng chọn sự kiện'),
});
export type CheckInInput = z.infer<typeof checkInSchema>;

export const checkOutSchema = z.object({
  eventId: z.string().min(1, 'Vui lòng chọn sự kiện'),
});
export type CheckOutInput = z.infer<typeof checkOutSchema>;

export const confirmAttendanceSchema = z.object({
  status: z.enum(ATTENDANCE_STATUSES),
  note: z.string().optional().nullable(),
});
export type ConfirmAttendanceInput = z.infer<typeof confirmAttendanceSchema>;

export const adminRecordAttendanceSchema = z.object({
  eventId: z.string().min(1, 'Vui lòng chọn sự kiện'),
  memberId: z.string().min(1, 'Vui lòng chọn thành viên'),
  status: z.enum(ATTENDANCE_STATUSES),
  checkInTime: z.string().datetime({ offset: true }).or(z.string().datetime()).or(z.date()).optional().nullable(),
  checkOutTime: z.string().datetime({ offset: true }).or(z.string().datetime()).or(z.date()).optional().nullable(),
  note: z.string().optional().nullable(),
});
export type AdminRecordAttendanceInput = z.infer<typeof adminRecordAttendanceSchema>;

export const adminBatchAttendanceItemSchema = z.object({
  memberId: z.string().min(1, 'Vui lòng chọn thành viên'),
  status: z.enum(ATTENDANCE_STATUSES),
  checkInTime: z.string().datetime({ offset: true }).or(z.string().datetime()).or(z.date()).optional().nullable(),
  checkOutTime: z.string().datetime({ offset: true }).or(z.string().datetime()).or(z.date()).optional().nullable(),
  note: z.string().optional().nullable(),
});

export const adminBatchAttendanceSchema = z.object({
  eventId: z.string().min(1, 'Vui lòng chọn sự kiện'),
  items: z.array(adminBatchAttendanceItemSchema).min(1, 'Danh sách điểm danh không được trống'),
});
export type AdminBatchAttendanceInput = z.infer<typeof adminBatchAttendanceSchema>;

export const listAttendanceQuerySchema = z.object({
  eventId: z.string().optional(),
  memberId: z.string().optional(),
  status: z.enum(ATTENDANCE_STATUSES).optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});
export type ListAttendanceQuery = z.infer<typeof listAttendanceQuerySchema>;

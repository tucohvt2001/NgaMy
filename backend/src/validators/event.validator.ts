import { z } from 'zod';
import { EVENT_STATUSES } from '../types/enums';

export const createEventSchema = z.object({
  eventCode: z.string().optional().nullable(),
  name: z.string().min(1, 'Vui lòng nhập tên sự kiện'),
  eventType: z.string().optional().nullable(),
  eventDate: z.coerce.date(),
  startTime: z.coerce.date().optional().nullable(),
  endTime: z.coerce.date().optional().nullable(),
  location: z.string().min(1, 'Vui lòng nhập địa điểm'),
  customerName: z.string().optional().nullable(),
  customerPhone: z.string().optional().nullable(),
  contractValue: z.preprocess(
    (v) => (v === '' || v === null || v === undefined || isNaN(Number(v)) ? undefined : Number(v)),
    z.number().optional().nullable()
  ),
  depositAmount: z.preprocess(
    (v) => (v === '' || v === null || v === undefined || isNaN(Number(v)) ? undefined : Number(v)),
    z.number().optional().nullable()
  ),
  status: z.enum(EVENT_STATUSES).optional(),
  description: z.string().optional().nullable(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial();
export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const listEventQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(EVENT_STATUSES).optional(),
  search: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});
export type ListEventQuery = z.infer<typeof listEventQuerySchema>;

export const publicBookingSchema = z.object({
  customerName: z.string().min(2, 'Vui lòng nhập tên quý khách hoặc đơn vị tổ chức'),
  customerPhone: z.string().min(9, 'Số điện thoại phải từ 9 đến 15 số').max(15, 'Số điện thoại không hợp lệ'),
  customerZalo: z.string().optional().nullable(),
  customerEmail: z.string().email('Email không hợp lệ').optional().nullable().or(z.literal('')),
  serviceType: z.string().optional().nullable(),
  serviceName: z.string().optional().nullable(),
  eventDate: z.string().min(1, 'Vui lòng chọn ngày tổ chức'),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  address: z.string().min(3, 'Vui lòng nhập địa chỉ tổ chức biểu diễn / trang trí'),
  mapUrl: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  performances: z.array(z.string()).optional().nullable(),
  estimatedBudget: z.preprocess(
    (v) => (v === '' || v === null || v === undefined || isNaN(Number(v)) ? undefined : Number(v)),
    z.number().optional().nullable()
  ),
  notes: z.string().optional().nullable(),
});

export type PublicBookingInput = z.infer<typeof publicBookingSchema>;

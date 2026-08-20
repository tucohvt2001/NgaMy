import { z } from 'zod';
import { EVENT_STATUSES } from '../types/enums';

export const createEventSchema = z.object({
  eventCode: z.string().optional().nullable(),
  name: z.string().min(1, 'Vui lòng nhập tên sự kiện'),
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
});
export type ListEventQuery = z.infer<typeof listEventQuerySchema>;

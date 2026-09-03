import { z } from 'zod';

export const createReviewSchema = z.object({
  customerName: z.string().min(1, 'Vui lòng nhập họ và tên của bạn'),
  customerPhone: z.string().optional().nullable(),
  rating: z.coerce.number().min(1, 'Vui lòng đánh giá số sao (1-5)').max(5, 'Tối đa 5 sao'),
  performanceQuality: z.coerce.number().min(1).max(5).optional().nullable(),
  punctuality: z.coerce.number().min(1).max(5).optional().nullable(),
  attitude: z.coerce.number().min(1).max(5).optional().nullable(),
  comment: z.string().optional().nullable(),
  isPublic: z.boolean().optional().default(true),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const listReviewsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  eventId: z.string().optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  search: z.string().optional(),
});

export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;

import { z } from 'zod';
import {
  TRANSACTION_TYPES,
  TRANSACTION_CATEGORIES,
  PAYMENT_METHODS,
  TRANSACTION_STATUSES,
} from '../types/enums';

export const createTransactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES, {
    required_error: 'Loại giao dịch là bắt buộc (INCOME hoặc EXPENSE)',
  }),
  category: z.enum(TRANSACTION_CATEGORIES, {
    required_error: 'Danh mục giao dịch là bắt buộc',
  }),
  amount: z
    .number({ required_error: 'Số tiền là bắt buộc' })
    .positive('Số tiền phải lớn hơn 0'),
  tipAmount: z
    .number()
    .nonnegative('Tiền lộc không được âm')
    .optional()
    .default(0),
  transactionDate: z
    .string({ required_error: 'Ngày giao dịch là bắt buộc' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Ngày giao dịch không hợp lệ',
    }),
  paymentMethod: z.enum(PAYMENT_METHODS).default('CASH'),
  status: z.enum(TRANSACTION_STATUSES).default('COMPLETED'),
  payerOrReceiver: z
    .string({ required_error: 'Vui lòng nhập người nộp/người nhận tiền' })
    .min(1, 'Vui lòng nhập người nộp/người nhận tiền'),
  description: z.string().optional(),
  eventId: z.string().optional().nullable(),
  memberId: z.string().optional().nullable(),
  receiptImage: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const queryTransactionSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  type: z.enum(TRANSACTION_TYPES).optional(),
  category: z.enum(TRANSACTION_CATEGORIES).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  status: z.enum(TRANSACTION_STATUSES).optional(),
  eventId: z.string().optional(),
  memberId: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  search: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type QueryTransactionInput = z.infer<typeof queryTransactionSchema>;

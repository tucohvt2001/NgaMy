import { z } from 'zod';
import { PAYMENT_METHODS } from '../types/enums';

export const memberPayoutSchema = z.object({
  memberId: z.string().min(1, 'Thành viên không hợp lệ'),
  amount: z.number().nonnegative('Số tiền công không được âm'),
  positionName: z.string().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).default('CASH'),
  note: z.string().optional(),
});

export const eventExpenseSchema = z.object({
  category: z.string().min(1, 'Danh mục chi phí là bắt buộc'),
  amount: z.number().positive('Số tiền chi phải lớn hơn 0'),
  description: z.string().optional(),
  receiver: z.string().optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).default('CASH'),
});

export const eventSettlementSchema = z.object({
  contractAmount: z.number().nonnegative('Tiền show không được âm'),
  tipAmount: z.number().nonnegative('Tiền lộc không được âm').default(0),
  payer: z.string().min(1, 'Vui lòng nhập người nộp / khách hàng thanh toán'),
  paymentMethod: z.enum(PAYMENT_METHODS).default('CASH'),
  settlementDate: z.string().optional(),
  memberPayouts: z.array(memberPayoutSchema).default([]),
  expenses: z.array(eventExpenseSchema).default([]),
  createIncomeVoucher: z.boolean().default(true),
  createExpenseVouchers: z.boolean().default(true),
  markEventCompleted: z.boolean().default(true),
  isDraft: z.boolean().optional().default(false),
  notes: z.string().optional(),
});

export type MemberPayoutInput = z.infer<typeof memberPayoutSchema>;
export type EventExpenseInput = z.infer<typeof eventExpenseSchema>;
export type EventSettlementInput = z.infer<typeof eventSettlementSchema>;

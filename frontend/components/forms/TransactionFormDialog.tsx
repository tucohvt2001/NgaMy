'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TRANSACTION_TYPES,
  TRANSACTION_CATEGORIES,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  TRANSACTION_CATEGORY_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  TRANSACTION_STATUSES,
  STATUS_LABELS,
} from '@/types/enums';
import { Transaction, TransactionInput } from '@/types/models';
import { useEvents } from '@/hooks/useEvents';
import { useMembers } from '@/hooks/useMembers';
import { ArrowDownLeft, ArrowUpRight, Sparkles, Gift } from 'lucide-react';

const transactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  category: z.enum(TRANSACTION_CATEGORIES),
  amount: z.coerce.number().positive('Số tiền phải lớn hơn 0'),
  tipAmount: z.coerce.number().min(0, 'Tiền lộc không được âm'),
  transactionDate: z.string().min(1, 'Vui lòng chọn ngày'),
  paymentMethod: z.enum(PAYMENT_METHODS),
  status: z.enum(TRANSACTION_STATUSES),
  payerOrReceiver: z.string().min(1, 'Vui lòng nhập người nộp/nhận tiền'),
  description: z.string().optional(),
  eventId: z.string().optional(),
  memberId: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof transactionSchema>;

interface TransactionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: Transaction | null;
  defaultType?: 'INCOME' | 'EXPENSE';
  onSubmit: (values: TransactionInput) => void;
  isLoading?: boolean;
}

const NONE_VALUE = '__none__';

export function TransactionFormDialog({
  open,
  onOpenChange,
  transaction,
  defaultType = 'INCOME',
  onSubmit,
  isLoading,
}: TransactionFormDialogProps) {
  const { data: eventsData } = useEvents({ page: 1, limit: 100 });
  const { data: membersData } = useMembers({ page: 1, limit: 200, status: 'ACTIVE' });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType,
      category: defaultType === 'INCOME' ? 'EVENT_REVENUE' : 'EQUIPMENT_PURCHASE',
      amount: 0,
      tipAmount: 0,
      transactionDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      payerOrReceiver: '',
      description: '',
      eventId: NONE_VALUE,
      memberId: NONE_VALUE,
      notes: '',
    },
  });

  const selectedType = watch('type');
  const selectedCategory = watch('category');
  const watchedAmount = Number(watch('amount')) || 0;
  const watchedTipAmount = Number(watch('tipAmount')) || 0;

  const isEventRevenue = selectedType === 'INCOME' && selectedCategory === 'EVENT_REVENUE';

  // Tính tổng thực thu (Số tiền gốc/tiền show + Tiền lộc)
  const totalRevenue = isEventRevenue ? watchedAmount + watchedTipAmount : watchedAmount;

  // Xử lý khi thay đổi danh mục
  const handleCategoryChange = (val: string) => {
    setValue('category', val as any);
    if (selectedType === 'INCOME' && val !== 'EVENT_REVENUE') {
      setValue('eventId', NONE_VALUE);
      setValue('tipAmount', 0);
    }
  };

  useEffect(() => {
    if (transaction) {
      // Khi edit transaction đã có sẵn
      const baseAmount = transaction.type === 'INCOME' && transaction.tipAmount
        ? Math.max(0, transaction.amount - transaction.tipAmount)
        : transaction.amount;

      reset({
        type: transaction.type,
        category: transaction.category as any,
        amount: baseAmount,
        tipAmount: transaction.tipAmount || 0,
        transactionDate: transaction.transactionDate
          ? new Date(transaction.transactionDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        paymentMethod: transaction.paymentMethod,
        status: transaction.status,
        payerOrReceiver: transaction.payerOrReceiver,
        description: transaction.description || '',
        eventId: transaction.eventId || NONE_VALUE,
        memberId: transaction.memberId || NONE_VALUE,
        notes: transaction.notes || '',
      });
    } else {
      reset({
        type: defaultType,
        category: defaultType === 'INCOME' ? 'EVENT_REVENUE' : 'EQUIPMENT_PURCHASE',
        amount: 0,
        tipAmount: 0,
        transactionDate: new Date().toISOString().slice(0, 10),
        paymentMethod: 'CASH',
        status: 'COMPLETED',
        payerOrReceiver: '',
        description: '',
        eventId: NONE_VALUE,
        memberId: NONE_VALUE,
        notes: '',
      });
    }
  }, [transaction, defaultType, open, reset]);

  // Xử lý auto-binding khi chọn sự kiện (show diễn)
  const handleEventSelect = (selectedEventId: string) => {
    setValue('eventId', selectedEventId);
    if (selectedEventId && selectedEventId !== NONE_VALUE) {
      const selectedEvent = eventsData?.items.find((item) => item.id === selectedEventId);
      if (selectedEvent) {
        if (selectedType === 'INCOME') {
          // Tự động binding số tiền show vào 'số tiền' cho phiếu thu
          if (selectedEvent.contractValue && selectedEvent.contractValue > 0) {
            setValue('amount', selectedEvent.contractValue, { shouldValidate: true });
          }
          // Tự động điền người nộp nếu chưa nhập
          const currentPayer = watch('payerOrReceiver') || '';
          if (selectedEvent.customerName && !currentPayer.trim()) {
            setValue('payerOrReceiver', selectedEvent.customerName, { shouldValidate: true });
          }
          // Tự động điền diễn giải nếu chưa nhập
          const currentDesc = watch('description') || '';
          if (!currentDesc.trim()) {
            setValue('description', `Thu tiền biểu diễn sự kiện: ${selectedEvent.name}`);
          }
        } else {
          // Khi là Phiếu Chi (EXPENSE)
          const currentDesc = watch('description') || '';
          if (!currentDesc.trim()) {
            setValue('description', `Chi phí sự kiện: ${selectedEvent.name}`);
          }
        }
      }
    }
  };

  const handleFormSubmit = (data: FormValues) => {
    const finalAmount = isEventRevenue ? Number(data.amount) + (Number(data.tipAmount) || 0) : Number(data.amount);

    onSubmit({
      ...data,
      amount: finalAmount,
      tipAmount: isEventRevenue ? Number(data.tipAmount) || 0 : 0,
      eventId: data.eventId === NONE_VALUE ? null : data.eventId,
      memberId: data.memberId === NONE_VALUE ? null : data.memberId,
      transactionDate: new Date(data.transactionDate).toISOString(),
    });
  };

  const currentCategories = selectedType === 'INCOME' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            {transaction ? (
              `Chỉnh sửa phiếu ${transaction.code}`
            ) : selectedType === 'INCOME' ? (
              <span className="flex items-center gap-2 text-emerald-600">
                <ArrowDownLeft className="size-5" /> Lập Phiếu Thu Tiền
              </span>
            ) : (
              <span className="flex items-center gap-2 text-rose-600">
                <ArrowUpRight className="size-5" /> Lập Phiếu Chi Tiền
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 pt-2">
          {/* Lựa chọn loại giao dịch (Thu / Chi) nếu tạo mới */}
          {!transaction && (
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setValue('type', 'INCOME');
                  setValue('category', 'EVENT_REVENUE');
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  selectedType === 'INCOME'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowDownLeft className="size-4" />
                Phiếu Thu (Tiền vào)
              </button>
              <button
                type="button"
                onClick={() => {
                  setValue('type', 'EXPENSE');
                  setValue('category', 'EQUIPMENT_PURCHASE');
                  setValue('tipAmount', 0);
                }}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  selectedType === 'EXPENSE'
                    ? 'bg-rose-600 text-white shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowUpRight className="size-4" />
                Phiếu Chi (Tiền ra)
              </button>
            </div>
          )}

          {/* Danh mục thu chi & Liên kết sự kiện */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Danh mục */}
            <div className="space-y-2">
              <Label htmlFor="category">Danh mục {selectedType === 'INCOME' ? 'thu' : 'chi'} *</Label>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={handleCategoryChange}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Chọn danh mục..." />
                    </SelectTrigger>
                    <SelectContent>
                      {currentCategories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {TRANSACTION_CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
            </div>

            {/* Liên kết sự kiện / Show diễn */}
            <div className="space-y-2">
              <Label htmlFor="eventId" className="flex items-center justify-between">
                <span className={selectedType === 'INCOME' && !isEventRevenue ? 'text-muted-foreground' : ''}>
                  Show diễn / Sự kiện
                </span>
                {isEventRevenue ? (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Sparkles className="size-3" /> Tự động lấy tiền show
                  </span>
                ) : selectedType === 'INCOME' ? (
                  <span className="text-[11px] text-muted-foreground italic">
                    Chỉ dành cho Thu biểu diễn
                  </span>
                ) : null}
              </Label>
              <Controller
                control={control}
                name="eventId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={handleEventSelect}
                    disabled={selectedType === 'INCOME' && !isEventRevenue}
                  >
                    <SelectTrigger
                      id="eventId"
                      className={
                        isEventRevenue
                          ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                          : selectedType === 'INCOME'
                          ? 'opacity-60 bg-muted/50 cursor-not-allowed'
                          : ''
                      }
                    >
                      <SelectValue
                        placeholder={
                          selectedType === 'INCOME' && !isEventRevenue
                            ? 'Chỉ khả dụng khi thu biểu diễn'
                            : 'Chọn sự kiện liên quan...'
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>-- Không liên kết sự kiện --</SelectItem>
                      {eventsData?.items.map((ev) => (
                        <SelectItem key={ev.id} value={ev.id}>
                          {ev.eventCode} - {ev.name} {ev.contractValue ? `(${ev.contractValue.toLocaleString('vi-VN')} đ)` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Phần Nhập Số Tiền & Tiền Lộc (Tips) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Số tiền show / Số tiền gốc */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                {isEventRevenue
                  ? 'Tiền biểu diễn show (Hợp đồng) *'
                  : selectedType === 'INCOME'
                  ? 'Số tiền thu *'
                  : 'Số tiền chi *'}
              </Label>
              <Input
                id="amount"
                type="number"
                min="1000"
                step="1000"
                placeholder="Nhập số tiền..."
                {...register('amount')}
              />
              {watchedAmount > 0 && (
                <p className="text-xs font-semibold text-muted-foreground">
                  ≈ {watchedAmount.toLocaleString('vi-VN')} đ
                </p>
              )}
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>

            {/* Tiền Lộc (Tips) - Chỉ enable khi là Thu biểu diễn show */}
            {selectedType === 'INCOME' ? (
              <div className="space-y-2">
                <Label
                  htmlFor="tipAmount"
                  className={`flex items-center gap-1.5 font-semibold ${
                    isEventRevenue ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground opacity-60'
                  }`}
                >
                  <Gift className="size-4" />
                  Tiền Lộc (Tips / Thưởng lộc)
                </Label>
                <Input
                  id="tipAmount"
                  type="number"
                  min="0"
                  step="1000"
                  disabled={!isEventRevenue}
                  placeholder={isEventRevenue ? 'Nhập tiền lộc biểu diễn (nếu có)...' : 'Chỉ áp dụng khi thu biểu diễn'}
                  className={
                    isEventRevenue
                      ? 'border-amber-500/40 focus:ring-amber-500/20'
                      : 'opacity-60 bg-muted/50 cursor-not-allowed'
                  }
                  {...register('tipAmount')}
                />
                {isEventRevenue && watchedTipAmount > 0 ? (
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    + {watchedTipAmount.toLocaleString('vi-VN')} đ (Lộc gia chủ/khán giả)
                  </p>
                ) : isEventRevenue ? (
                  <p className="text-[11px] text-muted-foreground">
                    Tiền lì xì, hái lộc hoặc khách thưởng thêm
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground italic">
                    Chỉ bật khi chọn danh mục Thu biểu diễn show
                  </p>
                )}
                {errors.tipAmount && <p className="text-xs text-destructive">{errors.tipAmount.message}</p>}
              </div>
            ) : (
              /* Phương thức thanh toán khi là Phiếu Chi */
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Phương thức thanh toán *</Label>
                <Controller
                  control={control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="paymentMethod">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((pm) => (
                          <SelectItem key={pm} value={pm}>
                            {PAYMENT_METHOD_LABELS[pm]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          {/* Box Tổng Thực Thu khi là Thu biểu diễn có tiền lộc */}
          {isEventRevenue && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide">
                  Tổng Tiền Thực Thu:
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Tiền show ({watchedAmount.toLocaleString('vi-VN')} đ) + Tiền lộc ({watchedTipAmount.toLocaleString('vi-VN')} đ)
                </p>
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {totalRevenue.toLocaleString('vi-VN')} đ
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Ngày giao dịch */}
            <div className="space-y-2">
              <Label htmlFor="transactionDate">Ngày giao dịch / Ngày lập phiếu *</Label>
              <Input id="transactionDate" type="date" {...register('transactionDate')} />
              {errors.transactionDate && (
                <p className="text-xs text-destructive">{errors.transactionDate.message}</p>
              )}
            </div>

            {/* Phương thức thanh toán khi là Phiếu Thu */}
            {selectedType === 'INCOME' ? (
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Phương thức thanh toán *</Label>
                <Controller
                  control={control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="paymentMethod">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((pm) => (
                          <SelectItem key={pm} value={pm}>
                            {PAYMENT_METHOD_LABELS[pm]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : (
              /* Thành viên liên quan khi là Phiếu Chi */
              <div className="space-y-2">
                <Label htmlFor="memberId">Thành viên liên quan (tùy chọn)</Label>
                <Controller
                  control={control}
                  name="memberId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="memberId">
                        <SelectValue placeholder="Chọn thành viên..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>-- Không liên kết thành viên --</SelectItem>
                        {membersData?.items.map((mem) => (
                          <SelectItem key={mem.id} value={mem.id}>
                            {mem.memberCode} - {mem.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Người nộp hoặc người nhận */}
            <div className="space-y-2">
              <Label htmlFor="payerOrReceiver">
                {selectedType === 'INCOME' ? 'Người nộp tiền / Đối tác nộp *' : 'Người nhận tiền / Nơi chi trả *'}
              </Label>
              <Input
                id="payerOrReceiver"
                placeholder={
                  selectedType === 'INCOME'
                    ? 'vd: Công ty ABC, Anh Nam, Khách hàng...'
                    : 'vd: Cơ sở may Hưng, Nhà xe Minh Quân, Thành viên...'
                }
                {...register('payerOrReceiver')}
              />
              {errors.payerOrReceiver && (
                <p className="text-xs text-destructive">{errors.payerOrReceiver.message}</p>
              )}
            </div>

            {/* Trạng thái phiếu */}
            <div className="space-y-2">
              <Label htmlFor="status">Trạng thái phiếu</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSACTION_STATUSES.map((st) => (
                        <SelectItem key={st} value={st}>
                          {STATUS_LABELS[st] || st}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          {/* Thành viên liên quan khi là Phiếu Thu */}
          {selectedType === 'INCOME' && (
            <div className="space-y-2">
              <Label htmlFor="memberId">Thành viên nộp / phụ trách (tùy chọn)</Label>
              <Controller
                control={control}
                name="memberId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="memberId">
                      <SelectValue placeholder="Chọn thành viên..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>-- Không liên kết thành viên --</SelectItem>
                      {membersData?.items.map((mem) => (
                        <SelectItem key={mem.id} value={mem.id}>
                          {mem.memberCode} - {mem.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}

          {/* Diễn giải / Lý do thu chi */}
          <div className="space-y-2">
            <Label htmlFor="description">Nội dung chi tiết / Diễn giải lý do</Label>
            <Textarea
              id="description"
              rows={2}
              placeholder="Ghi rõ nội dung thanh toán hoặc lý do thu/chi..."
              {...register('description')}
            />
          </div>

          {/* Ghi chú thêm */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú bổ sung (tùy chọn)</Label>
            <Input id="notes" placeholder="Số hóa đơn, số chứng từ kèm theo..." {...register('notes')} />
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className={selectedType === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}
            >
              {transaction ? 'Cập nhật phiếu' : selectedType === 'INCOME' ? 'Lưu Phiếu Thu' : 'Lưu Phiếu Chi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

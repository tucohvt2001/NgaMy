'use client';

import { useEffect, useMemo } from 'react';
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
import { MoneyInput } from '@/components/ui/money-input';
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
import {
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Gift,
  Calendar,
  CreditCard,
  Building2,
  FileText,
  User,
  CheckCircle2,
  MapPin,
  Phone,
} from 'lucide-react';

const transactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  category: z.enum(TRANSACTION_CATEGORIES),
  amount: z.coerce.number().positive('Số tiền phải lớn hơn 0'),
  tipAmount: z.coerce.number().min(0, 'Tiền lộc không được âm'),
  transactionDate: z.string().min(1, 'Vui lòng chọn ngày'),
  paymentMethod: z.enum(PAYMENT_METHODS),
  status: z.enum(TRANSACTION_STATUSES),
  payerOrReceiver: z.string().min(1, 'Vui lòng nhập người nộp / nhận tiền'),
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
  const watchedEventId = watch('eventId');
  const watchedMemberId = watch('memberId');

  const isIncome = selectedType === 'INCOME';
  const isEventRevenue = isIncome && selectedCategory === 'EVENT_REVENUE';
  const isMembershipFee = isIncome && selectedCategory === 'MEMBERSHIP_FEE';
  const isSalaryOrBonus = !isIncome && (selectedCategory === 'SALARY_PAYOUT' || selectedCategory === 'BONUS_REWARD');

  // Tìm event đang được chọn
  const activeEvent = useMemo(() => {
    if (!watchedEventId || watchedEventId === NONE_VALUE) return null;
    return eventsData?.items.find((item) => item.id === watchedEventId) || null;
  }, [eventsData?.items, watchedEventId]);

  // Tìm thành viên đang được chọn
  const activeMember = useMemo(() => {
    if (!watchedMemberId || watchedMemberId === NONE_VALUE) return null;
    return membersData?.items.find((item) => item.id === watchedMemberId) || null;
  }, [membersData?.items, watchedMemberId]);

  // Tính tổng thực thu (Số tiền gốc/tiền show + Tiền lộc)
  const totalRevenue = isEventRevenue ? watchedAmount + watchedTipAmount : watchedAmount;

  // Xử lý khi thay đổi danh mục
  const handleCategoryChange = (val: string) => {
    setValue('category', val as any);
    if (selectedType === 'INCOME') {
      if (val === 'EVENT_REVENUE') {
        if (activeEvent) {
          setValue('amount', activeEvent.contractValue || 0, { shouldValidate: true });
          if (activeEvent.customerName) {
            setValue('payerOrReceiver', activeEvent.customerName, { shouldValidate: true });
          }
          if (activeEvent.eventDate) {
            const evDate = new Date(activeEvent.eventDate).toISOString().slice(0, 10);
            setValue('transactionDate', evDate, { shouldValidate: true });
          }
          setValue('description', `Thu tiền hợp đồng biểu diễn: ${activeEvent.name} (${activeEvent.eventCode})`);
        } else {
          setValue('description', 'Thu tiền biểu diễn sự kiện');
        }
      } else {
        setValue('tipAmount', 0);
        if (val === 'MEMBERSHIP_FEE' && activeMember) {
          setValue('payerOrReceiver', `${activeMember.fullName} (${activeMember.memberCode})`, { shouldValidate: true });
          setValue('description', `Đóng quỹ đoàn viên - ${activeMember.fullName}`);
        } else {
          setValue('description', TRANSACTION_CATEGORY_LABELS[val as keyof typeof TRANSACTION_CATEGORY_LABELS] || '');
        }
      }
    } else {
      if ((val === 'SALARY_PAYOUT' || val === 'BONUS_REWARD') && activeMember) {
        setValue('payerOrReceiver', `${activeMember.fullName} (${activeMember.memberCode})`, { shouldValidate: true });
        setValue('description', `${TRANSACTION_CATEGORY_LABELS[val as keyof typeof TRANSACTION_CATEGORY_LABELS]} cho ${activeMember.fullName}`);
      } else if (activeEvent) {
        setValue('description', `Chi phí phục vụ sự kiện: ${activeEvent.name} (${activeEvent.eventCode})`);
      } else {
        setValue('description', TRANSACTION_CATEGORY_LABELS[val as keyof typeof TRANSACTION_CATEGORY_LABELS] || '');
      }
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
        description: defaultType === 'INCOME' ? 'Thu tiền biểu diễn sự kiện' : '',
        eventId: NONE_VALUE,
        memberId: NONE_VALUE,
        notes: '',
      });
    }
  }, [transaction, defaultType, open, reset]);

  // Xử lý auto-binding khi chọn / thay đổi sự kiện (show diễn)
  const handleEventSelect = (selectedEventId: string) => {
    setValue('eventId', selectedEventId);
    if (selectedEventId && selectedEventId !== NONE_VALUE) {
      const selectedEvent = eventsData?.items.find((item) => item.id === selectedEventId);
      if (selectedEvent) {
        if (isIncome) {
          setValue('amount', selectedEvent.contractValue || 0, { shouldValidate: true });
          setValue('tipAmount', 0);
          if (selectedEvent.customerName) {
            setValue('payerOrReceiver', selectedEvent.customerName, { shouldValidate: true });
          }
          if (selectedEvent.eventDate) {
            const evDate = new Date(selectedEvent.eventDate).toISOString().slice(0, 10);
            setValue('transactionDate', evDate, { shouldValidate: true });
          }
          setValue('description', `Thu tiền hợp đồng biểu diễn: ${selectedEvent.name} (${selectedEvent.eventCode})`);
        } else {
          if (selectedEvent.eventDate) {
            const evDate = new Date(selectedEvent.eventDate).toISOString().slice(0, 10);
            setValue('transactionDate', evDate, { shouldValidate: true });
          }
          setValue('description', `Chi phí phục vụ sự kiện: ${selectedEvent.name} (${selectedEvent.eventCode})`);
        }
      }
    } else {
      if (isIncome && isEventRevenue) {
        setValue('amount', 0);
        setValue('tipAmount', 0);
        setValue('payerOrReceiver', '');
        setValue('transactionDate', new Date().toISOString().slice(0, 10));
        setValue('description', 'Thu tiền biểu diễn sự kiện');
      } else if (!isIncome) {
        setValue('description', TRANSACTION_CATEGORY_LABELS[selectedCategory] || '');
      }
    }
  };

  // Xử lý auto-binding khi chọn / thay đổi thành viên
  const handleMemberSelect = (selectedMemberId: string) => {
    setValue('memberId', selectedMemberId);
    if (selectedMemberId && selectedMemberId !== NONE_VALUE) {
      const selectedMember = membersData?.items.find((item) => item.id === selectedMemberId);
      if (selectedMember) {
        setValue('payerOrReceiver', `${selectedMember.fullName} (${selectedMember.memberCode})`, { shouldValidate: true });
        if (isIncome) {
          if (selectedCategory === 'MEMBERSHIP_FEE') {
            setValue('description', `Đóng quỹ đoàn viên - ${selectedMember.fullName}`);
          }
        } else {
          if (selectedCategory === 'SALARY_PAYOUT') {
            setValue('description', `Chi trả tiền công biểu diễn cho ${selectedMember.fullName}`);
          } else if (selectedCategory === 'BONUS_REWARD') {
            setValue('description', `Chi khen thưởng / thưởng nóng cho ${selectedMember.fullName}`);
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

  const currentCategories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* Header phiếu thu / chi */}
        <div className={`p-6 border-b ${isIncome ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30'}`}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2.5 text-xl font-bold">
                {transaction ? (
                  <span className="flex items-center gap-2">
                    {isIncome ? <ArrowDownLeft className="size-5 text-emerald-600" /> : <ArrowUpRight className="size-5 text-rose-600" />}
                    Chỉnh sửa phiếu {transaction.code}
                  </span>
                ) : isIncome ? (
                  <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                      <ArrowDownLeft className="size-5" />
                    </span>
                    Lập Phiếu Thu
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400">
                      <ArrowUpRight className="size-5" />
                    </span>
                    Lập Phiếu Chi
                  </span>
                )}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${isIncome ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800'}`}>
                  {isIncome ? 'Tiền vào quỹ' : 'Tiền ra khỏi quỹ'}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isIncome 
                ? 'Ghi nhận các khoản thu biểu diễn, tài trợ hoặc đóng quỹ vào quỹ đoàn.'
                : 'Ghi nhận các khoản chi mua sắm đạo cụ, trả tiền công hoặc chi phí xuất quỹ.'}
            </p>
          </DialogHeader>

          {/* Tab chuyển đổi Thu / Chi (Khi tạo mới) */}
          {!transaction && (
            <div className="grid grid-cols-2 gap-2 mt-4 p-1 bg-background/80 dark:bg-card/80 backdrop-blur rounded-xl border">
              <button
                type="button"
                onClick={() => {
                  setValue('type', 'INCOME');
                  setValue('category', 'EVENT_REVENUE');
                  setValue('description', 'Thu tiền biểu diễn sự kiện');
                }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isIncome
                    ? 'bg-emerald-600 text-white shadow-sm'
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
                  setValue('description', '');
                }}
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                  !isIncome
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ArrowUpRight className="size-4" />
                Phiếu Chi (Tiền ra)
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-5">
          {/* KHỐI 1: PHÂN LOẠI & HOẠT ĐỘNG */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b">
              <Building2 className="size-4 text-muted-foreground" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                1. Phân loại & Hoạt động
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Danh mục thu/chi */}
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-xs font-bold">
                  {isIncome ? 'Danh mục thu *' : 'Danh mục chi *'}
                </Label>
                <Controller
                  control={control}
                  name="category"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={handleCategoryChange}>
                      <SelectTrigger id="category" className="h-10">
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

              {/* Sự kiện liên quan */}
              <div className="space-y-1.5">
                <Label htmlFor="eventId" className="text-xs font-bold flex items-center justify-between">
                  <span>Show diễn liên quan</span>
                  {isEventRevenue && (
                    <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Sparkles className="size-3" /> Tự điền tiền & khách
                    </span>
                  )}
                </Label>
                <Controller
                  control={control}
                  name="eventId"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={handleEventSelect}
                    >
                      <SelectTrigger
                        id="eventId"
                        className={`h-10 ${
                          isEventRevenue
                            ? 'border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10 ring-1 ring-emerald-500/20 font-medium'
                            : ''
                        }`}
                      >
                        <SelectValue placeholder="-- Chọn show diễn (nếu có) --" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE_VALUE}>-- Không liên kết show diễn --</SelectItem>
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

            {/* Chi tiết tóm tắt của Show diễn đang được liên kết */}
            {activeEvent && (
              <div className="p-3.5 rounded-xl bg-muted/70 border border-border/80 text-xs space-y-2 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between font-semibold">
                  <span className="text-foreground flex items-center gap-1.5 font-bold">
                    <Calendar className="size-4 text-primary" />
                    {activeEvent.name} <span className="font-mono text-muted-foreground font-normal">({activeEvent.eventCode})</span>
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-background border font-mono font-semibold">
                    {new Date(activeEvent.eventDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-muted-foreground pt-1.5 border-t border-border/40">
                  <div className="flex items-center gap-1 truncate">
                    <User className="size-3 text-muted-foreground shrink-0" />
                    <span className="font-medium text-foreground">Khách hàng:</span> {activeEvent.customerName || 'Chưa ghi nhận'}
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    {activeEvent.customerPhone ? (
                      <>
                        <Phone className="size-3 text-muted-foreground shrink-0" />
                        <span>{activeEvent.customerPhone}</span>
                      </>
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="font-medium text-foreground">Tiền HĐ:</span>{' '}
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {activeEvent.contractValue ? `${activeEvent.contractValue.toLocaleString('vi-VN')} đ` : '0 đ'}
                    </span>
                  </div>
                  {activeEvent.location && (
                    <div className="sm:col-span-3 flex items-center gap-1 truncate">
                      <MapPin className="size-3 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground">Địa điểm:</span> {activeEvent.location}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Thành viên liên quan */}
            <div className="space-y-1.5">
              <Label htmlFor="memberId" className="text-xs font-bold flex items-center justify-between">
                <span>
                  {isIncome
                    ? (isMembershipFee ? 'Thành viên nộp quỹ *' : 'Thành viên nộp')
                    : (isSalaryOrBonus ? 'Thành viên nhận tiền *' : 'Thành viên liên quan')}
                </span>
                {(isMembershipFee || isSalaryOrBonus) && (
                  <span className="text-[11px] text-primary font-semibold flex items-center gap-1">
                    <User className="size-3" /> Tự động điền họ tên
                  </span>
                )}
              </Label>
              <Controller
                control={control}
                name="memberId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={handleMemberSelect}>
                    <SelectTrigger id="memberId" className="h-10">
                      <SelectValue placeholder="-- Chọn thành viên (nếu có) --" />
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
          </div>

          {/* KHỐI 2: ĐỐI TƯỢNG & NỘI DUNG */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2 pb-1 border-b">
              <FileText className="size-4 text-muted-foreground" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Đối tượng & Nội dung
              </h3>
            </div>

            {/* Người nộp hoặc người nhận */}
            <div className="space-y-1.5">
              <Label htmlFor="payerOrReceiver" className="text-xs font-bold">
                {isIncome ? 'Người nộp tiền *' : 'Người nhận tiền *'}
              </Label>
              <Input
                id="payerOrReceiver"
                className="h-10"
                placeholder={
                  isIncome
                    ? 'Tên người nộp hoặc đơn vị thanh toán...'
                    : 'Tên người nhận hoặc đơn vị cung cấp...'
                }
                {...register('payerOrReceiver')}
              />
              {errors.payerOrReceiver && (
                <p className="text-xs text-destructive">{errors.payerOrReceiver.message}</p>
              )}
            </div>

            {/* Nội dung chi tiết / Lý do */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold">
                {isIncome ? 'Lý do thu' : 'Lý do chi'}
              </Label>
              <Textarea
                id="description"
                rows={2}
                placeholder={
                  isIncome
                    ? 'Nội dung hoặc lý do thu tiền...'
                    : 'Nội dung hoặc mục đích chi tiền...'
                }
                {...register('description')}
              />
            </div>
          </div>

          {/* KHỐI 3: SỐ TIỀN & THANH TOÁN */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center gap-2 pb-1 border-b">
              <CreditCard className="size-4 text-muted-foreground" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                3. Số tiền & Thanh toán
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Số tiền chính */}
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs font-bold">
                  {isEventRevenue
                    ? 'Tiền hợp đồng show *'
                    : isIncome
                    ? 'Số tiền thu *'
                    : 'Số tiền chi *'}
                </Label>
                <Controller
                  control={control}
                  name="amount"
                  render={({ field }) => (
                    <MoneyInput
                      id="amount"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Nhập số tiền..."
                    />
                  )}
                />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>

              {/* Tiền Lộc (Tips) - Chỉ hiển thị khi là Thu show biểu diễn */}
              {isIncome ? (
                <div className="space-y-1.5">
                  <Label
                    htmlFor="tipAmount"
                    className={`text-xs font-bold flex items-center gap-1.5 ${
                      isEventRevenue ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground opacity-60'
                    }`}
                  >
                    <Gift className="size-3.5" />
                    Tiền lộc (Tips)
                  </Label>
                  <Controller
                    control={control}
                    name="tipAmount"
                    render={({ field }) => (
                      <MoneyInput
                        id="tipAmount"
                        value={field.value}
                        onChange={field.onChange}
                        disabled={!isEventRevenue}
                        placeholder={isEventRevenue ? 'Tiền thưởng lộc nếu có...' : 'Chỉ khi thu show'}
                        className={
                          isEventRevenue
                            ? 'border-amber-500/40 focus:ring-amber-500/20'
                            : 'opacity-50 bg-muted/50 cursor-not-allowed'
                        }
                      />
                    )}
                  />
                  {isEventRevenue && watchedTipAmount > 0 ? (
                    <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      + {watchedTipAmount.toLocaleString('vi-VN')} đ (Lộc thưởng từ show)
                    </p>
                  ) : null}
                  {errors.tipAmount && <p className="text-xs text-destructive">{errors.tipAmount.message}</p>}
                </div>
              ) : (
                /* Phương thức thanh toán khi là Phiếu Chi */
                <div className="space-y-1.5">
                  <Label htmlFor="paymentMethod" className="text-xs font-bold">Hình thức chi *</Label>
                  <Controller
                    control={control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="paymentMethod" className="h-10">
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
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                    Tổng thực thu:
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Hợp đồng ({watchedAmount.toLocaleString('vi-VN')} đ) + Tiền lộc ({watchedTipAmount.toLocaleString('vi-VN')} đ)
                  </p>
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {totalRevenue.toLocaleString('vi-VN')} đ
                </div>
              </div>
            )}

            {/* Ngày lập phiếu & Phương thức (Khi là Thu) / Trạng thái */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Ngày giao dịch */}
              <div className="space-y-1.5">
                <Label htmlFor="transactionDate" className="text-xs font-bold flex items-center gap-1.5">
                  <Calendar className="size-3.5 text-muted-foreground" />
                  Ngày lập phiếu *
                </Label>
                <Input id="transactionDate" type="date" className="h-10" {...register('transactionDate')} />
                {errors.transactionDate && (
                  <p className="text-xs text-destructive">{errors.transactionDate.message}</p>
                )}
              </div>

              {/* Phương thức thanh toán khi là Phiếu Thu */}
              {isIncome ? (
                <div className="space-y-1.5">
                  <Label htmlFor="paymentMethod" className="text-xs font-bold">Hình thức thu *</Label>
                  <Controller
                    control={control}
                    name="paymentMethod"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="paymentMethod" className="h-10">
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
              ) : null}

              {/* Trạng thái phiếu */}
              <div className="space-y-1.5">
                <Label htmlFor="status" className="text-xs font-bold">Trạng thái</Label>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="status" className="h-10">
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

              {/* Chứng từ kèm theo */}
              <div className={`space-y-1.5 ${!isIncome ? 'md:col-span-1' : ''}`}>
                <Label htmlFor="notes" className="text-xs font-bold">Chứng từ kèm theo</Label>
                <Input
                  id="notes"
                  className="h-10"
                  placeholder="Hóa đơn, biên nhận, mã GD..."
                  {...register('notes')}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              isLoading={isLoading}
              className={
                isIncome
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 shadow-sm'
                  : 'bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 shadow-sm'
              }
            >
              {transaction
                ? 'Cập nhật phiếu'
                : isIncome
                ? 'Lưu Phiếu Thu'
                : 'Lưu Phiếu Chi'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

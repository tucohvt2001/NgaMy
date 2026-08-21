'use client';

import { useState, useEffect } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEventSettlement, useSettleEvent } from '@/hooks/useEventSettlement';
import { EventItem, EventSettlementInput, MemberPayoutItem, EventExpenseItem } from '@/types/models';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  PaymentMethod,
  EXPENSE_CATEGORIES,
  TRANSACTION_CATEGORY_LABELS,
} from '@/types/enums';
import {
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Users,
  Plus,
  Trash2,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Info,
  CalendarCheck,
  Lock,
  ShieldCheck,
} from 'lucide-react';

interface EventSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventItem | null;
}

type PayoutItemState = MemberPayoutItem & { isPaid?: boolean };

function formatCurrency(val: number) {
  return val.toLocaleString('vi-VN') + ' đ';
}

function formatDate(val: string) {
  return new Date(val).toLocaleDateString('vi-VN');
}

export function EventSettlementDialog({ open, onOpenChange, event }: EventSettlementDialogProps) {
  const eventId = event?.id;
  const { data: overview, isLoading: isOverviewLoading } = useEventSettlement(eventId);
  const settleMutation = useSettleEvent();

  // State dự toán
  const [contractAmount, setContractAmount] = useState<number>(0);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [payer, setPayer] = useState<string>('');
  const [incomePaymentMethod, setIncomePaymentMethod] = useState<PaymentMethod>('CASH');
  const [createIncomeVoucher, setCreateIncomeVoucher] = useState<boolean>(true);
  const [markCompleted, setMarkCompleted] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  // State chia tiền công thành viên (dự kiến)
  const [payouts, setPayouts] = useState<PayoutItemState[]>([]);
  const [bulkAmount, setBulkAmount] = useState<string>('');

  // State chi phí phát sinh
  const [expenses, setExpenses] = useState<EventExpenseItem[]>([]);

  useEffect(() => {
    if (event) {
      setContractAmount(event.contractValue || 0);
      setTipAmount(0);
      setPayer(event.customerName || '');
      setIncomePaymentMethod('CASH');
      setCreateIncomeVoucher(true);
      setMarkCompleted(true);
      setNotes('');
      setExpenses([]);
      setBulkAmount('');
    }
  }, [event, open]);

  useEffect(() => {
    if (overview?.members) {
      setPayouts(
        overview.members.map((m) => ({
          memberId: m.memberId,
          amount: m.payoutAmount ?? 0,
          positionName: m.positionName,
          paymentMethod: 'CASH' as PaymentMethod,
          note: m.payoutNote ?? '',
          isPaid: m.isPaid ?? false,
        }))
      );
    }
  }, [overview]);

  // Cập nhật tiền công 1 thành viên (chỉ cho phép nếu chưa thanh toán)
  const handlePayoutChange = (memberId: string, field: keyof PayoutItemState, value: any) => {
    setPayouts((prev) =>
      prev.map((p) => {
        if (p.memberId === memberId) {
          if (p.isPaid) return p; // Khóa không cho sửa nếu đã thanh toán
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  // Chia đều số tiền cho các thành viên chưa thanh toán
  const handleEqualSplit = () => {
    const totalToSplit = Number(bulkAmount);
    const unpaidList = payouts.filter((p) => !p.isPaid);
    if (!totalToSplit || totalToSplit <= 0 || unpaidList.length === 0) return;
    const perPerson = Math.floor(totalToSplit / unpaidList.length);
    setPayouts((prev) =>
      prev.map((p) => (p.isPaid ? p : { ...p, amount: perPerson }))
    );
  };

  // Đặt cùng 1 số tiền cho mỗi người chưa thanh toán
  const handleSetAmountEach = () => {
    const amountEach = Number(bulkAmount);
    if (!amountEach || amountEach <= 0 || payouts.length === 0) return;
    setPayouts((prev) =>
      prev.map((p) => (p.isPaid ? p : { ...p, amount: amountEach }))
    );
  };

  // Thêm dòng chi phí phát sinh
  const handleAddExpense = () => {
    setExpenses((prev) => [
      ...prev,
      {
        category: 'TRAVEL_FOOD',
        amount: 0,
        description: '',
        receiver: '',
        paymentMethod: 'CASH',
      },
    ]);
  };

  // Xóa dòng chi phí
  const handleRemoveExpense = (index: number) => {
    setExpenses((prev) => prev.filter((_, i) => i !== index));
  };

  // Cập nhật thông tin chi phí
  const handleExpenseChange = (index: number, field: keyof EventExpenseItem, value: any) => {
    setExpenses((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  // Tính toán các tổng số tiền
  const totalIncome = Number(contractAmount) + Number(tipAmount);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalEstimatedPayout = payouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const netClubProfit = totalIncome - totalExpenses - totalEstimatedPayout;

  const handleSubmit = () => {
    if (!event) return;

    const payload: EventSettlementInput = {
      contractAmount: Number(contractAmount) || 0,
      tipAmount: Number(tipAmount) || 0,
      payer: payer || event.customerName || 'Khách hàng sự kiện',
      paymentMethod: incomePaymentMethod,
      memberPayouts: payouts.map((p) => ({
        memberId: p.memberId,
        amount: Number(p.amount) || 0,
        positionName: p.positionName,
        paymentMethod: p.paymentMethod,
        note: p.note,
      })),
      expenses: expenses
        .filter((e) => Number(e.amount) > 0)
        .map((e) => {
          const catLabel = (TRANSACTION_CATEGORY_LABELS as Record<string, string>)[e.category] || 'Chi phí sự kiện';
          return {
            category: e.category,
            amount: Number(e.amount),
            description: catLabel,
            receiver: catLabel,
            paymentMethod: e.paymentMethod || 'CASH',
          };
        }),
      createIncomeVoucher,
      createExpenseVouchers: true,
      markEventCompleted: markCompleted,
      notes,
    };

    settleMutation.mutate(
      { id: event.id, input: payload },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
      }
    );
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-amber-700 dark:text-amber-400">
            <Coins className="size-6 text-amber-500" />
            Dự Toán & Hoàn Thành Show Diễn
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground pt-1">
            <span className="font-semibold text-foreground">{event.eventCode} - {event.name}</span>
            <span>•</span>
            <span>Ngày diễn: {formatDate(event.eventDate)}</span>
            <span>•</span>
            <span>Địa điểm: {event.location}</span>
          </div>
        </DialogHeader>

        {isOverviewLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Đang tải dữ liệu nhân sự và thông tin sự kiện...
          </div>
        ) : (
          <div className="space-y-6 pt-2">
            {/* Cảnh báo nếu show đã có phiếu trước đó */}
            {overview?.isSettled && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Sự kiện này đã từng được lưu dự toán hoặc có phiếu thu chi</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Đã thu: <strong>{formatCurrency(overview.settledIncome)}</strong> | Đã chi: <strong>{formatCurrency(overview.settledExpense)}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* PHẦN 1: DOANH THU SHOW DIỄN (THU TIỀN) */}
            <div className="p-4 rounded-2xl border bg-card shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <ArrowDownLeft className="size-4" /> 1. Doanh Thu Show Diễn (Thu Tiền)
                </h3>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createIncomeVoucher}
                    onChange={(e) => setCreateIncomeVoucher(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-medium">Lập Phiếu Thu Doanh Thu vào Sổ Quỹ</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Tiền Hợp Đồng */}
                <div className="space-y-1.5 md:col-span-1">
                  <Label htmlFor="contractAmount" className="text-xs">Tiền show (Hợp đồng) *</Label>
                  <MoneyInput
                    id="contractAmount"
                    value={contractAmount}
                    onChange={(val) => setContractAmount(val)}
                    placeholder="Nhập giá trị show..."
                    className="rounded-xl"
                  />
                </div>

                {/* Tiền Lộc (Tips) */}
                <div className="space-y-1.5 md:col-span-1">
                  <Label htmlFor="tipAmount" className="text-xs flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                    <Gift className="size-3.5" /> Tiền Lộc (Tips thêm)
                  </Label>
                  <MoneyInput
                    id="tipAmount"
                    value={tipAmount}
                    onChange={(val) => setTipAmount(val)}
                    placeholder="Tiền hái lộc..."
                    className="border-amber-500/40 rounded-xl"
                  />
                </div>

                {/* Người nộp / Khách hàng */}
                <div className="space-y-1.5 md:col-span-1">
                  <Label htmlFor="payer" className="text-xs">Khách hàng / Người thanh toán</Label>
                  <Input
                    id="payer"
                    value={payer}
                    onChange={(e) => setPayer(e.target.value)}
                    placeholder="Tên khách hàng..."
                    className="rounded-xl"
                  />
                </div>

                {/* Phương thức thu */}
                <div className="space-y-1.5 md:col-span-1">
                  <Label className="text-xs">Hình thức thu</Label>
                  <Select
                    value={incomePaymentMethod}
                    onValueChange={(v: PaymentMethod) => setIncomePaymentMethod(v)}
                  >
                    <SelectTrigger className="rounded-xl">
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
                </div>
              </div>

              {/* Box Tổng Doanh Thu */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    TỔNG THU SHOW DIỄN:
                  </span>
                  <span className="text-[11px] text-muted-foreground ml-2">
                    (Tiền show {formatCurrency(contractAmount)} + Lộc {formatCurrency(tipAmount)})
                  </span>
                </div>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(totalIncome)}
                </span>
              </div>
            </div>

            {/* PHẦN 2: PHÂN BỔ TIỀN CÔNG DỰ KIẾN CHO THÀNH VIÊN */}
            <div className="p-4 rounded-2xl border border-amber-500/25 bg-amber-500/[0.03] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2 text-amber-800 dark:text-amber-300">
                    <Users className="size-4 text-amber-500" />
                    2. Phân Bổ Tiền Công Dự Kiến ({payouts.length} thành viên)
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Nhập số tiền dự kiến trả cho từng thành viên trong show này (chuyển về Tiền Công tháng để thanh toán)
                  </p>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  <Badge variant="outline" className="bg-background text-amber-700 border-amber-500/30 text-xs gap-1 font-medium">
                    <CalendarCheck className="size-3 text-amber-500" />
                    Thanh toán tại mục Tiền Công
                  </Badge>
                </div>
              </div>

              {/* Ghi chú hướng dẫn flow */}
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300">
                <Info className="size-4 shrink-0 mt-0.5 text-blue-500" />
                <p>
                  <strong>Lưu ý:</strong> Khi xác nhận dự toán, số tiền này sẽ được lưu làm <strong>định mức tiền công của show</strong> và tự động cộng dồn khi lập <strong>Bảng lương tháng</strong> của thành viên. <em>Các thành viên đã được thanh toán lương (Đã xác nhận) sẽ bị khóa để đảm bảo an toàn số liệu kế toán.</em>
                </p>
              </div>

              {/* Công cụ chia tiền nhanh */}
              {payouts.length > 0 && (
                <div className="p-3 rounded-xl bg-background border space-y-2">
                  <div className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
                    <Sparkles className="size-3.5 text-amber-500" />
                    Công cụ chia tiền công nhanh cho thành viên chưa thanh toán:
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="w-44">
                      <MoneyInput
                        placeholder="Nhập số tiền..."
                        value={bulkAmount ? Number(bulkAmount) : ''}
                        onChange={(val) => setBulkAmount(String(val))}
                        className="h-8 text-xs rounded-xl font-semibold"
                      />
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleEqualSplit}
                      disabled={!bulkAmount || Number(bulkAmount) <= 0}
                      className="h-8 text-xs gap-1 rounded-xl"
                    >
                      <Calculator className="size-3.5" />
                      Chia đều cho {payouts.filter((p) => !p.isPaid).length} người
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSetAmountEach}
                      disabled={!bulkAmount || Number(bulkAmount) <= 0}
                      className="h-8 text-xs gap-1 rounded-xl"
                    >
                      Đặt {formatCurrency(Number(bulkAmount) || 0)}/người
                    </Button>
                  </div>
                </div>
              )}

              {/* Bảng danh sách thành viên và tiền công */}
              {payouts.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  Chưa có thành viên nào được phân công trong sự kiện này.
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border bg-background">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="w-10 text-center text-xs">STT</TableHead>
                        <TableHead className="text-xs min-w-[160px]">Thành viên</TableHead>
                        <TableHead className="text-xs min-w-[110px]">Vai trò</TableHead>
                        <TableHead className="text-xs min-w-[150px]">Tiền công dự kiến (VNĐ)</TableHead>
                        <TableHead className="text-xs min-w-[160px]">Ghi chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((p, idx) => {
                        const memberInfo = overview?.members.find((m) => m.memberId === p.memberId);
                        const isPaid = p.isPaid;
                        return (
                          <TableRow key={p.memberId} className={isPaid ? 'bg-muted/20' : ''}>
                            <TableCell className="text-center font-mono text-xs text-muted-foreground">
                              {idx + 1}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <div>
                                  <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                                    {memberInfo?.fullName || 'Thành viên'}
                                    {isPaid && (
                                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] py-0 h-4 gap-0.5">
                                        <ShieldCheck className="size-2.5 text-emerald-500" />
                                        Đã trả
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="font-mono text-[10px] text-muted-foreground">
                                    {memberInfo?.memberCode}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[11px] font-normal">
                                {p.positionName || 'Thành viên'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="relative">
                                <MoneyInput
                                  disabled={isPaid}
                                  value={p.amount || ''}
                                  onChange={(val) =>
                                    handlePayoutChange(p.memberId, 'amount', val)
                                  }
                                  placeholder="0"
                                  className={`h-8 text-xs font-semibold rounded-xl ${
                                    isPaid
                                      ? 'bg-muted text-muted-foreground border-dashed cursor-not-allowed opacity-80'
                                      : 'text-amber-700 dark:text-amber-300'
                                  }`}
                                  title={isPaid ? 'Tiền công của thành viên này đã được chi trả ở mục Tiền Công nên không thể chỉnh sửa.' : ''}
                                />
                                {isPaid && (
                                  <Lock className="size-3 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Input
                                placeholder="Ghi chú tiền công..."
                                disabled={isPaid}
                                value={p.note || ''}
                                onChange={(e) => handlePayoutChange(p.memberId, 'note', e.target.value)}
                                className={`h-8 text-xs rounded-xl ${
                                  isPaid ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-80' : ''
                                }`}
                                title={isPaid ? 'Đã thanh toán tiền công' : ''}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Tổng tiền công dự kiến */}
              <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="font-semibold text-amber-900 dark:text-amber-200">
                  TỔNG TIỀN CÔNG DỰ KIẾN TRẢ THÀNH VIÊN:
                </span>
                <span className="text-base font-black text-amber-600 dark:text-amber-400">
                  {formatCurrency(totalEstimatedPayout)}
                </span>
              </div>
            </div>

            {/* PHẦN 3: CHI PHÍ PHÁT SINH CỦA SHOW (XE CỘ, ĂN UỐNG...) */}
            <div className="p-4 rounded-2xl border bg-card shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
                  <ArrowUpRight className="size-4 text-rose-500" /> 3. Chi Phí Phát Sinh Của Show (Xe cộ, Ăn uống, Thuê ngoài...)
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddExpense} className="h-7 text-xs gap-1 rounded-xl">
                  <Plus className="size-3.5" /> Thêm chi phí
                </Button>
              </div>

              {expenses.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-1">
                  Không có chi phí phát sinh thêm cho show này.
                </p>
              ) : (
                <div className="space-y-2">
                  {expenses.map((exp, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2.5 rounded-xl bg-muted/40 border text-xs">
                      <div className="flex-1">
                        <Select
                          value={exp.category}
                          onValueChange={(v) => handleExpenseChange(idx, 'category', v)}
                        >
                          <SelectTrigger className="h-9 text-xs rounded-xl bg-background">
                            <SelectValue placeholder="Chọn lý do chi..." />
                          </SelectTrigger>
                          <SelectContent>
                            {EXPENSE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat} className="text-xs">
                                {TRANSACTION_CATEGORY_LABELS[cat]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-full sm:w-56">
                        <MoneyInput
                          placeholder="Số tiền chi..."
                          value={exp.amount || ''}
                          onChange={(val) => handleExpenseChange(idx, 'amount', val)}
                          className="h-9 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-background rounded-xl"
                        />
                      </div>

                      <div className="text-right sm:text-center shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveExpense(idx)}
                          className="size-8 text-destructive hover:bg-destructive/10 rounded-xl"
                          title="Xóa dòng chi phí này"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-xs px-1 pt-1">
                    <span className="text-muted-foreground font-medium">Tổng chi phí phát sinh:</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 text-sm">{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* PHẦN 4: BẢNG TỔNG KẾT & CÂN ĐỐI DÒNG TIỀN */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-primary/10 border border-amber-500/30 space-y-3">
              <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                BẢNG TỔNG KẾT CÂN ĐỐI SHOW DIỄN:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-card border text-center">
                  <div className="text-[11px] text-muted-foreground font-medium">1. Tổng Thu Show</div>
                  <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    + {formatCurrency(totalIncome)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-card border text-center">
                  <div className="text-[11px] text-muted-foreground font-medium">2. Chi Phí Phát Sinh</div>
                  <div className="text-sm font-black text-rose-600 dark:text-rose-400 mt-1">
                    - {formatCurrency(totalExpenses)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-card border text-center">
                  <div className="text-[11px] text-muted-foreground font-medium">3. Tiền Công Dự Kiến</div>
                  <div className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1">
                    {formatCurrency(totalEstimatedPayout)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-card border text-center">
                  <div className="text-[11px] text-muted-foreground font-medium">4. Lợi Nhuận Quỹ CLB</div>
                  <div className={`text-sm font-black mt-1 ${netClubProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {netClubProfit >= 0 ? '+' : ''} {formatCurrency(netClubProfit)}
                  </div>
                </div>
              </div>

              {/* Tùy chọn khác */}
              <div className="pt-2 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={markCompleted}
                    onChange={(e) => setMarkCompleted(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span className="font-medium">Chuyển trạng thái sự kiện sang "Hoàn thành (COMPLETED)"</span>
                </label>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">
            Đóng
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={settleMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 rounded-xl text-xs shadow-md shadow-amber-600/20"
          >
            <CheckCircle2 className="size-4" />
            Xác Nhận Dự Toán Show
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

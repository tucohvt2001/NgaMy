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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
} from 'lucide-react';

interface EventSettlementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventItem | null;
}

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

  // State quyết toán
  const [contractAmount, setContractAmount] = useState<number>(0);
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [payer, setPayer] = useState<string>('');
  const [incomePaymentMethod, setIncomePaymentMethod] = useState<PaymentMethod>('CASH');
  const [createIncomeVoucher, setCreateIncomeVoucher] = useState<boolean>(true);
  const [createExpenseVouchers, setCreateExpenseVouchers] = useState<boolean>(true);
  const [markCompleted, setMarkCompleted] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  // State chia thù lao thành viên
  const [payouts, setPayouts] = useState<MemberPayoutItem[]>([]);
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
      setCreateExpenseVouchers(true);
      setMarkCompleted(true);
      setNotes('');
      setExpenses([]);
    }
  }, [event, open]);

  useEffect(() => {
    if (overview?.members) {
      setPayouts(
        overview.members.map((m) => ({
          memberId: m.memberId,
          amount: 0,
          positionName: m.positionName,
          paymentMethod: 'CASH' as PaymentMethod,
          note: '',
        }))
      );
    }
  }, [overview]);

  // Cập nhật thù lao 1 thành viên
  const handlePayoutChange = (memberId: string, field: keyof MemberPayoutItem, value: any) => {
    setPayouts((prev) =>
      prev.map((p) => (p.memberId === memberId ? { ...p, [field]: value } : p))
    );
  };

  // Chia đều số tiền cho tất cả thành viên
  const handleEqualSplit = () => {
    const totalToSplit = Number(bulkAmount);
    if (!totalToSplit || totalToSplit <= 0 || payouts.length === 0) return;
    const perPerson = Math.floor(totalToSplit / payouts.length);
    setPayouts((prev) => prev.map((p) => ({ ...p, amount: perPerson })));
  };

  // Đặt cùng 1 số tiền cho mỗi người
  const handleSetAmountEach = () => {
    const amountEach = Number(bulkAmount);
    if (!amountEach || amountEach <= 0 || payouts.length === 0) return;
    setPayouts((prev) => prev.map((p) => ({ ...p, amount: amountEach })));
  };

  // Thêm dòng chi phí phát sinh
  const handleAddExpense = () => {
    setExpenses((prev) => [
      ...prev,
      {
        category: 'TRAVEL_FOOD',
        amount: 0,
        description: 'Chi phí xe / ăn uống lưu diễn',
        receiver: 'Nhà xe / Quán ăn',
        paymentMethod: 'CASH',
      },
    ]);
  };

  // Xóa dòng chi phí
  const handleRemoveExpense = (index: number) => {
    setExpenses((prev) => prev.filter((_, i) => i !== index));
  };

  // Cập nhật chi phí phát sinh
  const handleExpenseChange = (index: number, field: keyof EventExpenseItem, value: any) => {
    setExpenses((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, [field]: value } : exp))
    );
  };

  // Tính toán tổng số tiền
  const totalIncome = Number(contractAmount) + Number(tipAmount);
  const totalPayout = payouts.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const totalExpenseSum = totalPayout + totalExpenses;
  const netFundProfit = totalIncome - totalExpenseSum;

  const handleSubmit = () => {
    if (!event) return;

    const payload: EventSettlementInput = {
      contractAmount: Number(contractAmount) || 0,
      tipAmount: Number(tipAmount) || 0,
      payer: payer || event.customerName || 'Khách hàng sự kiện',
      paymentMethod: incomePaymentMethod,
      memberPayouts: payouts.filter((p) => Number(p.amount) > 0),
      expenses: expenses.filter((e) => Number(e.amount) > 0),
      createIncomeVoucher,
      createExpenseVouchers,
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
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-amber-700 dark:text-amber-400">
            <Coins className="size-6 text-amber-500" />
            Quyết Toán Show Diễn
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
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Sự kiện này đã có {overview.existingTransactions.length} phiếu thu chi trong sổ quỹ</p>
                  <p className="mt-0.5 text-muted-foreground">
                    Đã thu: <strong>{formatCurrency(overview.settledIncome)}</strong> | Đã chi: <strong>{formatCurrency(overview.settledExpense)}</strong>.
                    Nếu tiếp tục quyết toán, hệ thống sẽ tạo thêm các phiếu thu/chi mới bổ sung.
                  </p>
                </div>
              </div>
            )}

            {/* PHẦN 1: DOANH THU SHOW DIỄN (THU TIỀN) */}
            <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-4">
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
                  <span className="font-medium">Tự động lập Phiếu Thu vào Sổ Quỹ</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Tiền Hợp Đồng */}
                <div className="space-y-1.5">
                  <Label htmlFor="contractAmount" className="text-xs">Tiền show (Hợp đồng) *</Label>
                  <Input
                    id="contractAmount"
                    type="number"
                    min="0"
                    step="10000"
                    value={contractAmount}
                    onChange={(e) => setContractAmount(Number(e.target.value))}
                    placeholder="Nhập giá trị show..."
                  />
                  {contractAmount > 0 && (
                    <p className="text-[11px] font-semibold text-muted-foreground">
                      ≈ {formatCurrency(contractAmount)}
                    </p>
                  )}
                </div>

                {/* Tiền Lộc (Tips) */}
                <div className="space-y-1.5">
                  <Label htmlFor="tipAmount" className="text-xs flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                    <Gift className="size-3.5" /> Tiền Lộc (Tips thưởng thêm)
                  </Label>
                  <Input
                    id="tipAmount"
                    type="number"
                    min="0"
                    step="10000"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(Number(e.target.value))}
                    placeholder="Tiền hái lộc / lì xì..."
                    className="border-amber-500/40"
                  />
                  {tipAmount > 0 && (
                    <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      + {formatCurrency(tipAmount)}
                    </p>
                  )}
                </div>

                {/* Người nộp / Khách hàng */}
                <div className="space-y-1.5">
                  <Label htmlFor="payer" className="text-xs">Khách hàng / Người thanh toán</Label>
                  <Input
                    id="payer"
                    value={payer}
                    onChange={(e) => setPayer(e.target.value)}
                    placeholder="Tên khách hàng hoặc đối tác..."
                  />
                </div>
              </div>

              {/* Box Tổng Doanh Thu */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
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

            {/* PHẦN 2: CHIA THÙ LAO TỪNG THÀNH VIÊN ĐI SHOW */}
            <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                <h3 className="font-bold text-sm flex items-center gap-2 text-rose-700 dark:text-rose-400">
                  <Users className="size-4" /> 2. Chia Thù Lao Từng Người Đi Show ({overview?.members.length ?? 0} thành viên)
                </h3>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createExpenseVouchers}
                    onChange={(e) => setCreateExpenseVouchers(e.target.checked)}
                    className="rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span className="font-medium">Tự động lập các Phiếu Chi thù lao</span>
                </label>
              </div>

              {/* Công cụ tính nhanh */}
              {payouts.length > 0 && (
                <div className="p-3 rounded-lg bg-muted/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Calculator className="size-4 text-primary" />
                    <span className="font-semibold">Công cụ chia nhanh:</span>
                    <Input
                      type="number"
                      placeholder="Nhập số tiền..."
                      value={bulkAmount}
                      onChange={(e) => setBulkAmount(e.target.value)}
                      className="h-8 w-36 text-xs"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleEqualSplit}
                      className="h-8 text-xs"
                    >
                      Chia đều ({payouts.length} người)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSetAmountEach}
                      className="h-8 text-xs"
                    >
                      Đặt cho mỗi người
                    </Button>
                  </div>
                </div>
              )}

              {/* Bảng danh sách thành viên đi show */}
              {payouts.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                  Sự kiện này chưa có thành viên nào được phân công trong lịch diễn. Vui lòng phân công nhân sự trước hoặc tạo phiếu chi thù lao thủ công.
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40 text-xs">
                      <TableRow>
                        <TableHead className="w-10 text-center">#</TableHead>
                        <TableHead>Thành viên đi show</TableHead>
                        <TableHead>Vị trí</TableHead>
                        <TableHead className="w-44">Thù lao (VNĐ) *</TableHead>
                        <TableHead className="w-36">Phương thức</TableHead>
                        <TableHead>Ghi chú</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {overview?.members.map((mem, index) => {
                        const payout = payouts.find((p) => p.memberId === mem.memberId);
                        return (
                          <TableRow key={mem.id} className="hover:bg-muted/30">
                            <TableCell className="text-center font-medium">{index + 1}</TableCell>
                            <TableCell>
                              <div className="font-semibold text-foreground">{mem.fullName}</div>
                              <div className="text-[10px] text-muted-foreground">
                                {mem.memberCode} {mem.phone ? `• ${mem.phone}` : ''}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px]">
                                {mem.positionName}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                min="0"
                                step="10000"
                                value={payout?.amount || ''}
                                onChange={(e) =>
                                  handlePayoutChange(mem.memberId, 'amount', Number(e.target.value))
                                }
                                placeholder="0"
                                className="h-8 text-xs font-semibold text-rose-600 dark:text-rose-400"
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                value={payout?.paymentMethod || 'CASH'}
                                onValueChange={(val) =>
                                  handlePayoutChange(mem.memberId, 'paymentMethod', val)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {PAYMENT_METHODS.map((pm) => (
                                    <SelectItem key={pm} value={pm} className="text-xs">
                                      {PAYMENT_METHOD_LABELS[pm]}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Input
                                value={payout?.note || ''}
                                onChange={(e) =>
                                  handlePayoutChange(mem.memberId, 'note', e.target.value)
                                }
                                placeholder="Ghi chú thù lao..."
                                className="h-8 text-xs"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Tổng thù lao anh em */}
              <div className="flex justify-between items-center text-xs px-1">
                <span className="text-muted-foreground font-medium">
                  Tổng thù lao chi cho {payouts.filter((p) => Number(p.amount) > 0).length}/{payouts.length} thành viên:
                </span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                  {formatCurrency(totalPayout)}
                </span>
              </div>
            </div>

            {/* PHẦN 3: CHI PHÍ PHÁT SINH CỦA SHOW (XE CỘ, ĂN UỐNG...) */}
            <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-sm flex items-center gap-2 text-foreground">
                  <ArrowUpRight className="size-4 text-rose-500" /> 3. Chi Phí Phát Sinh Của Show (Xe cộ, Ăn uống, Thuê ngoài...)
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={handleAddExpense} className="h-7 text-xs gap-1">
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
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center p-2 rounded-lg bg-muted/40 border text-xs">
                      <div className="sm:col-span-3">
                        <Select
                          value={exp.category}
                          onValueChange={(v) => handleExpenseChange(idx, 'category', v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
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
                      <div className="sm:col-span-3">
                        <Input
                          placeholder="Nội dung chi..."
                          value={exp.description}
                          onChange={(e) => handleExpenseChange(idx, 'description', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          placeholder="Người nhận..."
                          value={exp.receiver}
                          onChange={(e) => handleExpenseChange(idx, 'receiver', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <Input
                          type="number"
                          placeholder="Số tiền..."
                          value={exp.amount || ''}
                          onChange={(e) => handleExpenseChange(idx, 'amount', Number(e.target.value))}
                          className="h-8 text-xs font-semibold text-rose-600"
                        />
                      </div>
                      <div className="sm:col-span-1 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveExpense(idx)}
                          className="size-7 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-xs px-1 pt-1">
                    <span className="text-muted-foreground font-medium">Tổng chi phí phát sinh:</span>
                    <span className="font-bold text-rose-600">{formatCurrency(totalExpenses)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* PHẦN 4: BẢNG TỔNG KẾT & CÂN ĐỐI DÒNG TIỀN */}
            <div className="p-4 rounded-xl bg-linear-to-r from-amber-500/10 via-emerald-500/10 to-primary/10 border border-amber-500/30 space-y-3">
              <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                BẢNG TỔNG KẾT CÂN ĐỐI SHOW DIỄN:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-card border text-center">
                  <div className="text-xs text-muted-foreground font-medium">Tổng Thu Show</div>
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    + {formatCurrency(totalIncome)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-card border text-center">
                  <div className="text-xs text-muted-foreground font-medium">Tổng Chi Show (Thù lao + Phí)</div>
                  <div className="text-base font-black text-rose-600 dark:text-rose-400 mt-1">
                    - {formatCurrency(totalExpenseSum)}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-card border text-center">
                  <div className="text-xs text-muted-foreground font-medium">Trích Vào Quỹ CLB</div>
                  <div className={`text-base font-black mt-1 ${netFundProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {netFundProfit >= 0 ? '+' : ''} {formatCurrency(netFundProfit)}
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
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            isLoading={settleMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
          >
            <CheckCircle2 className="size-4" />
            Xác Nhận Quyết Toán & Lập Phiếu Thu Chi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

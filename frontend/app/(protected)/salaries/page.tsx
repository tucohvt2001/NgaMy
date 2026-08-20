'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Calculator,
  CheckCircle2,
  Eye,
  CalendarDays,
  Wallet,
  Users,
  Sparkles,
  Receipt,
  QrCode,
  RefreshCw,
  Clock,
  ShieldCheck,
  Plus,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { MemberSalaryDetailDialog } from '@/components/forms/MemberSalaryDetailDialog';
import { SalaryPaymentQrDialog } from '@/components/forms/SalaryPaymentQrDialog';
import {
  useCalculateSalary,
  useCalculateMonth,
  useConfirmSalary,
  useSalaries,
} from '@/hooks/useSalaries';
import { useMembers } from '@/hooks/useMembers';
import { useEvents } from '@/hooks/useEvents';
import { useAuthStore } from '@/stores/authStore';
import { CalculateSalaryInput } from '@/services/salary.service';
import { SalaryRecord } from '@/types/models';

const calcSchema = z.object({
  memberId: z.string().min(1, 'Vui lòng chọn thành viên'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
  allowance: z.coerce.number().optional(),
  bonus: z.coerce.number().optional(),
  deduction: z.coerce.number().optional(),
});

type CalcFormValues = z.infer<typeof calcSchema>;

function formatCurrency(value: number) {
  return value.toLocaleString('vi-VN') + ' đ';
}

export default function SalariesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [formOpen, setFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<SalaryRecord | null>(null);
  const [qrPaymentRecord, setQrPaymentRecord] = useState<SalaryRecord | null>(null);

  const user = useAuthStore((state) => state.user);
  const canManage = user?.permissions.includes('salary:manage');

  const { data, isLoading, refetch } = useSalaries({ month, year, page: 1, limit: 100 });
  const { data: memberData } = useMembers({ page: 1, limit: 200, status: 'ACTIVE' });
  const calculateMutation = useCalculateSalary();
  const calculateMonthMutation = useCalculateMonth();
  const confirmMutation = useConfirmSalary();

  // Lấy toàn bộ danh sách show diễn trong tháng được chọn
  const startOfMonth = new Date(year, month - 1, 1).toISOString();
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
  const { data: monthEventsData } = useEvents({ fromDate: startOfMonth, toDate: endOfMonth, limit: 100 });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CalcFormValues>({
    resolver: zodResolver(calcSchema),
    defaultValues: { month, year },
  });

  const onSubmit = (values: CalcFormValues) => {
    const input: CalculateSalaryInput = values;
    calculateMutation.mutate(input, {
      onSuccess: () => {
        setFormOpen(false);
        reset();
      },
    });
  };

  const handleSyncAllMonth = () => {
    calculateMonthMutation.mutate({ month, year });
  };

  const totalAmount = data?.items.reduce((sum, r) => sum + r.totalAmount, 0) ?? 0;
  const paidAmount =
    data?.items
      .filter((r) => r.status === 'CONFIRMED')
      .reduce((sum, r) => sum + r.totalAmount, 0) ?? 0;
  const unpaidAmount =
    data?.items
      .filter((r) => r.status === 'DRAFT')
      .reduce((sum, r) => sum + r.totalAmount, 0) ?? 0;
  const totalPaidMembers = data?.items.length ?? 0;
  const totalMonthShows = monthEventsData?.items.length ?? 0;
  const totalSettledShows = monthEventsData?.items.filter((e) => e.status === 'COMPLETED').length ?? 0;

  return (
    <div className="space-y-6">
      {/* 1. Header & Bộ lọc Tháng / Năm */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="size-6 text-amber-500" />
            Quản Lý Tiền Công & Thù Lao
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Tự động tính thù lao từ các show diễn đã tất toán trong tháng và thanh toán qua QR
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-card/80 p-1 rounded-2xl border border-border/80 shadow-xs">
            <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
              <SelectTrigger className="w-28 h-9 rounded-xl text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <SelectItem key={m} value={String(m)} className="text-xs">
                    Tháng {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-24 h-9 rounded-xl text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[year - 1, year, year + 1].map((y) => (
                  <SelectItem key={y} value={String(y)} className="text-xs">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {canManage && (
            <>
              <Button
                variant="outline"
                onClick={handleSyncAllMonth}
                isLoading={calculateMonthMutation.isPending}
                className="h-10 rounded-2xl border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 text-xs gap-1.5 font-semibold"
                title="Tự động tính lại thù lao từ các show diễn đã tất toán cho tất cả thành viên"
              >
                <RefreshCw className="size-3.5" />
                <span>Đồng bộ / Tính lại tháng</span>
              </Button>

              <Button
                onClick={() => setFormOpen(true)}
                className="h-10 rounded-2xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Plus className="size-4" />
                <span>Thêm bảng lương lẻ</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 2. Bốn Thẻ KPI Thống Kê Nhanh Của Tháng */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Tổng tiền công */}
        <Card className="border-border/70 bg-gradient-to-br from-amber-500/[0.07] via-card to-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Tổng tiền công tháng {month}/{year}</p>
              <p className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <DollarSign className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Đã thanh toán */}
        <Card className="border-border/70 bg-gradient-to-br from-emerald-500/[0.05] via-card to-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Đã thanh toán (CONFIRMED)</p>
              <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(paidAmount)}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Chưa thanh toán */}
        <Card className="border-border/70 bg-gradient-to-br from-rose-500/[0.05] via-card to-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">Chưa thanh toán (DRAFT)</p>
              <p className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
                {formatCurrency(unpaidAmount)}
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <Clock className="size-5" />
            </div>
          </CardContent>
        </Card>

        {/* Tổng show diễn */}
        <Card className="border-border/70 bg-gradient-to-br from-blue-500/[0.05] via-card to-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">Show đã tất toán</p>
              <p className="text-lg sm:text-xl font-black text-foreground mt-0.5">
                {totalSettledShows}/{totalMonthShows} show ({totalPaidMembers} người)
              </p>
            </div>
            <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <CalendarDays className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Bảng danh sách tiền công theo thành viên */}
      <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="p-4 bg-muted/20 border-b border-border/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-foreground">Bảng Thù Lao Chi Tiết Tháng {month}/{year}</h2>
            <p className="text-xs text-muted-foreground">
              Nhấp vào thành viên để xem danh sách show đã đi. Bấm biểu tượng QR để chuyển khoản và xác nhận thanh toán.
            </p>
          </div>
          {data && data.items.length > 0 && (
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              {data.items.length} thành viên
            </span>
          )}
        </div>

        {isLoading ? (
          <LoadingState />
        ) : !data || data.items.length === 0 ? (
          <EmptyState label={`Chưa có dữ liệu thù lao cho Tháng ${month}/${year}. Hãy kiểm tra điểm danh show hoặc bấm "Đồng bộ / Tính lại tháng".`} />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-12 text-center">STT</TableHead>
                  <TableHead>Thành viên</TableHead>
                  <TableHead className="text-center">Số show đi</TableHead>
                  <TableHead className="text-right">Lương cơ bản</TableHead>
                  <TableHead className="text-right">Phụ cấp</TableHead>
                  <TableHead className="text-right">Thưởng</TableHead>
                  <TableHead className="text-right">Khấu trừ</TableHead>
                  <TableHead className="text-right">Tổng thực nhận</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-right w-40">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((record, index) => (
                  <TableRow
                    key={record.id}
                    className="hover:bg-muted/40 cursor-pointer transition-colors"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <TableCell className="text-center text-xs font-semibold text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black text-xs flex items-center justify-center shrink-0">
                          {record.member?.fullName?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <div>
                          <p className="font-bold text-xs sm:text-sm text-foreground hover:text-amber-600 transition-colors">
                            {record.member?.fullName}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {record.member?.memberCode}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs">
                        {record.totalSessions} buổi
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs font-semibold">
                      {formatCurrency(record.baseAmount)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-emerald-600">
                      +{formatCurrency(record.allowance)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-amber-600">
                      +{formatCurrency(record.bonus)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-rose-600">
                      -{formatCurrency(record.deduction)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs sm:text-sm font-black text-amber-600 dark:text-amber-400">
                      {formatCurrency(record.totalAmount)}
                    </TableCell>
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <Badge
                        variant={record.status === 'CONFIRMED' ? 'default' : 'secondary'}
                        className={`text-[10px] uppercase font-bold ${
                          record.status === 'CONFIRMED'
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {record.status === 'CONFIRMED' ? 'ĐÃ THANH TOÁN' : 'CHỜ THANH TOÁN'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-xl hover:bg-amber-500/15 text-amber-600"
                          title="Xem chi tiết các buổi biểu diễn"
                          onClick={() => setSelectedRecord(record)}
                        >
                          <Eye className="size-4" />
                        </Button>

                        {record.totalAmount > 0 && record.member?.bankAccount && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-xl hover:bg-emerald-500/15 text-emerald-600"
                            title="Quét mã VietQR chuyển khoản & Xác nhận thanh toán"
                            onClick={() => setQrPaymentRecord(record)}
                          >
                            <QrCode className="size-4" />
                          </Button>
                        )}

                        {canManage && record.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/15"
                            title="Xác nhận đã thanh toán & lập phiếu chi sổ quỹ"
                            isLoading={confirmMutation.isPending}
                            onClick={() => confirmMutation.mutate(record.id)}
                          >
                            <CheckCircle2 className="size-4" />
                          </Button>
                        )}

                        {record.status === 'CONFIRMED' && (
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 px-1">
                            <ShieldCheck className="size-3.5" /> Xong
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Dialog Tính tiền công riêng lẻ */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-amber-700 dark:text-amber-400">
              <Calculator className="size-5 text-amber-500" />
              Tính Tiền Công Thành Viên
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Chọn thành viên *</Label>
              <Controller
                name="memberId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="rounded-xl text-xs">
                      <SelectValue placeholder="Chọn thành viên..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-56">
                      {memberData?.items.map((m) => (
                        <SelectItem key={m.id} value={m.id} className="text-xs">
                          {m.memberCode} - {m.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.memberId && (
                <p className="text-[11px] text-destructive">{errors.memberId.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Tháng</Label>
                <Input
                  type="number"
                  {...register('month')}
                  className="rounded-xl text-xs"
                />
                {errors.month && <p className="text-[11px] text-destructive">{errors.month.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Năm</Label>
                <Input
                  type="number"
                  {...register('year')}
                  className="rounded-xl text-xs"
                />
                {errors.year && <p className="text-[11px] text-destructive">{errors.year.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Phụ cấp thêm (VNĐ)</Label>
              <Input
                type="number"
                step="10000"
                placeholder="0"
                {...register('allowance')}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Thưởng thêm (VNĐ)</Label>
              <Input
                type="number"
                step="10000"
                placeholder="0"
                {...register('bonus')}
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Khấu trừ (VNĐ)</Label>
              <Input
                type="number"
                step="10000"
                placeholder="0"
                {...register('deduction')}
                className="rounded-xl text-xs text-destructive"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)} className="rounded-xl text-xs">
                Hủy
              </Button>
              <Button
                type="submit"
                isLoading={calculateMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs"
              >
                Tính & Cập Nhật
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Xem Chi Tiết Bảng Lương & Show Diễn Đã Đi */}
      <MemberSalaryDetailDialog
        open={Boolean(selectedRecord)}
        onOpenChange={(open) => !open && setSelectedRecord(null)}
        record={selectedRecord}
        monthEvents={monthEventsData?.items || []}
        canManage={canManage}
        onConfirm={(recordId) => {
          confirmMutation.mutate(recordId);
          setSelectedRecord(null);
        }}
        onOpenQrPayment={(rec) => {
          setSelectedRecord(null);
          setQrPaymentRecord(rec);
        }}
      />

      {/* Dialog Quét Mã VietQR Chuyển Khoản Nhanh */}
      <SalaryPaymentQrDialog
        open={Boolean(qrPaymentRecord)}
        onOpenChange={(open) => !open && setQrPaymentRecord(null)}
        record={qrPaymentRecord}
        onConfirm={(recordId) => confirmMutation.mutate(recordId)}
      />
    </div>
  );
}

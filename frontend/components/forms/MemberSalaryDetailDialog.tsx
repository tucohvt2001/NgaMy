'use client';

import { CheckCircle2, XCircle, CalendarDays, Wallet, CreditCard, ShieldCheck, QrCode, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SalaryRecord, EventItem } from '@/types/models';

interface MemberSalaryDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: SalaryRecord | null;
  monthEvents: EventItem[];
  onConfirm?: (recordId: string) => void;
  onOpenQrPayment?: (record: SalaryRecord) => void;
  canManage?: boolean;
}

function formatCurrency(val: number) {
  return val.toLocaleString('vi-VN') + ' đ';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function MemberSalaryDetailDialog({
  open,
  onOpenChange,
  record,
  monthEvents,
  onConfirm,
  onOpenQrPayment,
  canManage,
}: MemberSalaryDetailDialogProps) {
  if (!record) return null;

  const attendedEventIds = new Set(record.details?.map((d) => d.eventId).filter(Boolean));

  // Ghép danh sách show trong tháng với chi tiết tham gia của thành viên
  const combinedShows = monthEvents.map((ev) => {
    const isAttended = attendedEventIds.has(ev.id);
    const detail = record.details?.find((d) => d.eventId === ev.id);
    const isSettled =
      ev.status === 'COMPLETED' ||
      ((ev as any)._count?.transactions ?? 0) > 0 ||
      ((ev as any)._count?.salaryConfigs ?? 0) > 0 ||
      ((ev as any).salaryConfigs?.length ?? 0) > 0;

    // Lấy tất cả vai trò mà thành viên này được phân công trong show (hỗ trợ 1 người nhiều vai trò)
    const memberRoles = (ev as any).eventMembers
      ?.filter((em: any) => em.memberId === record.memberId)
      ?.map((em: any) => em.position?.name)
      ?.filter(Boolean) || [];

    const positionName =
      memberRoles.length > 0
        ? memberRoles.join(', ')
        : detail?.position?.name || (isAttended ? 'Diễn viên' : '-');

    return {
      id: ev.id,
      eventCode: ev.eventCode,
      name: ev.name,
      eventDate: ev.eventDate,
      location: ev.location,
      status: ev.status,
      isSettled,
      isAttended,
      positionName,
      amount: detail?.amount ?? 0,
      note: detail?.note,
    };
  });

  // Kiểm tra xem có show nào trong details mà không nằm trong monthEvents không
  record.details?.forEach((d) => {
    if (d.eventId && !monthEvents.some((ev) => ev.id === d.eventId) && d.event) {
      combinedShows.push({
        id: d.eventId,
        eventCode: d.event.eventCode,
        name: d.event.name,
        eventDate: d.event.eventDate,
        location: d.event.location,
        status: d.event.status,
        isSettled: d.event.status === 'COMPLETED',
        isAttended: true,
        positionName: d.position?.name || 'Diễn viên',
        amount: d.amount,
        note: d.note ?? undefined,
      });
    }
  });

  const totalMonthShows = combinedShows.length;
  const totalAttended = combinedShows.filter((s) => s.isAttended && s.isSettled).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border-border/80 shadow-2xl">
        {/* Header Thông tin thành viên & Tháng lương */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500/10 via-background to-amber-500/5 border-b border-border/80 shrink-0">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300 font-black text-lg">
                  {record.member?.fullName?.charAt(0).toUpperCase() || 'M'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-xl font-bold text-foreground">
                      {record.member?.fullName}
                    </DialogTitle>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                      {record.member?.memberCode}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3 mt-1">
                    {record.member?.phone && <span>SĐT: {record.member.phone}</span>}
                    {record.member?.bankAccount && (
                      <span className="flex items-center gap-1">
                        <CreditCard className="size-3 text-amber-500" />
                        STK: {record.member.bankAccount} ({record.member.bankName || 'Ngân hàng'})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <Badge variant="outline" className="px-3 py-1 text-xs font-bold bg-background border-amber-400/40 text-amber-700 dark:text-amber-300">
                  Tháng {record.month}/{record.year}
                </Badge>
                <Badge variant={record.status === 'CONFIRMED' ? 'default' : 'secondary'} className="px-3 py-1 text-xs font-bold">
                  {record.status === 'CONFIRMED' ? 'Đã thanh toán' : 'Chờ thanh toán'}
                </Badge>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Nội dung: Bảng danh sách show trong tháng */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Thẻ tóm tắt nhanh */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/60">
              <span className="text-[11px] font-medium text-muted-foreground">Tổng show tháng</span>
              <p className="text-lg font-black text-foreground">{totalMonthShows} show</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Show đã dự toán</span>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{totalAttended} buổi</p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/60">
              <span className="text-[11px] font-medium text-muted-foreground">Lương</span>
              <p className="text-base font-bold text-foreground">{formatCurrency(record.baseAmount)}</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">Thực nhận</span>
              <p className="text-base font-black text-amber-600 dark:text-amber-400">{formatCurrency(record.totalAmount)}</p>
            </div>
          </div>

          {/* Bảng Chi Tiết Toàn Bộ Show Trong Tháng */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <CalendarDays className="size-4 text-amber-500" />
                Bảng Show Trong Tháng ({totalAttended}/{totalMonthShows} buổi đã dự toán)
              </h3>
              <span className="text-[11px] text-muted-foreground">
                Chỉ những show <strong>Đã dự toán</strong> mới được cộng vào bảng lương
              </span>
            </div>

            <div className="rounded-2xl border border-border/80 overflow-hidden shadow-xs">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="w-12 text-center">STT</TableHead>
                    <TableHead className="w-36">Ngày giờ diễn</TableHead>
                    <TableHead>Mã & Tên show diễn</TableHead>
                    <TableHead className="w-36 text-center">Trạng thái show</TableHead>
                    <TableHead className="w-32">Chức vụ / Vai</TableHead>
                    <TableHead className="w-28 text-right">Tiền công</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {combinedShows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                        Không có show diễn nào được ghi nhận trong tháng này.
                      </TableCell>
                    </TableRow>
                  ) : (
                    combinedShows.map((show, idx) => (
                      <TableRow
                        key={show.id}
                        className={
                          show.isAttended && show.isSettled
                            ? 'bg-emerald-500/[0.04] hover:bg-emerald-500/[0.08]'
                            : show.isAttended && !show.isSettled
                              ? 'bg-amber-500/[0.04] hover:bg-amber-500/[0.08]'
                              : 'hover:bg-muted/30 opacity-70'
                        }
                      >
                        <TableCell className="text-center text-xs font-semibold text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-medium text-foreground block">{formatDate(show.eventDate)}</span>
                          <span className="text-[10px] text-muted-foreground truncate block">{show.location}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-xs text-foreground block">{show.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{show.eventCode}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          {show.isAttended && show.isSettled ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                              <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[2.5]" />
                              Đã dự toán
                            </span>
                          ) : show.isAttended && !show.isSettled ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-semibold text-[11px]" title="Show này chưa được dự toán nên chưa cộng tiền công">
                              <Clock className="size-3 text-amber-500 shrink-0" />
                              Chờ dự toán
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-muted-foreground text-[11px]">
                              <XCircle className="size-3 text-muted-foreground/60 shrink-0" />
                              Không đi
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {show.positionName && show.positionName !== '-' ? (
                            <div className="flex flex-wrap gap-1">
                              {String(show.positionName).split(', ').map((pos: string, pIdx: number) => (
                                <Badge
                                  key={pIdx}
                                  variant="secondary"
                                  className="text-[11px] font-semibold bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/30"
                                >
                                  {pos}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs">
                          {show.isAttended && show.isSettled ? (
                            <span className="text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(show.amount)}
                            </span>
                          ) : show.isAttended && !show.isSettled ? (
                            <span className="text-muted-foreground text-[11px] italic font-normal" title="Chờ dự toán show">
                              Chờ dự toán
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-normal">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Chi tiết Phụ cấp, Thưởng, Khấu trừ & Tổng thực nhận */}
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 space-y-2.5 text-xs">
            <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Wallet className="size-4 text-amber-500" />
              Tổng Hợp Bảng Lương Tháng {record.month}/{record.year}
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-border/60">
              <div className="flex justify-between sm:flex-col">
                <span className="text-muted-foreground">Lương ({totalAttended} show đã dự toán):</span>
                <span className="font-semibold text-foreground">{formatCurrency(record.baseAmount)}</span>
              </div>
              <div className="flex justify-between sm:flex-col">
                <span className="text-muted-foreground">Phụ cấp:</span>
                <span className="font-semibold text-emerald-600">+{formatCurrency(record.allowance)}</span>
              </div>
              <div className="flex justify-between sm:flex-col">
                <span className="text-muted-foreground">Thưởng thêm:</span>
                <span className="font-semibold text-emerald-600">+{formatCurrency(record.bonus)}</span>
              </div>
              <div className="flex justify-between sm:flex-col">
                <span className="text-muted-foreground">Khấu trừ:</span>
                <span className="font-semibold text-rose-600">-{formatCurrency(record.deduction)}</span>
              </div>
            </div>

            <div className="pt-3 mt-2 border-t border-border/60 flex items-center justify-between">
              <span className="text-sm font-bold text-foreground uppercase tracking-wide">
                Tổng Tiền Công Thực Nhận:
              </span>
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                {formatCurrency(record.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <DialogFooter className="p-4 border-t border-border/80 bg-muted/10 flex items-center justify-between sm:justify-between shrink-0">
          <div className="text-xs text-muted-foreground">
            Trạng thái: <strong className="text-foreground">{record.status === 'CONFIRMED' ? 'Đã thanh toán' : 'Chờ thanh toán'}</strong>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">
              Đóng
            </Button>
            {onOpenQrPayment && (
              <Button
                size="sm"
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl text-xs gap-1.5 shadow-md shadow-amber-500/20"
                onClick={() => {
                  onOpenQrPayment(record);
                }}
              >
                <QrCode className="size-4" />
                Quét QR Chuyển Tiền
              </Button>
            )}
            {canManage && record.status !== 'CONFIRMED' && onConfirm && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-1.5"
                onClick={() => {
                  onConfirm(record.id);
                  onOpenChange(false);
                }}
              >
                <ShieldCheck className="size-4" />
                Xác Nhận Đã Thanh Toán
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

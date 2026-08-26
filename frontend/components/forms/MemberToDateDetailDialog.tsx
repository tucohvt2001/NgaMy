'use client';

import { useState } from 'react';
import {
  User,
  Calendar,
  DollarSign,
  QrCode,
  Sparkles,
  Phone,
  Building2,
  CheckCircle2,
  Clock,
  Layers,
  FileSpreadsheet,
  X,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MemberSalaryToDateItem } from '@/services/salary.service';
import { EVENT_TYPE_LABELS } from '@/types/enums';

function formatCurrency(val: number) {
  return val.toLocaleString('vi-VN') + ' đ';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

interface MemberToDateDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberSalaryToDateItem | null;
  onOpenQr?: (member: MemberSalaryToDateItem) => void;
}

export function MemberToDateDetailDialog({
  open,
  onOpenChange,
  member,
  onOpenQr,
}: MemberToDateDetailDialogProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'records'>('events');

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border-border/80 shadow-2xl">
        {/* 1. Header Hero */}
        <DialogHeader className="p-5 sm:p-6 bg-gradient-to-r from-amber-500/15 via-background to-amber-500/5 border-b border-border/80 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pr-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-lg text-amber-900 dark:text-amber-200 shrink-0">
                {member.fullName.charAt(0)}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  {member.fullName}
                  <Badge variant="outline" className="font-mono text-[11px] font-bold py-0.5">
                    {member.memberCode}
                  </Badge>
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {member.phone && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="size-3 text-muted-foreground" /> {member.phone}
                    </span>
                  )}
                  {member.teams.length > 0 && (
                    <span>• Đội: {member.teams.join(', ')}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Thông tin thanh toán & Nút QR */}
            {member.remainingAmount > 0 && member.bankAccount && onOpenQr && (
              <Button
                size="sm"
                onClick={() => onOpenQr(member)}
                className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-sm self-start sm:self-auto"
              >
                <QrCode className="size-3.5" />
                Quét VietQR chi trả ({formatCurrency(member.remainingAmount)})
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* 2. Tổng quan số liệu (KPI Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-5 bg-muted/20 border-b border-border/80 shrink-0">
          <div className="p-3 rounded-2xl bg-card border border-border/80 shadow-xs">
            <span className="text-[11px] font-medium text-muted-foreground block">Số show tham gia</span>
            <span className="text-base font-bold text-foreground mt-0.5 block">{member.totalEvents} show</span>
          </div>

          <div className="p-3 rounded-2xl bg-card border border-border/80 shadow-xs">
            <span className="text-[11px] font-medium text-muted-foreground block">Tổng tiền công</span>
            <span className="text-base font-black text-foreground mt-0.5 block">
              {formatCurrency(member.totalAmount)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-xs">
            <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 block">Đã thanh toán</span>
            <span className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              {formatCurrency(member.paidAmount)}
            </span>
          </div>

          <div
            className={`p-3 rounded-2xl shadow-xs border ${
              member.remainingAmount > 0
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-900 dark:text-amber-200'
                : 'bg-card border-border/80 text-muted-foreground'
            }`}
          >
            <span className="text-[11px] font-medium block">Còn lại chưa chi</span>
            <span
              className={`text-base font-black mt-0.5 block ${
                member.remainingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
              }`}
            >
              {formatCurrency(member.remainingAmount)}
            </span>
          </div>
        </div>

        {/* 3. Chuyển đổi Tab (Show diễn / Bảng lương tháng) */}
        <div className="px-5 pt-3 pb-1 border-b border-border/80 flex items-center gap-2">
          <Button
            type="button"
            variant={activeTab === 'events' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('events')}
            className={`rounded-xl text-xs font-bold gap-1.5 ${
              activeTab === 'events'
                ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Calendar className="size-3.5" />
            Lịch sử show biểu diễn ({member.events.length})
          </Button>

          <Button
            type="button"
            variant={activeTab === 'records' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('records')}
            className={`rounded-xl text-xs font-bold gap-1.5 ${
              activeTab === 'records'
                ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CreditCard className="size-3.5" />
            Bảng lương tháng ({member.salaryRecords.length})
          </Button>
        </div>

        {/* 4. Nội dung Bảng dữ liệu */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'events' ? (
            <div className="rounded-2xl border border-border/80 overflow-hidden bg-card">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-12 text-center text-xs font-bold">STT</TableHead>
                    <TableHead className="min-w-[140px] text-xs font-bold">Tên show diễn</TableHead>
                    <TableHead className="w-28 text-xs font-bold">Loại show</TableHead>
                    <TableHead className="w-28 text-xs font-bold">Ngày diễn</TableHead>
                    <TableHead className="min-w-[140px] text-xs font-bold">Vai trò</TableHead>
                    <TableHead className="w-32 text-right text-xs font-bold">Tiền công (VNĐ)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {member.events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-28 text-center text-xs text-muted-foreground">
                        Thành viên chưa tham gia show biểu diễn nào trong khoảng thời gian này.
                      </TableCell>
                    </TableRow>
                  ) : (
                    member.events.map((ev, idx) => (
                      <TableRow key={ev.eventId + idx} className="hover:bg-muted/20">
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-xs text-foreground block">{ev.eventName}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{ev.eventCode}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] py-0.5 px-1.5">
                            {ev.eventType ? EVENT_TYPE_LABELS[ev.eventType] || ev.eventType : 'Khác'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(ev.eventDate)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {ev.roles.map((r, i) => (
                              <Badge
                                key={i}
                                variant="secondary"
                                className="text-[10px] py-0 px-1.5 bg-amber-500/15 text-amber-900 dark:text-amber-200 border-amber-500/30"
                              >
                                {r}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(ev.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/80 overflow-hidden bg-card">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-12 text-center text-xs font-bold">STT</TableHead>
                    <TableHead className="text-xs font-bold">Kỳ lương</TableHead>
                    <TableHead className="text-right text-xs font-bold">Tổng tiền (VNĐ)</TableHead>
                    <TableHead className="text-center text-xs font-bold">Trạng thái</TableHead>
                    <TableHead className="text-right text-xs font-bold">Ngày thanh toán</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {member.salaryRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-28 text-center text-xs text-muted-foreground">
                        Chưa có kỳ bảng lương tháng nào được lập cho thành viên này.
                      </TableCell>
                    </TableRow>
                  ) : (
                    member.salaryRecords.map((rec, idx) => (
                      <TableRow key={rec.id} className="hover:bg-muted/20">
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-bold text-xs text-foreground">
                          Tháng {rec.month}/{rec.year}
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(rec.totalAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          {rec.status === 'CONFIRMED' ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px]">
                              <CheckCircle2 className="size-3 mr-1" />
                              Đã chi trả
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30">
                              <Clock className="size-3 mr-1" />
                              Chờ chi
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-xs text-muted-foreground">
                          {rec.confirmedAt ? formatDate(rec.confirmedAt) : '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

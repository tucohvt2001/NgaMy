'use client';

import { Printer, Calendar, User, CreditCard, Tag, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/types/models';
import {
  TRANSACTION_CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  STATUS_LABELS,
  TransactionCategory,
  PaymentMethod,
} from '@/types/enums';

interface TransactionDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

function formatCurrency(val: number) {
  return val.toLocaleString('vi-VN') + ' đ';
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `Ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
}

export function TransactionDetailDialog({
  open,
  onOpenChange,
  transaction,
}: TransactionDetailDialogProps) {
  if (!transaction) return null;

  const isIncome = transaction.type === 'INCOME';

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-lg font-bold">
              Chi tiết chứng từ {transaction.code}
            </span>
            <Badge
              variant={isIncome ? 'default' : 'destructive'}
              className={isIncome ? 'bg-emerald-600' : 'bg-rose-600'}
            >
              {isIncome ? 'Phiếu Thu' : 'Phiếu Chi'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Khung xem trước & In ấn hóa đơn chuẩn */}
        <div className="printable-voucher p-6 border rounded-xl bg-card space-y-6 shadow-xs">
          {/* Header chứng từ */}
          <div className="flex items-start justify-between border-b pb-4">
            <div>
              <p className="font-bold text-sm tracking-wide text-primary uppercase">
                CLB LÂN SƯ RỒNG NGA MY THƯỢNG
              </p>
              <p className="text-xs text-muted-foreground">
                Hệ thống Quản lý Hoạt động & Tài chính Nội bộ
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-muted-foreground">Mẫu số: 01-TT</p>
              <p className="text-xs text-muted-foreground">
                Mã phiếu: <strong>{transaction.code}</strong>
              </p>
            </div>
          </div>

          {/* Tiêu đề chính giữa */}
          <div className="text-center space-y-1">
            <h2 className={`text-2xl font-extrabold tracking-tight uppercase ${isIncome ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
              {isIncome ? 'PHIẾU THU' : 'PHIẾU CHI'}
            </h2>
            <p className="text-xs italic text-muted-foreground">
              {formatDate(transaction.transactionDate)}
            </p>
          </div>

          {/* Nội dung chi tiết */}
          <div className="space-y-3 text-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dashed pb-2">
              <span className="text-muted-foreground font-medium">
                {isIncome ? 'Họ và tên người nộp tiền:' : 'Họ và tên người nhận tiền:'}
              </span>
              <span className="font-bold text-foreground">{transaction.payerOrReceiver}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dashed pb-2">
              <span className="text-muted-foreground font-medium">Danh mục giao dịch:</span>
              <span className="font-semibold">
                {TRANSACTION_CATEGORY_LABELS[transaction.category as TransactionCategory] || transaction.category}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dashed pb-2">
              <span className="text-muted-foreground font-medium">Hình thức thanh toán:</span>
              <span>{PAYMENT_METHOD_LABELS[transaction.paymentMethod as PaymentMethod] || transaction.paymentMethod}</span>
            </div>

            {transaction.event && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dashed pb-2">
                <span className="text-muted-foreground font-medium">Sự kiện / Show diễn liên quan:</span>
                <span className="font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 text-xs">
                  🎪 {transaction.event.eventCode ? `[${transaction.event.eventCode}] ` : ''}{transaction.event.name}
                </span>
              </div>
            )}

            {transaction.member && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dashed pb-2">
                <span className="text-muted-foreground font-medium">Thành viên liên quan:</span>
                <span>
                  {transaction.member.memberCode} - {transaction.member.fullName} ({transaction.member.phone || 'Chưa có SĐT'})
                </span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dashed pb-2">
              <span className="text-muted-foreground font-medium">Lý do / Diễn giải:</span>
              <span className="text-foreground">{transaction.description || 'Không có diễn giải'}</span>
            </div>

            {transaction.notes && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dashed pb-2">
                <span className="text-muted-foreground font-medium">Ghi chú kèm theo:</span>
                <span className="italic text-muted-foreground">{transaction.notes}</span>
              </div>
            )}

            {/* Chi tiết tiền lộc nếu có */}
            {isIncome && transaction.tipAmount && transaction.tipAmount > 0 ? (
              <div className="space-y-1.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tiền biểu diễn show / Tiền gốc:</span>
                  <span className="font-semibold">{formatCurrency(transaction.amount - transaction.tipAmount)}</span>
                </div>
                <div className="flex justify-between text-amber-700 dark:text-amber-400 font-semibold">
                  <span>Tiền lộc (Tips / Thưởng lộc gia chủ):</span>
                  <span>+ {formatCurrency(transaction.tipAmount)}</span>
                </div>
              </div>
            ) : null}

            {/* Số tiền nổi bật */}
            <div className="p-4 rounded-lg bg-muted/50 flex flex-col sm:flex-row items-center justify-between gap-2 border">
              <span className="text-base font-bold">TỔNG SỐ TIỀN:</span>
              <span className={`text-2xl font-black ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(transaction.amount)}
              </span>
            </div>
          </div>

          {/* Chữ ký các bên */}
          <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
            <div className="space-y-12">
              <p className="font-bold uppercase">Người lập phiếu</p>
              <p className="font-medium text-muted-foreground">
                {transaction.creator?.username || 'Ban tài chính'}
              </p>
            </div>
            <div className="space-y-12">
              <p className="font-bold uppercase">{isIncome ? 'Người nộp tiền' : 'Người nhận tiền'}</p>
              <p className="font-medium text-muted-foreground">{transaction.payerOrReceiver}</p>
            </div>
            <div className="space-y-12">
              <p className="font-bold uppercase">Chủ nhiệm CLB / Duyệt</p>
              <p className="font-medium text-muted-foreground">
                {transaction.approver?.username || 'Ban chủ nhiệm'}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between pt-2">
          <Button variant="outline" onClick={handlePrint} className="gap-2">
            <Printer className="size-4" />
            In phiếu thu/chi
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

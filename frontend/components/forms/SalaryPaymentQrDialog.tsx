'use client';

import { useState } from 'react';
import Image from 'next/image';
import { QrCode, Copy, Check, Download, ShieldCheck, AlertCircle, CreditCard, Building2, User, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SalaryRecord } from '@/types/models';

interface SalaryPaymentQrDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: SalaryRecord | null;
  onConfirm?: (recordId: string) => void;
}

// Danh sách ngân hàng phổ biến tại Việt Nam cho VietQR
export const POPULAR_BANKS = [
  { code: 'MB', name: 'MBBank (Ngân hàng Quân Đội)' },
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'ICB', name: 'VietinBank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'VBA', name: 'Agribank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'VIB', name: 'VIB' },
  { code: 'SHB', name: 'SHB' },
  { code: 'MSB', name: 'MSB' },
  { code: 'OCB', name: 'OCB' },
  { code: 'LPB', name: 'LPBank (Bưu Điện Liên Việt)' },
  { code: 'SEAB', name: 'SeABank' },
  { code: 'EIB', name: 'Eximbank' },
  { code: 'TIMO', name: 'Timo' },
  { code: 'CAKE', name: 'Cake by VPBank' },
];

function normalizeBankCode(rawBank: string | null | undefined): string {
  if (!rawBank) return 'MB';
  const clean = rawBank.trim().toUpperCase();
  const matched = POPULAR_BANKS.find(
    (b) => b.code.toUpperCase() === clean || clean.includes(b.code.toUpperCase()) || clean.includes(b.name.toUpperCase())
  );
  if (matched) return matched.code;
  // Bỏ khoảng trắng và ký tự đặc biệt
  return clean.replace(/[^A-Z0-9]/g, '') || 'MB';
}

function formatCurrency(val: number) {
  return val.toLocaleString('vi-VN') + ' đ';
}

export function SalaryPaymentQrDialog({
  open,
  onOpenChange,
  record,
  onConfirm,
}: SalaryPaymentQrDialogProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!record) return null;

  const rawBankName = record.member?.bankName?.trim();
  const rawBankAccount = record.member?.bankAccount?.trim();
  const hasBankInfo = Boolean(rawBankName && rawBankAccount);

  const bankCode = normalizeBankCode(rawBankName);
  const accountNumber = rawBankAccount || '';
  const amount = Math.max(0, record.totalAmount);
  const accountName = record.member?.fullName || '';
  const transferContent = `Tien cong T${record.month}-${record.year} ${record.member?.fullName || ''}`.trim();

  const qrUrl = hasBankInfo
    ? `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
      transferContent
    )}&accountName=${encodeURIComponent(accountName)}`
    : null;

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`Đã sao chép ${fieldName}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden rounded-3xl border-border/80 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/15 via-background to-orange-500/10 border-b border-border/70 shrink-0">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <QrCode className="size-5 text-amber-500" />
              Thanh Toán Tiền Công Qua VietQR
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Quét mã QR bằng App Ngân hàng để chuyển khoản chính xác và nhanh chóng
            </p>
          </DialogHeader>
        </div>

        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
          {/* Thông tin người nhận & Số tiền */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold">
                Thành viên: <strong>{record.member?.fullName}</strong> ({record.member?.memberCode})
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tiền công tháng {record.month}/{record.year} ({record.totalSessions} show)
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Số tiền</span>
              <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400">
                {formatCurrency(amount)}
              </p>
            </div>
          </div>

          {/* Trường hợp THÀNH VIÊN CHƯA CÓ THÔNG TIN NGÂN HÀNG -> BÁO KHÔNG CÓ QR, TUYỆT ĐỐI KHÔNG CHO SỬA */}
          {!hasBankInfo ? (
            <div className="py-8 px-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-center space-y-3">
              <div className="size-12 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="size-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400">
                  Không Có Mã QR Thanh Toán
                </h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Thành viên <strong>{record.member?.fullName}</strong> chưa được cập nhật thông tin Ngân hàng và Số tài khoản trong hồ sơ.
                </p>
                <p className="text-[11px] text-rose-600/90 dark:text-rose-400/90 font-medium pt-1">
                  Vui lòng cập nhật thông tin tại mục <strong>Quản lý Thành viên</strong>.
                </p>
              </div>
            </div>
          ) : (
            /* Trường hợp ĐẦY ĐỦ THÔNG TIN -> Hiển thị QR Code VietQR */
            <div className="space-y-3">
              <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border shadow-xs">
                {qrUrl && (
                  <div className="relative w-full max-w-[220px] aspect-[540/640] rounded-xl overflow-hidden">
                    <Image
                      src={qrUrl}
                      alt={`VietQR Thanh toán ${record.member?.fullName}`}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <p className="text-[11px] text-zinc-500 font-medium mt-1">
                  Mã QR tự động điền STK, Số tiền và Nội dung chuyển khoản
                </p>
              </div>

              {/* Chi tiết chuyển khoản & Nút sao chép */}
              <div className="space-y-2 text-xs divide-y divide-border/60 rounded-2xl border border-border/80 bg-muted/20 p-3">
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-amber-500" /> Ngân hàng:
                  </span>
                  <span className="font-bold text-foreground">
                    {rawBankName}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <CreditCard className="size-3.5 text-amber-500" /> Số tài khoản:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground text-sm">{accountNumber}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-foreground"
                      onClick={() => copyToClipboard(accountNumber, 'Số tài khoản')}
                    >
                      {copiedField === 'Số tài khoản' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <User className="size-3.5 text-amber-500" /> Người thụ hưởng:
                  </span>
                  <span className="font-bold text-foreground uppercase">{accountName}</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Wallet className="size-3.5 text-amber-500" /> Số tiền:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
                      {formatCurrency(amount)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-foreground"
                      onClick={() => copyToClipboard(String(amount), 'Số tiền')}
                    >
                      {copiedField === 'Số tiền' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">Nội dung CK:</span>
                  <div className="flex items-center gap-2 max-w-[200px]">
                    <span className="font-mono text-[11px] text-foreground truncate" title={transferContent}>
                      {transferContent}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => copyToClipboard(transferContent, 'Nội dung chuyển khoản')}
                    >
                      {copiedField === 'Nội dung chuyển khoản' ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-3.5 sm:p-4 bg-muted/10 border-t border-border/80 flex flex-row items-center justify-between sm:justify-between shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">
            Đóng
          </Button>

          <div className="flex items-center gap-2">
            {qrUrl && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs gap-1"
                asChild
              >
                <a href={qrUrl} download={`VietQR-${record.member?.fullName}.png`} target="_blank" rel="noreferrer">
                  <Download className="size-3.5" />
                  Lưu ảnh QR
                </a>
              </Button>
            )}

            {onConfirm && record.status !== 'CONFIRMED' && (
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-1.5 shadow-md shadow-emerald-600/20"
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

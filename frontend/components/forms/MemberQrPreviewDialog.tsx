'use client';

import { useState } from 'react';
import Image from 'next/image';
import { QrCode, Copy, Check, Download, CreditCard, Building2, User } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Member } from '@/types/models';

interface MemberQrPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: Member | null;
}

export function MemberQrPreviewDialog({
  open,
  onOpenChange,
  member,
}: MemberQrPreviewDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!member || !member.bankAccount) return null;

  const finalBankCodeOrBin =
    member.bank?.bin ||
    member.bank?.code ||
    member.bankBin ||
    member.bankCode ||
    member.bankName ||
    'MB';
  const displayBankName = member.bank?.shortName || member.bankName || 'Ngân hàng';
  const bankLogo = member.bank?.logo || null;
  const accountNumber = member.bankAccount.trim();
  const accountName = member.fullName.trim();

  const qrUrl = `https://img.vietqr.io/image/${finalBankCodeOrBin}-${accountNumber}-compact2.png?accountName=${encodeURIComponent(
    accountName
  )}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Đã sao chép số tài khoản');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs sm:max-w-sm p-0 gap-0 overflow-hidden rounded-3xl border-border/80 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-background to-orange-500/10 border-b border-border/70">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
              <QrCode className="size-4.5 text-amber-500" />
              Mã VietQR Tài Khoản Ngân Hàng
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Quét mã QR bằng ứng dụng ngân hàng để chuyển khoản nhanh
            </p>
          </DialogHeader>
        </div>

        {/* Nội dung QR Code */}
        <div className="p-4 space-y-3.5">
          <div className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border shadow-xs">
            <div className="relative w-full max-w-[210px] aspect-[540/640] rounded-xl overflow-hidden">
              <Image
                src={qrUrl}
                alt={`VietQR ${member.fullName}`}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <p className="text-[10px] text-zinc-500 font-medium mt-1">
              Mã QR chuẩn Napas247 - VietQR
            </p>
          </div>

          {/* Chi tiết tài khoản */}
          <div className="space-y-1.5 text-xs rounded-2xl border border-border/70 bg-muted/20 p-3 divide-y divide-border/50">
            <div className="flex items-center justify-between py-1">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Building2 className="size-3.5 text-amber-500" /> Ngân hàng:
              </span>
              <div className="flex items-center gap-1.5">
                {bankLogo && (
                  <div className="relative size-4.5 rounded overflow-hidden bg-white p-0.5 border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bankLogo}
                      alt={displayBankName}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <span className="font-bold text-foreground">{displayBankName}</span>
              </div>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <CreditCard className="size-3.5 text-amber-500" /> Số tài khoản:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-foreground text-xs sm:text-sm">
                  {accountNumber}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 text-muted-foreground hover:text-foreground"
                  onClick={() => copyToClipboard(accountNumber)}
                  title="Sao chép số tài khoản"
                >
                  {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <User className="size-3.5 text-amber-500" /> Chủ tài khoản:
              </span>
              <span className="font-bold text-foreground uppercase truncate max-w-[150px]">
                {accountName}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-3 bg-muted/10 border-t border-border/80 flex flex-row items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="rounded-xl text-xs">
            Đóng
          </Button>

          <Button
            variant="default"
            size="sm"
            className="rounded-xl text-xs gap-1 font-semibold"
            asChild
          >
            <a href={qrUrl} download={`VietQR-${member.fullName}.png`} target="_blank" rel="noreferrer">
              <Download className="size-3.5" />
              Tải mã QR
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

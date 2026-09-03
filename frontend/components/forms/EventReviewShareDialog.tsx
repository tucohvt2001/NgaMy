'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Star,
  Sparkles,
  MessageSquare,
  Download,
  Share2,
  Calendar,
  MapPin,
  Heart,
  Clock,
  Flame,
  Smile,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EventItem } from '@/types/models';
import { useEventReviews } from '@/hooks/useReviews';
import { toast } from 'sonner';

interface EventReviewShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: EventItem | null;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function EventReviewShareDialog({ open, onOpenChange, event }: EventReviewShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'reviews'>('qr');

  const { data: reviews = [], isLoading: isLoadingReviews } = useEventReviews(event?.id);

  if (!event) return null;

  // Lấy URL thực tế từ window.location hoặc fallback
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const reviewUrl = `${origin}/feedback/${event.id}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(reviewUrl)}&margin=10`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setCopied(true);
      toast.success('Đã sao chép link đánh giá vào bộ nhớ tạm!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Không thể sao chép tự động, vui lòng chọn và copy thủ công');
    }
  };

  const handleDownloadQr = async () => {
    try {
      const res = await fetch(qrCodeUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR_DanhGia_${event.eventCode}_${event.name}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success('Đã tải ảnh mã QR đánh giá về máy!');
    } catch {
      toast.error('Lỗi khi tải mã QR');
    }
  };

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10
      : 5.0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-3xl border-border/80 shadow-2xl">
        {/* 1. Header */}
        <DialogHeader className="p-5 sm:p-6 bg-gradient-to-r from-amber-500/15 via-background to-amber-500/5 border-b border-border/80 shrink-0 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <Star className="size-5 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  Khách Hàng Đánh Giá Show Diễn
                </DialogTitle>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span className="font-bold text-foreground">{event.name}</span>
                  <span>({event.eventCode})</span>
                </div>
              </div>
            </div>

            {reviews.length > 0 && (
              <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 text-xs px-2.5 py-1">
                ⭐ {avgRating} ({reviews.length} đánh giá)
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* 2. Tabs chuyển đổi: Lấy Link & QR / Xem Đánh Giá Đã Nhận */}
        <div className="px-5 pt-3 pb-1 border-b border-border/80 flex items-center gap-2 bg-muted/20 shrink-0">
          <Button
            type="button"
            variant={activeTab === 'qr' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('qr')}
            className={`rounded-xl text-xs font-bold gap-1.5 ${
              activeTab === 'qr'
                ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <QrCode className="size-3.5" />
            Mã QR & Link Gửi Khách
          </Button>

          <Button
            type="button"
            variant={activeTab === 'reviews' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('reviews')}
            className={`rounded-xl text-xs font-bold gap-1.5 ${
              activeTab === 'reviews'
                ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageSquare className="size-3.5" />
            Nhận Xét Từ Khách ({reviews.length})
          </Button>
        </div>

        {/* 3. Nội Dung Tab */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {activeTab === 'qr' ? (
            <div className="space-y-5 text-center">
              {/* Khung Mã QR */}
              <div className="inline-block p-4 rounded-3xl bg-white border-2 border-amber-400/40 shadow-xl relative group">
                <img
                  src={qrCodeUrl}
                  alt="QR Đánh Giá"
                  width={220}
                  height={220}
                  className="rounded-xl mx-auto block"
                />
                <p className="text-[11px] font-bold text-slate-800 mt-2 tracking-wide uppercase">
                  Quét mã để đánh giá show
                </p>
              </div>

              {/* Ô Copy Đường Link */}
              <div className="space-y-2 text-left">
                <p className="text-xs font-bold text-foreground">Đường dẫn đánh giá trực tiếp:</p>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={reviewUrl}
                    className="flex-1 h-10 px-3.5 rounded-xl bg-muted/60 border border-border text-xs font-mono text-muted-foreground select-all focus:outline-none"
                  />
                  <Button
                    type="button"
                    onClick={handleCopyLink}
                    className="h-10 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-1.5 shrink-0"
                  >
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
                  </Button>
                </div>
              </div>

              {/* Các nút thao tác nhanh */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownloadQr}
                  className="rounded-2xl text-xs font-semibold gap-1.5 h-10 border-border hover:bg-muted"
                >
                  <Download className="size-4 text-amber-500" />
                  Tải ảnh mã QR
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="rounded-2xl text-xs font-semibold gap-1.5 h-10 border-border hover:bg-muted"
                >
                  <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="size-4 text-emerald-500" />
                    Mở thử trang đánh giá
                  </a>
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground italic">
                💡 Mẹo: Bạn có thể gửi link này qua Zalo hoặc in mã QR cho khách quét ngay sau khi bế mạc sự kiện.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {isLoadingReviews ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Đang tải danh sách đánh giá...
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Star className="size-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-xs font-semibold text-muted-foreground">
                    Chưa có đánh giá nào cho sự kiện này.
                  </p>
                  <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                    Hãy gửi link hoặc mã QR cho khách hàng để nhận phản hồi đầu tiên nhé!
                  </p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-xs text-foreground block">{rev.customerName}</span>
                        {rev.customerPhone && (
                          <span className="font-mono text-[10px] text-muted-foreground">
                            SĐT: {rev.customerPhone}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`size-3.5 ${
                              s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-muted/40'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Chi tiết tiêu chí con nếu có */}
                    {(rev.performanceQuality || rev.punctuality || rev.attitude) && (
                      <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-muted/40 text-[10px] text-muted-foreground">
                        <span>🔥 Múa: {rev.performanceQuality || 5}⭐</span>
                        <span>⏰ Đúng giờ: {rev.punctuality || 5}⭐</span>
                        <span>❤️ Thái độ: {rev.attitude || 5}⭐</span>
                      </div>
                    )}

                    {rev.comment && (
                      <p className="text-xs text-foreground/90 bg-muted/20 p-2.5 rounded-xl whitespace-pre-line leading-relaxed">
                        {rev.comment}
                      </p>
                    )}

                    <span className="text-[10px] text-muted-foreground block text-right">
                      {formatDate(rev.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

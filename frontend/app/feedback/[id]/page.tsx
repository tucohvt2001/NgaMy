'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import {
  Star,
  Sparkles,
  Calendar,
  MapPin,
  HeartHandshake,
  CheckCircle2,
  Clock,
  Send,
  User,
  Phone,
  MessageSquare,
  Flame,
  Smile,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { usePublicReviewInfo, useSubmitReview } from '@/hooks/useReviews';

const QUICK_TAGS = [
  'Múa rất mãn nhãn & đẹp mắt 🔥',
  'Đúng giờ & chuẩn bị chu đáo ⏰',
  'Thái độ rất nhiệt tình, lễ phép ❤️',
  'Tiếng trống rộn rã, hào hùng 🥁',
  'Đầu lân & đạo cụ mới đẹp ✨',
  'Không khí khai trương rất may mắn 🧧',
];

const RATING_DESCRIPTIONS: Record<number, { title: string; color: string; emoji: string }> = {
  1: { title: 'Rất thất vọng', color: 'text-rose-500', emoji: '😞' },
  2: { title: 'Chưa hài lòng', color: 'text-orange-500', emoji: '😐' },
  3: { title: 'Hài lòng / Tốt', color: 'text-amber-500', emoji: '😊' },
  4: { title: 'Rất hài lòng & Ấn tượng', color: 'text-emerald-500', emoji: '🌟' },
  5: { title: 'Tuyệt vời xuất sắc!', color: 'text-amber-400', emoji: '🎉' },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function PublicEventFeedbackPage() {
  const params = useParams();
  const eventId = (params?.id as string) || '';

  const { data, isLoading, isError } = usePublicReviewInfo(eventId);
  const submitMutation = useSubmitReview();

  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [performanceQuality, setPerformanceQuality] = useState<number>(5);
  const [punctuality, setPunctuality] = useState<number>(5);
  const [attitude, setAttitude] = useState<number>(5);

  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  // Tự động điền tên và số điện thoại khách hàng nếu sự kiện đã có
  useEffect(() => {
    if (data?.event) {
      if (data.event.customerName && !customerName) {
        setCustomerName(data.event.customerName);
      }
      if (data.event.customerPhone && !customerPhone) {
        setCustomerPhone(data.event.customerPhone);
      }
    }
  }, [data?.event]);

  const activeRating = hoverRating || rating;

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const next = prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = customerName.trim() || data?.event.customerName || 'Khách hàng';

    let finalComment = comment.trim();
    if (selectedTags.length > 0) {
      const tagsText = `[Đặc điểm nổi bật: ${selectedTags.join(', ')}]`;
      finalComment = finalComment ? `${tagsText}\n${finalComment}` : tagsText;
    }

    submitMutation.mutate(
      {
        eventId,
        data: {
          customerName: finalName,
          customerPhone: customerPhone.trim() || null,
          rating,
          performanceQuality,
          punctuality,
          attitude,
          comment: finalComment || null,
          isPublic: true,
        },
      },
      {
        onSuccess: (res) => {
          setSubmittedMessage(res.message);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="size-16 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-400">Đang tải thông tin sự kiện...</p>
      </div>
    );
  }

  if (isError || !data?.event) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="size-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 mb-4">
          <HeartHandshake className="size-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Không tìm thấy sự kiện</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-2">
          Đường dẫn đánh giá không tồn tại hoặc sự kiện đã bị gỡ bỏ. Quý khách vui lòng kiểm tra lại đường link từ ban tổ chức.
        </p>
      </div>
    );
  }

  const { event } = data;

  // MÀN HÌNH CẢM ƠN SAU KHI GỬI THÀNH CÔNG
  if (submittedMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg rounded-3xl bg-slate-900/90 border border-amber-500/30 p-6 sm:p-8 text-center shadow-2xl shadow-amber-500/10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 size-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 size-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="size-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/30 mb-5">
            <div className="w-full h-full rounded-[22px] bg-slate-950 flex items-center justify-center">
              <CheckCircle2 className="size-10 text-amber-400 stroke-[2.5]" />
            </div>
          </div>

          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs px-3 py-1 mb-3">
            Đánh giá đã được ghi nhận
          </Badge>

          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
            Cảm Ơn Quý Khách!
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-3 whitespace-pre-line">
            {submittedMessage}
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-amber-500/[0.07] border border-amber-500/20 text-left space-y-1.5 text-xs">
            <p className="font-bold text-amber-300">🎪 Show: {event.name}</p>
            {(event.customerName || event.customerPhone) && (
              <p className="text-slate-300 flex items-center gap-1.5 flex-wrap">
                <User className="size-3 text-amber-400" />
                Khách hàng: <span className="text-white font-semibold">{event.customerName || 'Quý khách'}</span>
                {event.customerPhone && (
                  <span className="text-slate-400 font-mono">({event.customerPhone})</span>
                )}
              </p>
            )}
            <p className="text-slate-400">📅 Ngày: {formatDate(event.eventDate)}</p>
            <p className="text-slate-400">⭐ Đánh giá: {rating} / 5 sao</p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-center gap-2">
            <Image src="/logo.jpg" alt="Logo Nga My" width={20} height={20} className="rounded-full ring-1 ring-amber-400/50" />
            <span>Đoàn Nghệ Thuật Lân Sư Rồng Nga My Thượng</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-black text-slate-100 flex flex-col items-center justify-start p-4 sm:p-6 md:py-10">
      <div className="w-full max-w-xl space-y-5">
        {/* 1. Header Banner & Nhận diện Thương hiệu */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 border border-amber-500/30 p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-15 pointer-events-none">
            <Sparkles className="size-28 text-amber-400" />
          </div>

          <div className="flex items-center gap-3.5 mb-3">
            <Image
              src="/logo.jpg"
              alt="Logo Nga My"
              width={48}
              height={48}
              className="rounded-full ring-2 ring-amber-400 shadow-md shrink-0"
            />
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Đoàn Nghệ Thuật Lân Sư Rồng
              </h2>
              <h1 className="text-base sm:text-lg font-black text-white">NGA MY THƯỢNG</h1>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 space-y-2">
            <div>
              <span className="text-base sm:text-lg font-bold text-amber-200 block">{event.name}</span>
            </div>

            {/* Thông tin Khách Hàng & Số Điện Thoại */}
            {(event.customerName || event.customerPhone) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs py-2 px-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
                {event.customerName && (
                  <span className="flex items-center gap-1.5 font-medium">
                    <User className="size-3.5 text-amber-400 shrink-0" />
                    Khách hàng: <strong className="text-white font-bold">{event.customerName}</strong>
                  </span>
                )}
                {event.customerPhone && (
                  <span className="flex items-center gap-1.5 font-mono">
                    <Phone className="size-3.5 text-amber-400 shrink-0" />
                    SĐT: <strong className="text-white font-bold">{event.customerPhone}</strong>
                  </span>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5 text-amber-400/80" />
                {formatDate(event.eventDate)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5 text-amber-400/80" />
                {event.location}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Form Đánh Giá Của Khách Hàng */}
        <form onSubmit={handleSubmit} className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 sm:p-7 shadow-2xl space-y-6">
          {/* A. Chấm Điểm Sao Tổng Thể */}
          <div className="text-center space-y-3 pb-4 border-b border-slate-800">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Mức độ hài lòng chung của quý khách
            </p>

            <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 sm:p-2 rounded-2xl transition-all duration-200 hover:scale-125 focus:outline-none"
                >
                  <Star
                    className={`size-8 sm:size-10 transition-colors ${
                      star <= activeRating
                        ? 'text-amber-400 fill-amber-400 filter drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                        : 'text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-1.5 text-sm sm:text-base font-bold transition-all">
              <span>{RATING_DESCRIPTIONS[activeRating]?.emoji}</span>
              <span className={RATING_DESCRIPTIONS[activeRating]?.color}>
                {RATING_DESCRIPTIONS[activeRating]?.title}
              </span>
            </div>
          </div>

          {/* B. Đánh Giá Chi Tiết Theo Tiêu Chí */}
          <div className="space-y-3.5 pt-1">
            <Label className="text-xs font-bold text-slate-300 block">Đánh giá theo từng tiêu chí:</Label>

            {/* Tiêu chí 1: Chất lượng múa */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Flame className="size-4 text-amber-500" />
                Chất lượng múa & Kỹ thuật
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setPerformanceQuality(s)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`size-4 ${
                        s <= performanceQuality ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Tiêu chí 2: Đúng giờ */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Clock className="size-4 text-emerald-500" />
                Đúng giờ & Tác phong
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setPunctuality(s)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`size-4 ${
                        s <= punctuality ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Tiêu chí 3: Thái độ */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-medium text-slate-200 flex items-center gap-1.5">
                <Smile className="size-4 text-rose-500" />
                Thái độ nhiệt tình, chu đáo
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => setAttitude(s)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`size-4 ${
                        s <= attitude ? 'text-amber-400 fill-amber-400' : 'text-slate-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* C. Chọn Nhanh Lời Khen (Pills) */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-300">Điểm quý khách ưng ý nhất:</Label>
            <div className="flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm shadow-amber-500/20 font-semibold'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* D. Nhận Xét / Góp Ý Thêm */}
          <div className="space-y-1.5">
            <Label htmlFor="comment" className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MessageSquare className="size-3.5 text-amber-400" />
              Ý kiến đóng góp / Lời chúc dành cho đoàn:
            </Label>
            <Textarea
              id="comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ cảm nhận chi tiết của quý khách về buổi biểu diễn..."
              className="rounded-2xl bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600 focus:border-amber-500 resize-none"
            />
          </div>

          {/* E. Thông Tin Người Đánh Giá */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="customerName" className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <User className="size-3.5 text-amber-400" />
                Họ và tên của bạn *
              </Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={event.customerName || 'vd: Anh Nam, Chị Lan...'}
                className="h-10 rounded-xl bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="customerPhone" className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Phone className="size-3.5 text-amber-400" />
                Số điện thoại (tùy chọn)
              </Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Nhập SĐT để nhận ưu đãi show sau..."
                className="h-10 rounded-xl bg-slate-950 border-slate-800 text-xs text-white placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* F. Nút Gửi Đánh Giá */}
          <Button
            type="submit"
            disabled={submitMutation.isPending}
            isLoading={submitMutation.isPending}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-600 hover:to-amber-600 text-black font-black text-sm gap-2 shadow-lg shadow-amber-500/25 transition-all"
          >
            <Send className="size-4" />
            Gửi Đánh Giá Buổi Biểu Diễn
          </Button>

          <p className="text-[11px] text-center text-slate-500">
            Ý kiến của quý khách giúp đoàn Lân Sư Rồng Nga My không ngừng nâng cao chất lượng phục vụ.
          </p>
        </form>
      </div>
    </div>
  );
}

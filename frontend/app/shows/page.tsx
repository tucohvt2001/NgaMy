'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Share2,
  ExternalLink,
  Sparkles,
  Flame,
  CheckCircle2,
  CalendarDays,
  RefreshCw,
  Layers,
  FileText,
  Copy,
  Check,
  Compass,
  Heart,
  ChevronRight,
  Zap,
  Info,
  Award,
  Crown,
  Drum,
  Volume2,
  PartyPopper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePublicSchedules } from '@/hooks/usePublicSchedules';
import { PublicEventItem, PublicEventMember } from '@/services/publicSchedule.service';
import { EVENT_TYPE_LABELS } from '@/types/enums';
import { formatTime24h, formatDateVN, formatDisplayDateWithWeekday24h } from '@/lib/utils';
import { toast } from 'sonner';

interface PriorityInfo {
  tier: number; // 1 (Hôm nay), 2 (Ngày mai), 3 (2-3 ngày), 4 (4-7 ngày), 5 (> 7 ngày)
  label: string;
  badgeClass: string;
  cardClass: string;
  dotColor: string;
  accentTextClass: string;
  priorityTitle: string;
  timeBoxClass: string;
  flameIcon?: boolean;
}

function getEventPriorityInfo(dateStr: string): PriorityInfo {
  const evDate = new Date(dateStr);
  const now = new Date();
  
  const evMidnight = new Date(evDate.getFullYear(), evDate.getMonth(), evDate.getDate()).getTime();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffDays = Math.round((evMidnight - nowMidnight) / (1000 * 60 * 60 * 24));

  // TẦNG 1: HÔM NAY (Khẩn cấp nhất - Giờ G Xuất Trận)
  if (diffDays <= 0) {
    return {
      tier: 1,
      label: '🔥 SHOW HÔM NAY - XUẤT QUÂN',
      badgeClass: 'bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-black font-black animate-pulse shadow-lg shadow-amber-500/40 border border-yellow-300 ring-2 ring-amber-400/40',
      cardClass: 'border-l-[10px] border-l-red-600 border-amber-500/60 bg-gradient-to-br from-red-950/20 via-amber-500/10 to-card ring-2 ring-amber-500/30 shadow-xl shadow-amber-500/10',
      dotColor: 'bg-red-500 animate-ping',
      accentTextClass: 'text-amber-600 dark:text-amber-400 font-black',
      priorityTitle: 'Hôm nay xuất trận • Kiểm tra quân tư trang & đạo cụ',
      timeBoxClass: 'bg-gradient-to-r from-red-500/20 to-amber-500/20 text-red-700 dark:text-amber-300 border-amber-500/50 shadow-inner',
      flameIcon: true,
    };
  }

  // TẦNG 2: NGÀY MAI (Chuẩn bị đạo cụ & tập dượt)
  if (diffDays === 1) {
    return {
      tier: 2,
      label: '⚡ NGÀY MAI DIỄN',
      badgeClass: 'bg-emerald-500 text-white dark:text-black font-black shadow-md shadow-emerald-500/30 border border-emerald-300',
      cardClass: 'border-l-[10px] border-l-emerald-500 border-emerald-500/50 bg-gradient-to-br from-emerald-950/15 via-emerald-500/5 to-card hover:border-emerald-500 shadow-md',
      dotColor: 'bg-emerald-500',
      accentTextClass: 'text-emerald-600 dark:text-emerald-400 font-bold',
      priorityTitle: 'Ngày mai diễn ra • Chuẩn bị sẵn sàng',
      timeBoxClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40',
    };
  }

  // TẦNG 3: 2 - 3 NGÀY TỚI (Sắp tới)
  if (diffDays >= 2 && diffDays <= 3) {
    return {
      tier: 3,
      label: `⏳ CÒN ${diffDays} NGÀY`,
      badgeClass: 'bg-blue-600 text-white font-bold border border-blue-400 shadow-xs',
      cardClass: 'border-l-[8px] border-l-blue-500 border-blue-500/40 bg-gradient-to-br from-blue-950/10 via-blue-500/5 to-card hover:border-blue-500 shadow-xs',
      dotColor: 'bg-blue-500',
      accentTextClass: 'text-blue-600 dark:text-blue-400 font-semibold',
      priorityTitle: `Sắp tới • Còn ${diffDays} ngày`,
      timeBoxClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
    };
  }

  // TẦNG 4: TRONG TUẦN NÀY (4 - 7 ngày tới)
  if (diffDays >= 4 && diffDays <= 7) {
    return {
      tier: 4,
      label: `📅 TUẦN NÀY (Còn ${diffDays} ngày)`,
      badgeClass: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 font-semibold border border-purple-500/40',
      cardClass: 'border-l-[8px] border-l-purple-500 border-purple-500/30 bg-gradient-to-br from-purple-950/10 via-purple-500/5 to-card hover:border-purple-500 shadow-2xs',
      dotColor: 'bg-purple-500',
      accentTextClass: 'text-purple-600 dark:text-purple-400 font-medium',
      priorityTitle: `Tuần này • Còn ${diffDays} ngày`,
      timeBoxClass: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    };
  }

  // TẦNG 5: LỊCH XA HƠN (> 7 ngày)
  return {
    tier: 5,
    label: `SẮP TỚI (Còn ${diffDays} ngày)`,
    badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 font-medium border-slate-500/30',
    cardClass: 'border-l-[8px] border-l-slate-400 dark:border-l-slate-600 border-border/80 bg-card hover:border-slate-400',
    dotColor: 'bg-slate-400',
    accentTextClass: 'text-slate-600 dark:text-slate-400',
    priorityTitle: `Kế hoạch sắp tới • Còn ${diffDays} ngày`,
    timeBoxClass: 'bg-muted/60 text-foreground border-border',
  };
}

// Phân loại icon và màu sắc vị trí lân sư rồng
function getPositionBadge(positionName: string) {
  const p = positionName.toLowerCase();
  if (p.includes('đầu') || p.includes('múa lân') || p.includes('múa sư')) {
    return {
      icon: '🦁',
      badgeClass: 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40 font-bold',
    };
  }
  if (p.includes('đuôi')) {
    return {
      icon: '🐾',
      badgeClass: 'bg-orange-500/20 text-orange-800 dark:text-orange-200 border-orange-500/40 font-bold',
    };
  }
  if (p.includes('trống') || p.includes('cổ')) {
    return {
      icon: '🥁',
      badgeClass: 'bg-red-500/20 text-red-800 dark:text-red-200 border-red-500/40 font-bold',
    };
  }
  if (p.includes('chiêng') || p.includes('xèng') || p.includes('chõm') || p.includes('bạt')) {
    return {
      icon: '🔔',
      badgeClass: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-200 border-yellow-500/40 font-semibold',
    };
  }
  if (p.includes('địa') || p.includes('thần tài')) {
    return {
      icon: '🎭',
      badgeClass: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/40 font-bold',
    };
  }
  if (p.includes('rồng')) {
    return {
      icon: '🐲',
      badgeClass: 'bg-purple-500/20 text-purple-800 dark:text-purple-200 border-purple-500/40 font-bold',
    };
  }
  return {
    icon: '⚔️',
    badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30',
  };
}

export default function PublicShowsPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data, isLoading, isFetching, refetch } = usePublicSchedules({
    search: search || undefined,
    filter,
  });

  const events = data?.events || [];
  const stats = data?.stats || { totalUpcoming: 0, todayEventsCount: 0, thisWeekEventsCount: 0 };

  const handleShareShow = async (event: PublicEventItem) => {
    const evDate = new Date(event.eventDate);
    const dateFormatted = formatDisplayDateWithWeekday24h(evDate);
    const timeFormatted = formatTime24h(evDate);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const showUrl = `${origin}/shows#show-${event.id}`;

    const memberLines =
      event.eventMembers && event.eventMembers.length > 0
        ? `\n👥 QUÂN SỐ BIỂU DIỄN (${event.eventMembers.length} anh em):\n` +
          event.eventMembers
            .map((m, idx) => `  ${idx + 1}. ${m.member.fullName} [${m.position.name}]`)
            .join('\n')
        : '';

    const shareText =
      `🦁 LỊCH DIỄN - CLB LÂN SƯ RỒNG NGA MY THƯỢNG 🦁\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🎪 Sự kiện: ${event.name} (${event.eventCode})\n` +
      `⏰ Thời gian: ${timeFormatted} - ${dateFormatted}\n` +
      `📍 Địa điểm: ${event.location}\n` +
      `${memberLines ? memberLines + '\n' : ''}` +
      (event.description ? `📝 Dặn dò: ${event.description}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🔗 Xem chi tiết & sơ đồ: ${showUrl}`;

    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedId(event.id);
      toast.success('Đã sao chép lịch diễn chuẩn đẹp để gửi Zalo / Messenger!');
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      toast.error('Không thể sao chép tự động');
    }
  };

  return (
    <div className="min-h-screen bg-radial from-amber-500/10 via-background to-background text-foreground flex flex-col selection:bg-amber-500 selection:text-black font-sans">
      {/* 1. Header Navigation Bar (Khí thế Lân Sư Rồng - Không có nút admin) */}
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-2xl border-b border-amber-500/30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative size-11 rounded-2xl overflow-hidden shadow-lg ring-2 ring-amber-500/50 shadow-amber-500/20 shrink-0">
              <Image
                src="/icon.jpg"
                alt="Logo Nga My Thượng"
                fill
                sizes="44px"
                className="object-cover"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm sm:text-lg tracking-tight bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 bg-clip-text text-transparent uppercase">
                  NGA MY THƯỢNG
                </span>
                <span className="text-xs">🦁</span>
                <Badge className="bg-red-600 text-white font-extrabold text-[9px] px-2 py-0.5 h-4 border-amber-400">
                  LÂN SƯ RỒNG
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block font-medium">
                Đoàn Lân Sư Rồng Nga My Thượng • Lịch Trình Biểu Diễn Toàn Đội
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 text-xs rounded-xl gap-1.5 border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 font-semibold"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin text-amber-500' : ''}`} />
              <span className="hidden sm:inline">Làm mới lịch</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section Phong Cách Hào Khí Lân Sư Rồng */}
      <section className="relative px-4 pt-6 pb-4 sm:pt-10 sm:pb-8 overflow-hidden bg-gradient-to-b from-amber-500/15 via-red-500/5 to-transparent border-b border-border/40">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="text-center space-y-2.5 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-red-600/15 via-amber-500/20 to-yellow-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs font-bold shadow-xs">
              <Sparkles className="size-3.5 fill-amber-400 text-amber-500 animate-spin" />
              <span>TRỐNG TRẬN VANG RỀN • NGHÊNH TÀI CHIÊU LỘC</span>
              <Sparkles className="size-3.5 fill-amber-400 text-amber-500" />
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground uppercase leading-tight">
              Lịch Biểu Diễn & Xuất Trận
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
              Lịch trình được sắp xếp theo <strong className="text-amber-600 dark:text-amber-400">thứ tự ưu tiên gần nhất</strong>. Anh em chú ý thời gian tập trung và chuẩn bị đầy đủ đạo cụ.
            </p>
          </div>

          {/* Quick Stats Grid Đậm Chất Lân Sư Rồng */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-3xl mx-auto pt-2">
            <Card className="rounded-2xl border border-amber-500/20 bg-card/80 backdrop-blur-md shadow-xs text-center p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1">
                <PartyPopper className="size-3 text-amber-500" />
                Tổng Show Sắp Tới
              </p>
              <p className="text-xl sm:text-3xl font-black text-foreground mt-0.5">
                {stats.totalUpcoming} <span className="text-xs font-normal text-muted-foreground">show</span>
              </p>
            </Card>

            <Card className="rounded-2xl border-2 border-red-500/50 bg-gradient-to-br from-red-600/20 via-amber-500/15 to-card backdrop-blur-md shadow-md shadow-red-500/10 text-center p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <Flame className="size-3.5 fill-red-500 text-red-500 animate-bounce" />
                Show Hôm Nay
              </p>
              <p className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-400 mt-0.5">
                {stats.todayEventsCount} <span className="text-xs font-normal text-muted-foreground">show</span>
              </p>
            </Card>

            <Card className="rounded-2xl border border-amber-500/20 bg-card/80 backdrop-blur-md shadow-xs text-center p-3 sm:p-4">
              <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-center gap-1">
                <Calendar className="size-3 text-blue-500" />
                Show Tuần Này
              </p>
              <p className="text-xl sm:text-3xl font-black text-foreground mt-0.5">
                {stats.thisWeekEventsCount} <span className="text-xs font-normal text-muted-foreground">show</span>
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. Search & Filter Bar */}
      <section className="px-4 py-2.5 sticky top-[57px] z-30 bg-background/95 backdrop-blur-2xl border-b border-amber-500/20 shadow-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={`h-8 text-xs rounded-xl px-3 font-bold shrink-0 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-sm shadow-amber-500/20'
                  : 'border-border/80'
              }`}
            >
              Tất cả ({stats.totalUpcoming})
            </Button>
            <Button
              variant={filter === 'today' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('today')}
              className={`h-8 text-xs rounded-xl px-3 font-bold shrink-0 ${
                filter === 'today'
                  ? 'bg-red-600 text-white shadow-sm shadow-red-500/30'
                  : 'border-red-500/30 text-red-600 dark:text-red-400'
              }`}
            >
              🔥 Hôm nay ({stats.todayEventsCount})
            </Button>
            <Button
              variant={filter === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('week')}
              className={`h-8 text-xs rounded-xl px-3 font-bold shrink-0 ${
                filter === 'week'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                  : 'border-border/80'
              }`}
            >
              ⚡ Tuần này ({stats.thisWeekEventsCount})
            </Button>
            <Button
              variant={filter === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('month')}
              className={`h-8 text-xs rounded-xl px-3 font-bold shrink-0 ${
                filter === 'month'
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'border-border/80'
              }`}
            >
              📅 Tháng này
            </Button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên show, địa chỉ, anh em tham gia..."
              className="h-8 pl-8 text-xs rounded-xl bg-card border-amber-500/30 focus-visible:ring-amber-500 w-full"
            />
          </div>
        </div>
      </section>

      {/* 4. Event List / Feed */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-5 space-y-4">
        {/* Chú giải mức độ ưu tiên màu sắc chuẩn Lân Sư Rồng */}
        <div className="flex items-center gap-2 overflow-x-auto text-[11px] text-muted-foreground pb-1 px-1 scrollbar-none">
          <span className="font-bold text-foreground shrink-0 flex items-center gap-1">
            <Flame className="size-3.5 text-amber-500" /> Thứ tự ưu tiên xuất trận:
          </span>
          <span className="inline-flex items-center gap-1.5 shrink-0 bg-red-600/15 text-red-700 dark:text-red-300 px-2.5 py-0.5 rounded-lg border border-red-500/40 font-black">
            <span className="size-2 rounded-full bg-red-500 animate-ping" /> Hôm nay (Khẩn cấp)
          </span>
          <span className="inline-flex items-center gap-1.5 shrink-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-lg border border-emerald-500/40 font-bold">
            <span className="size-2 rounded-full bg-emerald-500" /> Ngày mai
          </span>
          <span className="inline-flex items-center gap-1.5 shrink-0 bg-blue-500/15 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 rounded-lg border border-blue-500/40 font-semibold">
            <span className="size-2 rounded-full bg-blue-500" /> 2 - 3 ngày tới
          </span>
          <span className="inline-flex items-center gap-1.5 shrink-0 bg-purple-500/15 text-purple-700 dark:text-purple-300 px-2.5 py-0.5 rounded-lg border border-purple-500/40 font-medium">
            <span className="size-2 rounded-full bg-purple-500" /> Tuần này
          </span>
          <span className="inline-flex items-center gap-1.5 shrink-0 bg-slate-500/10 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg border border-slate-500/30">
            <span className="size-2 rounded-full bg-slate-400" /> &gt; 7 ngày
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-4 py-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-3xl bg-muted/40 animate-pulse border border-border/60" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card className="rounded-3xl border border-dashed border-amber-500/30 p-12 text-center space-y-3 bg-card/60 shadow-xs">
            <div className="size-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-red-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner text-3xl">
              🦁
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground">Không có lịch diễn nào</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                {search
                  ? `Không tìm thấy show diễn nào phù hợp với từ khóa "${search}".`
                  : 'Hiện tại chưa có show diễn nào sắp tới trong bộ lọc này. Anh em tranh thủ nghỉ ngơi và tập luyện múa lân nhé!'}
              </p>
            </div>
            {search && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch('')}
                className="text-xs rounded-xl mt-2 border-amber-500/30"
              >
                Xóa tìm kiếm
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => {
              const evDate = new Date(event.eventDate);
              const p = getEventPriorityInfo(event.eventDate);
              const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                event.location
              )}`;

              return (
                <Card
                  key={event.id}
                  id={`show-${event.id}`}
                  className={`rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl ${p.cardClass}`}
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Top Row: Priority Badge & Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[11px] px-3 py-0.5 rounded-full ${p.badgeClass}`}>
                          {p.label}
                        </Badge>
                        <span className="font-mono text-xs font-black text-amber-700 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30 shadow-2xs">
                          {event.eventCode}
                        </span>
                        {event.eventType && (
                          <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground border-amber-500/30 bg-amber-500/5">
                            {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                          </Badge>
                        )}
                        <span className="text-[11px] text-muted-foreground hidden sm:inline-block font-medium">
                          • {p.priorityTitle}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleShareShow(event)}
                        className="h-8 text-xs rounded-xl text-amber-700 dark:text-amber-300 hover:bg-amber-500/10 gap-1.5 px-3 bg-background/60 border border-amber-500/30 font-bold shadow-2xs"
                      >
                        {copiedId === event.id ? (
                          <>
                            <Check className="size-4 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Đã chép lịch</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="size-4 text-amber-500" />
                            <span>Gửi vào Zalo</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Main Info: Title, Time, Location */}
                    <div className="space-y-3.5">
                      <h2 className="text-lg sm:text-2xl font-black text-foreground tracking-tight leading-snug flex items-center gap-2">
                        <span>🦁</span>
                        <span>{event.name}</span>
                      </h2>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Time Box */}
                        <div className={`flex items-start gap-3 p-3.5 rounded-2xl border ${p.timeBoxClass}`}>
                          <div className="size-9 rounded-xl bg-background/90 flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-base">
                            ⏰
                          </div>
                          <div>
                            <p className="font-black text-lg tracking-tight">
                              {formatTime24h(evDate)}
                            </p>
                            <p className="text-xs font-semibold capitalize opacity-95">
                              {formatDisplayDateWithWeekday24h(evDate)}
                            </p>
                          </div>
                        </div>

                        {/* Location Box */}
                        <div className="flex items-start justify-between gap-2 p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="size-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs text-base">
                              📍
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground text-xs sm:text-sm truncate" title={event.location}>
                                {event.location}
                              </p>
                              <p className="text-[11px] text-muted-foreground font-medium">Địa điểm biểu diễn</p>
                            </div>
                          </div>

                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="h-8 text-[11px] rounded-xl shrink-0 gap-1 px-2.5 border-blue-500/40 text-blue-600 hover:bg-blue-500/10 font-bold shadow-2xs"
                          >
                            <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                              <Compass className="size-3.5" />
                              Chỉ đường
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Personnel Assigned Breakdown - Đặc Trưng Lân Sư Rồng */}
                    {event.eventMembers && event.eventMembers.length > 0 && (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-foreground flex items-center gap-1.5">
                            <Users className="size-4 text-amber-500" />
                            Quân số xuất trận ({event.eventMembers.length} anh em):
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {event.eventMembers.map((m) => {
                            const posInfo = getPositionBadge(m.position.name);
                            return (
                              <div
                                key={m.id}
                                className="flex flex-col p-2.5 rounded-2xl bg-background/80 border border-border/80 shadow-2xs hover:border-amber-500/40 transition-colors"
                              >
                                <span className="font-bold text-xs text-foreground truncate" title={m.member.fullName}>
                                  {m.member.fullName}
                                </span>
                                <div className="mt-1 flex items-center gap-1">
                                  <span className="text-xs">{posInfo.icon}</span>
                                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md border truncate ${posInfo.badgeClass}`}>
                                    {m.position.name}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Description / Instructions */}
                    {event.description && (
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-start gap-2.5 text-foreground/95">
                        <FileText className="size-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-700 dark:text-amber-300">Dặn dò của đoàn: </strong>
                          {event.description}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. Footer Lân Sư Rồng Thuần Túy (Không có nút đăng nhập/admin) */}
      <footer className="mt-auto border-t border-amber-500/30 bg-card/60 backdrop-blur-md py-8 px-4 text-center text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center justify-center gap-2">
            <span className="text-base">🦁</span>
            <p className="font-black text-sm text-foreground tracking-wide uppercase">
              CLB LÂN SƯ RỒNG NGA MY THƯỢNG
            </p>
            <span className="text-base">🐲</span>
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Khai Quang Điểm Nhãn • Trống Vang Rền Trời • Nghênh Tài Chiêu Lộc • An Khang Thịnh Vượng
          </p>
          <p className="text-[11px] text-muted-foreground/80 pt-1">
            Hệ thống lịch trình biểu diễn trực tuyến dành cho toàn thể thành viên và quý khách hàng.
          </p>
        </div>
      </footer>
    </div>
  );
}

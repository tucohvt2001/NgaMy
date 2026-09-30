'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Wallet,
  Calendar,
  Search,
  Users,
  CreditCard,
  QrCode,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  RefreshCw,
  Share2,
  Copy,
  Check,
  Building2,
  CalendarDays,
  Flame,
  Award,
  Layers,
  ChevronRight,
  ExternalLink,
  DollarSign,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  User,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePublicSalaries } from '@/hooks/usePublicSalaries';
import {
  PublicSalaryMemberItem,
  PublicSalaryEvent,
  PublicMemberOption,
} from '@/services/publicSalary.service';
import { formatTime24h, formatDateVN, formatDisplayDateWithWeekday24h } from '@/lib/utils';
import { toast } from 'sonner';

function formatCurrency(val: number): string {
  return (val || 0).toLocaleString('vi-VN') + ' đ';
}

// Lấy ngày đầu tháng hiện tại dạng YYYY-MM-DD
function getFirstDayOfCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

// Lấy ngày hôm nay dạng YYYY-MM-DD
function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper lấy màu sắc badge cho từng vị trí múa lân sư rồng
function getRoleBadgeStyle(role: string) {
  const r = (role || '').toLowerCase();
  if (r.includes('đầu') || r.includes('múa lân') || r.includes('múa sư')) {
    return {
      icon: '🦁',
      badgeClass: 'bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40 font-bold',
    };
  }
  if (r.includes('đuôi')) {
    return {
      icon: '🐾',
      badgeClass: 'bg-orange-500/20 text-orange-800 dark:text-orange-200 border-orange-500/40 font-bold',
    };
  }
  if (r.includes('trống') || r.includes('cổ')) {
    return {
      icon: '🥁',
      badgeClass: 'bg-red-500/20 text-red-800 dark:text-red-200 border-red-500/40 font-bold',
    };
  }
  if (r.includes('chiêng') || r.includes('xèng') || r.includes('chõm') || r.includes('bạt')) {
    return {
      icon: '🔔',
      badgeClass: 'bg-yellow-500/20 text-yellow-800 dark:text-yellow-200 border-yellow-500/40 font-semibold',
    };
  }
  if (r.includes('địa') || r.includes('thần tài')) {
    return {
      icon: '🎭',
      badgeClass: 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/40 font-bold',
    };
  }
  if (r.includes('rồng')) {
    return {
      icon: '🐲',
      badgeClass: 'bg-purple-500/20 text-purple-800 dark:text-purple-200 border-purple-500/40 font-bold',
    };
  }
  return {
    icon: '⚔️',
    badgeClass: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 font-medium',
  };
}

function PublicPayrollContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Khởi tạo bộ lọc mặc định: từ đầu tháng hiện tại đến hôm nay
  const [fromDate, setFromDate] = useState<string>(() => {
    return searchParams.get('fromDate') || getFirstDayOfCurrentMonth();
  });
  const [toDate, setToDate] = useState<string>(() => {
    return searchParams.get('toDate') || getTodayString();
  });
  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    return searchParams.get('memberId') || 'ALL';
  });
  const [eventSearch, setEventSearch] = useState<string>('');
  const [memberComboboxSearch, setMemberComboboxSearch] = useState<string>('');

  // State cho Modal QR thanh toán
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrMember, setQrMember] = useState<PublicSalaryMemberItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Chuẩn bị query params cho API
  const queryParams = useMemo(() => {
    return {
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      memberId: selectedMemberId !== 'ALL' ? selectedMemberId : undefined,
    };
  }, [fromDate, toDate, selectedMemberId]);

  const { data, isLoading, isFetching, refetch } = usePublicSalaries(queryParams);

  const members = data?.members || [];
  const summary = data?.summary || {
    totalMembers: 0,
    activeMembersWithEarnings: 0,
    grandTotalAmount: 0,
    grandPaidAmount: 0,
    grandRemainingAmount: 0,
    grandTotalEvents: 0,
  };
  const membersList: PublicMemberOption[] = data?.membersList || [];

  // Đồng bộ hóa params lên URL để người dùng có thể copy và chia sẻ link
  useEffect(() => {
    const params = new URLSearchParams();
    if (fromDate) params.set('fromDate', fromDate);
    if (toDate) params.set('toDate', toDate);
    if (selectedMemberId && selectedMemberId !== 'ALL') params.set('memberId', selectedMemberId);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [fromDate, toDate, selectedMemberId]);

  // Thành viên đang được chọn (nếu chọn cụ thể 1 người)
  const currentMember = useMemo(() => {
    if (selectedMemberId === 'ALL') return null;
    return members.find((m) => m.memberId === selectedMemberId) || null;
  }, [members, selectedMemberId]);

  // Danh sách show của thành viên được chọn (có lọc theo ô tìm kiếm show)
  const filteredMemberEvents = useMemo(() => {
    if (!currentMember) return [];
    if (!eventSearch.trim()) return currentMember.events;

    const q = eventSearch.toLowerCase().trim();
    return currentMember.events.filter(
      (ev) =>
        ev.eventName.toLowerCase().includes(q) ||
        ev.eventCode.toLowerCase().includes(q) ||
        ev.location.toLowerCase().includes(q) ||
        ev.roles.some((r) => r.toLowerCase().includes(q))
    );
  }, [currentMember, eventSearch]);

  // Danh sách thành viên cho Combobox (hỗ trợ filter search text)
  const filteredMemberList = useMemo(() => {
    if (!memberComboboxSearch.trim()) return membersList;
    const q = memberComboboxSearch.toLowerCase().trim();
    return membersList.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.memberCode.toLowerCase().includes(q) ||
        (m.phone && m.phone.includes(q)) ||
        m.teams.some((t) => t.toLowerCase().includes(q))
    );
  }, [membersList, memberComboboxSearch]);

  // Xử lý các nút chọn nhanh khoảng thời gian
  const handleQuickPreset = (preset: 'THIS_MONTH' | 'TODAY' | 'LAST_7_DAYS' | 'LAST_MONTH' | 'THIS_YEAR' | 'ALL_TIME') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    if (preset === 'THIS_MONTH') {
      setFromDate(getFirstDayOfCurrentMonth());
      setToDate(getTodayString());
    } else if (preset === 'TODAY') {
      const todayStr = getTodayString();
      setFromDate(todayStr);
      setToDate(todayStr);
    } else if (preset === 'LAST_7_DAYS') {
      const past = new Date();
      past.setDate(past.getDate() - 7);
      setFromDate(`${past.getFullYear()}-${pad(past.getMonth() + 1)}-${pad(past.getDate())}`);
      setToDate(getTodayString());
    } else if (preset === 'LAST_MONTH') {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      setFromDate(`${firstDayLastMonth.getFullYear()}-${pad(firstDayLastMonth.getMonth() + 1)}-01`);
      setToDate(`${lastDayLastMonth.getFullYear()}-${pad(lastDayLastMonth.getMonth() + 1)}-${pad(lastDayLastMonth.getDate())}`);
    } else if (preset === 'THIS_YEAR') {
      setFromDate(`${now.getFullYear()}-01-01`);
      setToDate(getTodayString());
    } else if (preset === 'ALL_TIME') {
      setFromDate('');
      setToDate('');
    }
  };

  // Mở modal VietQR
  const handleOpenQrModal = (member: PublicSalaryMemberItem) => {
    if (!member.bankAccount) {
      toast.error('Thành viên này chưa cập nhật số tài khoản ngân hàng');
      return;
    }
    setQrMember(member);
    setQrModalOpen(true);
  };

  // Sao chép văn bản
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    toast.success(`Đã sao chép ${label}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Chia sẻ link bảng lương
  const handleShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Đã sao chép liên kết bảng lương! Bạn có thể gửi link cho các thành viên.');
  };

  // Sao chép bản tóm tắt bảng lương gửi Zalo / Messenger
  const handleCopySummaryText = () => {
    if (!currentMember) return;

    const fromText = fromDate ? formatDateVN(new Date(fromDate)) : 'Bắt đầu';
    const toText = toDate ? formatDateVN(new Date(toDate)) : 'Hiện tại';

    let text = `🦁 BẢNG LƯƠNG & THÙ LAO - THỂ THAO NGA MY\n`;
    text += `👤 Thành viên: ${currentMember.fullName} (${currentMember.memberCode})\n`;
    text += `📅 Giai đoạn: ${fromText} - ${toText}\n`;
    text += `──────────────\n`;
    text += `🎪 Tổng số show: ${currentMember.totalEvents} show\n`;
    text += `💰 Tổng thù lao: ${formatCurrency(currentMember.totalAmount)}\n`;
    text += `💳 Đã thanh toán: ${formatCurrency(currentMember.paidAmount)}\n`;
    text += `⏳ Còn lại: ${formatCurrency(currentMember.remainingAmount)}\n`;

    if (currentMember.bankAccount) {
      text += `──────────────\n`;
      text += `🏦 STK: ${currentMember.bankAccount} (${currentMember.bankName || currentMember.bankCode || 'Ngân hàng'})\n`;
      text += `Tên chủ TK: ${currentMember.fullName}\n`;
    }

    if (currentMember.events.length > 0) {
      text += `──────────────\n`;
      text += `📋 Chi tiết các show:\n`;
      currentMember.events.forEach((ev, i) => {
        text += `${i + 1}. ${ev.eventName} (${formatDateVN(new Date(ev.eventDate))}) - ${ev.roles.join(', ')}: ${formatCurrency(ev.amount)}\n`;
      });
    }

    navigator.clipboard.writeText(text);
    toast.success('Đã sao chép nội dung bảng lương thành công để gửi Zalo / Tin nhắn!');
  };

  // Tính toán VietQR URL nếu có modal
  const vietQrUrl = useMemo(() => {
    if (!qrMember || !qrMember.bankAccount) return null;
    const bankIdentifier = qrMember.bankBin || qrMember.bankCode || qrMember.bankName || 'MB';
    const accountNumber = qrMember.bankAccount;
    const amount = qrMember.remainingAmount > 0 ? qrMember.remainingAmount : qrMember.totalAmount;
    const fromText = fromDate ? fromDate.split('-').slice(1).join('/') : '';
    const toText = toDate ? toDate.split('-').slice(1).join('/') : '';
    const transferNote = `Tien cong Nga My ${qrMember.fullName} ${fromText}-${toText}`.trim();
    const accountName = qrMember.fullName;

    return `https://img.vietqr.io/image/${bankIdentifier}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(
      transferNote
    )}&accountName=${encodeURIComponent(accountName)}`;
  }, [qrMember, fromDate, toDate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-amber-950/5 to-background text-foreground pb-20 selection:bg-amber-500 selection:text-black">
      {/* 1. Header Đậm Chất Thể Thao Nga My */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-amber-500/25 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Logo & Tên đoàn */}
          <div className="flex items-center gap-3">
            <Link href="/shows" className="flex items-center gap-2.5 group">
              <div className="relative shrink-0">
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 opacity-75 blur-[2px] group-hover:opacity-100 transition-opacity" />
                <Image
                  src="/logo.jpg"
                  alt="Thể Thao Nga My"
                  width={38}
                  height={38}
                  className="relative rounded-full ring-2 ring-amber-400 object-cover"
                />
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm sm:text-base font-black tracking-tight text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors uppercase">
                    Thể Thao Nga My
                  </span>
                  <Badge className="bg-red-600 text-white font-black text-[9px] px-1.5 py-0 h-4 border-amber-400 hidden sm:inline-flex">
                    LÂN SƯ RỒNG
                  </Badge>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
                  Bảng Lương & Thù Lao Biểu Diễn Công Khai
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation & Action buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8 sm:h-9 text-xs rounded-xl border-amber-500/30 hover:bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold"
            >
              <Link href="/shows">
                <CalendarDays className="size-3.5 mr-1" />
                <span className="hidden sm:inline">Lịch biểu diễn</span>
                <span className="sm:hidden">Lịch</span>
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              className="h-8 sm:h-9 text-xs rounded-xl border-border hover:bg-muted font-medium"
              title="Chia sẻ liên kết bảng lương"
            >
              <Share2 className="size-3.5 sm:mr-1" />
              <span className="hidden md:inline">Chia sẻ</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-8 sm:h-9 px-2 text-xs rounded-xl hover:bg-amber-500/10 text-muted-foreground hover:text-foreground"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`size-3.5 ${isFetching ? 'animate-spin text-amber-500' : ''}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Hero Banner & Tiêu đề trang */}
      <section className="relative px-3 sm:px-6 pt-5 pb-4 overflow-hidden bg-gradient-to-b from-amber-500/15 via-red-500/5 to-transparent border-b border-border/40">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="text-center space-y-1.5 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-red-600/15 via-amber-500/20 to-yellow-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-200 text-[11px] font-bold shadow-xs">
              <Sparkles className="size-3 text-amber-500 animate-spin" />
              <span>MINH BẠCH • CHÍNH XÁC • KỊP THỜI</span>
              <Sparkles className="size-3 text-amber-500" />
            </div>

            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-foreground uppercase">
              Bảng Lương & Thù Lao Biểu Diễn
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Tra cứu chi tiết số show, tiền công từng buổi diễn và tiến độ chi trả thù lao theo từng thành viên.
            </p>
          </div>
        </div>
      </section>

      {/* 3. BỘ LỌC CHÍNH (Combobox chọn người & Bộ lọc Từ ngày - Đến ngày) */}
      <section className="px-3 sm:px-6 py-4 sticky top-16 z-30 bg-background/95 backdrop-blur-2xl border-b border-amber-500/20 shadow-sm">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end">
            {/* A. Combobox chọn thành viên (chiếm 5 cols trên Desktop) */}
            <div className="md:col-span-5 space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Users className="size-3.5 text-amber-500" />
                <span>Thành viên:</span>
              </label>

              <Select
                value={selectedMemberId}
                onValueChange={(val) => {
                  setSelectedMemberId(val);
                }}
              >
                <SelectTrigger className="h-10 rounded-xl bg-card border-amber-500/40 focus:ring-amber-500 text-xs sm:text-sm font-semibold shadow-xs">
                  <SelectValue placeholder="Chọn thành viên để tra cứu" />
                </SelectTrigger>
                <SelectContent className="max-h-80 rounded-2xl border-amber-500/30">
                  {/* Ô tìm kiếm nhanh trong Combobox */}
                  <div className="p-2 border-b border-border/60 sticky top-0 bg-popover z-10">
                    <div className="relative">
                      <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Tìm tên, mã số, SĐT..."
                        value={memberComboboxSearch}
                        onChange={(e) => setMemberComboboxSearch(e.target.value)}
                        className="h-8 pl-8 text-xs rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>

                  {/* Lựa chọn xem toàn bộ */}
                  <SelectItem value="ALL" className="py-2.5 font-bold cursor-pointer text-amber-700 dark:text-amber-300">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 font-black text-xs">
                        🌟
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-bold">Tất cả thành viên (Toàn đội)</p>
                        <p className="text-[10px] text-muted-foreground font-normal">
                          Xem bảng tổng hợp danh sách & công nợ toàn CLB
                        </p>
                      </div>
                    </div>
                  </SelectItem>

                  {/* Danh sách thành viên */}
                  {filteredMemberList.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Không tìm thấy thành viên phù hợp
                    </div>
                  ) : (
                    filteredMemberList.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="py-2 cursor-pointer">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-7 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-black font-extrabold text-[11px] shrink-0 shadow-xs">
                            {m.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-left leading-tight">
                            <p className="text-xs sm:text-sm font-bold text-foreground">
                              {m.fullName}{' '}
                              <span className="text-[10px] text-muted-foreground font-normal">
                                ({m.memberCode})
                              </span>
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {m.teams.length > 0 ? m.teams.join(', ') : 'Đoàn Lân Nga My'}
                              {m.positions.length > 0 && ` • ${m.positions.join(', ')}`}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* B. Bộ lọc Từ ngày (chiếm 3 cols) */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-amber-500" />
                <span>Từ ngày:</span>
              </label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-10 rounded-xl bg-card border-amber-500/30 focus-visible:ring-amber-500 text-xs font-semibold cursor-pointer"
                title="Lọc từ ngày"
              />
            </div>

            {/* C. Bộ lọc Đến ngày (chiếm 3 cols) */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-amber-500" />
                <span>Đến ngày:</span>
              </label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-10 rounded-xl bg-card border-amber-500/30 focus-visible:ring-amber-500 text-xs font-semibold cursor-pointer"
                title="Lọc đến ngày"
              />
            </div>

            {/* D. Nút Reset / Hôm nay (chiếm 1 col) */}
            <div className="md:col-span-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickPreset('THIS_MONTH')}
                className="h-10 w-full rounded-xl border-amber-500/30 hover:bg-amber-500/10 text-xs font-bold text-amber-700 dark:text-amber-300"
                title="Đặt lại về tháng hiện tại"
              >
                Mặc định
              </Button>
            </div>
          </div>

          {/* Preset Buttons chọn nhanh */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
            <span className="text-[11px] font-semibold text-muted-foreground shrink-0 mr-1 flex items-center gap-1">
              <Filter className="size-3" /> Chọn nhanh:
            </span>
            <button
              onClick={() => handleQuickPreset('THIS_MONTH')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-[11px] font-bold whitespace-nowrap transition-colors"
            >
              🌟 Tháng này (Mặc định)
            </button>
            <button
              onClick={() => handleQuickPreset('TODAY')}
              className="px-2.5 py-1 rounded-lg bg-card hover:bg-muted border border-border text-foreground text-[11px] font-medium whitespace-nowrap transition-colors"
            >
              ⚡ Hôm nay
            </button>
            <button
              onClick={() => handleQuickPreset('LAST_7_DAYS')}
              className="px-2.5 py-1 rounded-lg bg-card hover:bg-muted border border-border text-foreground text-[11px] font-medium whitespace-nowrap transition-colors"
            >
              📅 7 ngày qua
            </button>
            <button
              onClick={() => handleQuickPreset('LAST_MONTH')}
              className="px-2.5 py-1 rounded-lg bg-card hover:bg-muted border border-border text-foreground text-[11px] font-medium whitespace-nowrap transition-colors"
            >
              ⏪ Tháng trước
            </button>
            <button
              onClick={() => handleQuickPreset('THIS_YEAR')}
              className="px-2.5 py-1 rounded-lg bg-card hover:bg-muted border border-border text-foreground text-[11px] font-medium whitespace-nowrap transition-colors"
            >
              📆 Năm nay
            </button>
            <button
              onClick={() => handleQuickPreset('ALL_TIME')}
              className="px-2.5 py-1 rounded-lg bg-card hover:bg-muted border border-border text-foreground text-[11px] font-medium whitespace-nowrap transition-colors"
            >
              🌐 Tất cả
            </button>
          </div>
        </div>
      </section>

      {/* 4. NỘI DUNG HIỂN THỊ CHÍNH */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-5 space-y-6">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="inline-block size-10 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground">
              Đang tải dữ liệu thù lao & bảng lương...
            </p>
          </div>
        ) : selectedMemberId !== 'ALL' && currentMember ? (
          /* ========================================================================= */
          /* CHẾ ĐỘ XEM 1 THÀNH VIÊN CỤ THỂ                                            */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* A. Profile Card & VietQR Quick Pay */}
            <div className="relative overflow-hidden rounded-3xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-card to-card p-4 sm:p-6 shadow-lg shadow-amber-500/5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Thông tin cá nhân */}
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <div className="flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 via-amber-500 to-yellow-400 text-black font-black text-2xl shadow-md">
                      {currentMember.fullName.charAt(0).toUpperCase()}
                    </div>
                    <span className="absolute -bottom-1 -right-1 size-4 rounded-full bg-emerald-500 ring-2 ring-background" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-2xl font-black text-foreground">
                        {currentMember.fullName}
                      </h2>
                      <Badge className="bg-amber-500/20 text-amber-800 dark:text-amber-200 border-amber-500/40 font-bold text-xs">
                        Mã: {currentMember.memberCode}
                      </Badge>
                      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-bold text-xs">
                        Tổng: {formatCurrency(currentMember.totalAmount)} • {currentMember.totalEvents} show
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span>{currentMember.teams.join(', ') || 'Đoàn Lân Nga My'}</span>
                      {currentMember.positions.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-foreground">
                            {currentMember.positions.join(', ')}
                          </span>
                        </>
                      )}
                      {currentMember.phone && (
                        <>
                          <span>•</span>
                          <span>📞 {currentMember.phone}</span>
                        </>
                      )}
                    </div>

                    {/* Thông tin ngân hàng */}
                    {currentMember.bankAccount ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium pt-0.5">
                        <Building2 className="size-3.5" />
                        <span>
                          {currentMember.bankName || currentMember.bankCode || 'Ngân hàng'}:{' '}
                          <strong className="font-bold">{currentMember.bankAccount}</strong>
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        ⚠️ Chưa liên kết số tài khoản ngân hàng
                      </p>
                    )}
                  </div>
                </div>

                {/* Các nút thao tác nhanh cho thành viên này */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                  {currentMember.bankAccount && (
                    <Button
                      onClick={() => handleOpenQrModal(currentMember)}
                      className="rounded-xl font-bold gap-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-yellow-500 text-black hover:opacity-95 shadow-md shadow-amber-500/20 text-xs sm:text-sm h-10 px-3.5"
                    >
                      <QrCode className="size-4" />
                      <span>Mã QR VietQR</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onClick={handleCopySummaryText}
                    className="rounded-xl border-amber-500/30 hover:bg-amber-500/10 text-xs font-semibold h-10 px-3"
                    title="Sao chép tóm tắt để gửi tin nhắn"
                  >
                    <Copy className="size-3.5 mr-1" />
                    <span>Copy tóm tắt</span>
                  </Button>
                </div>
              </div>
            </div>



            {/* C. Danh sách chi tiết các show diễn của thành viên này */}
            <Card className="rounded-3xl border border-border/80 bg-card/85 backdrop-blur-md overflow-hidden shadow-sm">
              <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <CalendarDays className="size-5 text-amber-500" />
                    Chi Tiết Các Show Biểu Diễn ({filteredMemberEvents.length})
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Danh sách các sự kiện mà {currentMember.fullName} đã tham gia trong khoảng thời gian đã chọn
                  </p>
                </div>

                {/* Ô tìm kiếm show */}
                <div className="relative w-full sm:w-64">
                  <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Lọc tên show, địa điểm..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="h-8.5 pl-8.5 text-xs rounded-xl"
                  />
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {filteredMemberEvents.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      <Calendar className="size-6" />
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      Không có show diễn nào trong khoảng thời gian này
                    </p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      Hãy thử nới rộng khoảng thời gian lọc Từ ngày - Đến ngày hoặc chọn nút &quot;Năm nay&quot; để tra cứu thêm.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* View Table cho Tablet & Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow>
                            <TableHead className="w-12 text-center text-xs font-bold">STT</TableHead>
                            <TableHead className="text-xs font-bold">Thời Gian & Sự Kiện</TableHead>
                            <TableHead className="text-xs font-bold">Địa Điểm</TableHead>
                            <TableHead className="text-xs font-bold">Vị Trí Biểu Diễn</TableHead>
                            <TableHead className="text-right text-xs font-bold">Mức Thù Lao</TableHead>
                            <TableHead className="w-28 text-center text-xs font-bold">Trạng Thái</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMemberEvents.map((ev, idx) => {
                            const evDate = new Date(ev.eventDate);
                            return (
                              <TableRow key={ev.eventId} className="hover:bg-amber-500/5 transition-colors">
                                <TableCell className="text-center font-bold text-xs text-muted-foreground">
                                  {idx + 1}
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-foreground hover:text-amber-600 transition-colors">
                                      {ev.eventName}
                                    </p>
                                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                      <span className="font-semibold text-amber-700 dark:text-amber-300">
                                        📅 {formatDisplayDateWithWeekday24h(evDate)}{ev.endTime ? ` - ${formatTime24h(ev.endTime)}` : ''}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground/80 font-mono">
                                      Mã: {ev.eventCode}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground max-w-xs truncate">
                                    <MapPin className="size-3.5 shrink-0 text-red-500" />
                                    <span className="truncate">{ev.location || 'Chưa cập nhật'}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {ev.roles.map((role, rIdx) => {
                                      const badgeInfo = getRoleBadgeStyle(role);
                                      return (
                                        <Badge
                                          key={rIdx}
                                          variant="outline"
                                          className={`text-[10px] px-2 py-0.5 rounded-md ${badgeInfo.badgeClass}`}
                                        >
                                          <span className="mr-1">{badgeInfo.icon}</span>
                                          {role}
                                        </Badge>
                                      );
                                    })}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                                    {formatCurrency(ev.amount)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  {ev.status === 'COMPLETED' ? (
                                    <Badge className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/40 text-[10px]">
                                      Hoàn thành
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                      {ev.status === 'SCHEDULED' ? 'Đã lên lịch' : ev.status}
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* View Card List cho Mobile */}
                    <div className="md:hidden divide-y divide-border/60">
                      {filteredMemberEvents.map((ev, idx) => {
                        const evDate = new Date(ev.eventDate);
                        return (
                          <div key={ev.eventId} className="p-3.5 space-y-2 hover:bg-muted/30 transition-colors">
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <p className="text-xs font-bold text-foreground">
                                  <span className="text-amber-600 font-mono mr-1">#{idx + 1}</span>
                                  {ev.eventName}
                                </p>
                                <p className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
                                  📅 {formatDisplayDateWithWeekday24h(evDate)}{ev.endTime ? ` - ${formatTime24h(ev.endTime)}` : ''}
                                </p>
                              </div>
                              <span className="text-sm font-black text-amber-600 dark:text-amber-400 shrink-0">
                                {formatCurrency(ev.amount)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="size-3 text-red-500 shrink-0" />
                              <span className="truncate">{ev.location}</span>
                            </div>

                            <div className="flex items-center justify-between pt-1">
                              <div className="flex flex-wrap gap-1">
                                {ev.roles.map((role, rIdx) => {
                                  const badgeInfo = getRoleBadgeStyle(role);
                                  return (
                                    <Badge
                                      key={rIdx}
                                      variant="outline"
                                      className={`text-[9px] px-1.5 py-0 ${badgeInfo.badgeClass}`}
                                    >
                                      {badgeInfo.icon} {role}
                                    </Badge>
                                  );
                                })}
                              </div>

                              {ev.status === 'COMPLETED' ? (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                                  <Check className="size-3" /> Hoàn tất
                                </span>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">
                                  {ev.status}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* ========================================================================= */
          /* CHẾ ĐỘ XEM "TẤT CẢ THÀNH VIÊN" (TỔNG HỢP TOÀN ĐỘI)                        */
          /* ========================================================================= */
          <div className="space-y-6">
            {/* A. Thẻ Tổng Hợp Tài Chính Toàn Đội */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <Card className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-card to-card shadow-xs p-3.5 sm:p-4">
                <p className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Wallet className="size-3.5 text-amber-500" />
                  Tổng Quỹ Lương
                </p>
                <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {formatCurrency(summary.grandTotalAmount)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Toàn đội trong kỳ đã chọn
                </p>
              </Card>

              <Card className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-card to-card shadow-xs p-3.5 sm:p-4">
                <p className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  Tổng Đã Thanh Toán
                </p>
                <p className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                  {formatCurrency(summary.grandPaidAmount)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Đã chi trả thành viên
                </p>
              </Card>

              <Card className="rounded-2xl border-2 border-red-500/40 bg-gradient-to-br from-red-600/15 via-amber-500/10 to-card shadow-md shadow-red-500/5 p-3.5 sm:p-4">
                <p className="text-[11px] sm:text-xs font-black text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 text-red-500" />
                  Tổng Còn Lại (Công Nợ)
                </p>
                <p className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 mt-1">
                  {formatCurrency(summary.grandRemainingAmount)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Cần chi trả cho anh em
                </p>
              </Card>

              <Card className="rounded-2xl border border-border bg-card shadow-xs p-3.5 sm:p-4">
                <p className="text-[11px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="size-3.5 text-amber-500" />
                  Thành Viên Tham Gia
                </p>
                <p className="text-xl sm:text-2xl font-black text-foreground mt-1">
                  {summary.activeMembersWithEarnings}{' '}
                  <span className="text-xs font-normal text-muted-foreground">/ {summary.totalMembers} người</span>
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Tổng {summary.grandTotalEvents} lượt diễn
                </p>
              </Card>
            </div>

            {/* B. Bảng Danh Sách Bảng Lương Tất Cả Thành Viên */}
            <Card className="rounded-3xl border border-border/80 bg-card/85 backdrop-blur-md overflow-hidden shadow-sm">
              <CardHeader className="p-4 sm:p-5 border-b border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <Users className="size-5 text-amber-500" />
                    Bảng Thù Lao Các Thành Viên ({members.length})
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Bấm vào bất kỳ thành viên nào để xem chi tiết danh sách từng show diễn và mức tiền công của họ
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {members.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <Users className="size-10 text-muted-foreground mx-auto" />
                    <p className="text-sm font-semibold text-foreground">
                      Không có dữ liệu thành viên trong khoảng thời gian này
                    </p>
                  </div>
                ) : (
                  <>
                    {/* View Table cho Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow>
                            <TableHead className="w-12 text-center text-xs font-bold">STT</TableHead>
                            <TableHead className="text-xs font-bold">Thành Viên</TableHead>
                            <TableHead className="text-xs font-bold">Đội Nhóm & Vị Trí</TableHead>
                            <TableHead className="text-center text-xs font-bold">Số Show</TableHead>
                            <TableHead className="text-right text-xs font-bold">Tổng Thù Lao</TableHead>
                            <TableHead className="text-right text-xs font-bold">Đã Nhận</TableHead>
                            <TableHead className="text-right text-xs font-bold">Còn Lại</TableHead>
                            <TableHead className="w-32 text-center text-xs font-bold">Thao Tác</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map((m, idx) => (
                            <TableRow
                              key={m.memberId}
                              className="hover:bg-amber-500/5 transition-colors cursor-pointer"
                              onClick={() => setSelectedMemberId(m.memberId)}
                            >
                              <TableCell className="text-center font-bold text-xs text-muted-foreground">
                                {idx + 1}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2.5">
                                  <div className="flex size-8 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-black font-extrabold text-xs shrink-0 shadow-xs">
                                    {m.fullName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-foreground hover:text-amber-600 transition-colors">
                                      {m.fullName}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                      Mã: {m.memberCode}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-xs space-y-0.5">
                                  <p className="text-muted-foreground">{m.teams.join(', ') || 'Đoàn Lân Nga My'}</p>
                                  {m.positions.length > 0 && (
                                    <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">
                                      {m.positions.join(', ')}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="font-bold text-xs">
                                  {m.totalEvents} show
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-black text-xs sm:text-sm text-foreground">
                                {formatCurrency(m.totalAmount)}
                              </TableCell>
                              <TableCell className="text-right font-bold text-xs text-emerald-700 dark:text-emerald-400">
                                {formatCurrency(m.paidAmount)}
                              </TableCell>
                              <TableCell className="text-right">
                                {m.remainingAmount > 0 ? (
                                  <span className="text-xs sm:text-sm font-black text-red-600 dark:text-red-400">
                                    {formatCurrency(m.remainingAmount)}
                                  </span>
                                ) : m.totalAmount > 0 ? (
                                  <Badge className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/40 text-[10px]">
                                    Đã nhận đủ
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedMemberId(m.memberId)}
                                    className="h-7 text-[11px] rounded-lg border-amber-500/30 hover:bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold px-2"
                                  >
                                    Xem show <ChevronRight className="size-3 ml-0.5" />
                                  </Button>
                                  {m.bankAccount && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleOpenQrModal(m)}
                                      className="size-7 p-0 rounded-lg text-amber-600 hover:bg-amber-500/10"
                                      title="Mã VietQR"
                                    >
                                      <QrCode className="size-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* View Card List cho Mobile */}
                    <div className="md:hidden divide-y divide-border/60">
                      {members.map((m, idx) => (
                        <div
                          key={m.memberId}
                          className="p-3.5 space-y-2.5 hover:bg-muted/30 transition-colors"
                          onClick={() => setSelectedMemberId(m.memberId)}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 text-black font-black text-xs shrink-0 shadow-xs">
                                {m.fullName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-foreground">
                                  {m.fullName}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                  {m.memberCode} • {m.teams.join(', ') || 'CLB Nga My'}
                                </p>
                              </div>
                            </div>

                            <Badge variant="outline" className="font-bold text-[10px]">
                              {m.totalEvents} show
                            </Badge>
                          </div>

                          <div className="grid grid-cols-3 gap-2 bg-muted/40 rounded-xl p-2 text-center text-xs">
                            <div>
                              <p className="text-[9px] text-muted-foreground uppercase font-bold">Tổng thù lao</p>
                              <p className="font-bold text-foreground">{formatCurrency(m.totalAmount)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-emerald-700 dark:text-emerald-400 uppercase font-bold">Đã nhận</p>
                              <p className="font-bold text-emerald-700 dark:text-emerald-400">{formatCurrency(m.paidAmount)}</p>
                            </div>
                            <div>
                              <p className="text-[9px] text-red-600 dark:text-red-400 uppercase font-bold">Còn lại</p>
                              <p className="font-bold text-red-600 dark:text-red-400">{formatCurrency(m.remainingAmount)}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-0.5 text-xs">
                            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center">
                              Bấm để xem {m.totalEvents} show <ArrowRight className="size-3 ml-1" />
                            </span>

                            {m.bankAccount && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenQrModal(m);
                                }}
                                className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-500/10 px-2 py-1 rounded-lg"
                              >
                                <QrCode className="size-3" /> QR Pay
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* 5. MODAL VIETQR THANH TOÁN TIỀN CÔNG */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden rounded-3xl border-border/80 shadow-2xl flex flex-col max-h-[90vh]">
          {/* Header Modal */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/15 via-background to-orange-500/10 border-b border-border/70 shrink-0">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                <QrCode className="size-5 text-amber-500" />
                Quét Mã VietQR Chuyển Khoản
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                Dùng App Ngân hàng bất kỳ để quét mã chuyển tiền công chính xác cho thành viên
              </p>
            </DialogHeader>
          </div>

          {qrMember && (
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Box thông tin người nhận */}
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-amber-800 dark:text-amber-200 font-bold">
                    {qrMember.fullName} ({qrMember.memberCode})
                  </p>
                  <Badge className="bg-red-600 text-white font-bold text-[10px]">
                    {qrMember.remainingAmount > 0 ? 'Cần thanh toán' : 'Đã thanh toán đủ'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Số tiền cần thanh toán:</span>
                  <span className="text-base font-black text-red-600 dark:text-red-400">
                    {formatCurrency(qrMember.remainingAmount > 0 ? qrMember.remainingAmount : qrMember.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Ảnh Mã QR VietQR */}
              {vietQrUrl ? (
                <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-border/80 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={vietQrUrl}
                    alt={`VietQR ${qrMember.fullName}`}
                    className="max-h-72 w-auto object-contain rounded-xl"
                  />
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    Mã QR chuẩn VietQR 24/7 • Tự động điền số tiền & nội dung
                  </p>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  Không thể tạo mã VietQR do thiếu thông tin ngân hàng.
                </div>
              )}

              {/* Sao chép số tài khoản & ngân hàng */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/60 border border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Ngân hàng:</p>
                    <p className="font-bold text-foreground">
                      {qrMember.bankName || qrMember.bankCode || 'Ngân hàng'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(qrMember.bankName || qrMember.bankCode || '', 'tên ngân hàng')}
                    className="h-7 text-[11px]"
                  >
                    {copiedField === 'tên ngân hàng' ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/60 border border-border">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Số tài khoản:</p>
                    <p className="font-bold text-foreground text-sm font-mono tracking-wider">
                      {qrMember.bankAccount}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopy(qrMember.bankAccount || '', 'số tài khoản')}
                    className="h-7 text-[11px]"
                  >
                    {copiedField === 'số tài khoản' ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PublicPayrollPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="text-center space-y-3">
            <div className="inline-block size-10 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground">
              Đang chuẩn bị bảng lương Thể Thao Nga My...
            </p>
          </div>
        </div>
      }
    >
      <PublicPayrollContent />
    </Suspense>
  );
}

'use client';

import Image from 'next/image';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { STATUS_LABELS } from '@/types/enums';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDashboardCharts, useDashboardSummary } from '@/hooks/useDashboard';
import { useTransactionSummary } from '@/hooks/useTransactions';
import { useAuthStore } from '@/stores/authStore';
import {
  Users,
  UsersRound,
  CalendarDays,
  Wallet,
  UserCheck,
  Activity,
  ReceiptText,
  MapPin,
  Clock,
  ArrowRight,
  PlusCircle,
  ClipboardCheck,
  TrendingUp,
  Award,
  DollarSign,
  Layers,
  ChevronRight,
} from 'lucide-react';

function formatCurrency(value: number) {
  return value.toLocaleString('vi-VN') + ' đ';
}

const STATUS_COLORS = ['#16a34a', '#f59e0b', '#dc2626'];

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const canReadFinance = user?.permissions.includes('finance:read');
  const currentYear = new Date().getFullYear();

  const { data: summary, isLoading } = useDashboardSummary();
  const { data: charts, isLoading: loadingCharts } = useDashboardCharts(currentYear);
  const { data: financeSummary } = useTransactionSummary();

  const memberStatusData = charts
    ? [
      { name: 'Đang hoạt động', value: charts.memberStatus.active },
      { name: 'Tạm nghỉ', value: charts.memberStatus.onLeave },
      { name: 'Ngừng hoạt động', value: charts.memberStatus.inactive },
    ].filter((item) => item.value > 0)
    : [];

  const attendanceTotal = charts?.attendanceRate.total ?? 0;
  const attendancePresent = charts?.attendanceRate.present ?? 0;
  const attendanceRate = charts?.attendanceRate.rate ?? 0;

  return (
    <div className="space-y-6 pb-8">
      {/* 1. HERO BANNER CHÀO MỪNG & LỐI TẮT NHANH */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-800 via-red-700 to-amber-700 p-6 sm:p-8 text-white shadow-xl shadow-red-950/15 border border-red-500/30">
        <div className="absolute -right-10 -bottom-10 size-64 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-amber-400/60 blur-xs" />
              <Image
                src="/logo.jpg"
                alt="Nga My Thượng"
                width={64}
                height={64}
                className="relative rounded-full ring-2 ring-amber-300 shadow-xl shrink-0"
                priority
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/15 text-amber-200 text-[11px] font-semibold mb-1 backdrop-blur-xs">
                Thể Thao Nga My • Bảng điều khiển quản trị
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Tổng Quan Hoạt Động CLB
              </h1>
              <p className="text-xs sm:text-sm text-red-100/90 max-w-xl mt-0.5">
                Theo dõi toàn diện nhân sự, lịch diễn, chấm công và tài chính CLB Nga My Thượng
              </p>
            </div>
          </div>

          {/* Lối tắt thao tác nhanh */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              size="sm"
              className="bg-amber-400 hover:bg-amber-300 text-black font-bold shadow-md shadow-amber-500/20 text-xs rounded-xl h-9"
            >
              <Link href="/schedules">
                <PlusCircle className="size-3.5 mr-1" /> Tạo Lịch Diễn
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="bg-black/30 hover:bg-black/50 text-white border-white/20 text-xs rounded-xl h-9"
            >
              <Link href="/attendance">
                <ClipboardCheck className="size-3.5 mr-1" /> Chấm Công
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="bg-black/30 hover:bg-black/50 text-white border-white/20 text-xs rounded-xl h-9"
            >
              <Link href="/assignments">
                <Users className="size-3.5 mr-1" /> Phân Công
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. 6 THẺ KPI CHỈ SỐ QUAN TRỌNG (GRID METRICS) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {/* Tổng thành viên */}
        <Card className="border-border/70 bg-gradient-to-br from-blue-500/[0.04] via-card to-card shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Tổng nhân sự</span>
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Users className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-foreground">
                {isLoading ? '...' : summary?.totalMembers ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <UserCheck className="size-3 text-emerald-500" />
                <strong>{summary?.activeMembers ?? 0}</strong> đang hoạt động
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Số đội lân */}
        <Card className="border-border/70 bg-gradient-to-br from-amber-500/[0.04] via-card to-card shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Đội biểu diễn</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <UsersRound className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-foreground">
                {isLoading ? '...' : summary?.totalTeams ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Đội lân, sư, rồng, trống
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Lịch diễn tháng này */}
        <Card className="border-border/70 bg-gradient-to-br from-red-500/[0.04] via-card to-card shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Show tháng này</span>
              <div className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
                <CalendarDays className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-red-600 dark:text-red-400">
                {isLoading ? '...' : summary?.eventsThisMonth ?? 0}
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Activity className="size-3 text-red-500" />
                <strong>{summary?.participantsThisMonth ?? 0}</strong> lượt tham gia
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tỷ lệ chuyên cần */}
        <Card className="border-border/70 bg-gradient-to-br from-emerald-500/[0.04] via-card to-card shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Chuyên cần</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Award className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                {loadingCharts ? '...' : `${attendanceRate}%`}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {attendancePresent}/{attendanceTotal} lượt có mặt
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tiền công tháng */}
        <Card className="border-border/70 bg-gradient-to-br from-indigo-500/[0.04] via-card to-card shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Tiền công tháng</span>
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Wallet className="size-4" />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-xl font-black tracking-tight text-foreground truncate">
                {isLoading ? '...' : formatCurrency(summary?.totalSalaryThisMonth ?? 0)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Chi tiền công diễn viên
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tồn quỹ CLB */}
        <Card className="border-border/70 bg-gradient-to-br from-amber-500/[0.06] via-card to-card shadow-xs hover:shadow-md transition-shadow">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Tồn quỹ hiện tại</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <DollarSign className="size-4" />
              </div>
            </div>
            <div>
              <p className={`text-lg sm:text-xl font-black tracking-tight truncate ${(financeSummary?.netBalance ?? 0) >= 0 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600'}`}>
                {financeSummary ? formatCurrency(financeSummary.netBalance) : '...'}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Số dư tiền mặt & tài khoản
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. KHU VỰC BIỂU ĐỒ TRỰC QUAN (CHARTS & LEGENDS) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Biểu đồ 1: Số buổi diễn theo 12 tháng */}
        <Card className="border-border/70 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <CalendarDays className="size-4 text-blue-600" />
                Số Buổi Diễn Theo Tháng ({currentYear})
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Thống kê số lượng show diễn biểu diễn thành công trong từng tháng
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.eventsByMonth ?? []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" tickFormatter={(m) => `T${m}`} tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={(m) => `Tháng ${m}/${currentYear}`}
                  formatter={(v) => [`${v} buổi diễn`, 'Số show']}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="top"
                  height={32}
                  formatter={(value) => <span className="text-xs font-semibold text-foreground">{value}</span>}
                />
                <Bar dataKey="count" fill="#3b82f6" name="Số buổi diễn (show)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Biểu đồ 2: Tiền công theo 12 tháng */}
        <Card className="border-border/70 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Wallet className="size-4 text-emerald-600" />
                Tổng Tiền Công Theo Tháng ({currentYear})
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Ngân sách tiền công biểu diễn đã phân bổ và chi trả cho thành viên
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts?.salaryByMonth ?? []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" tickFormatter={(m) => `T${m}`} tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}Tr`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  labelFormatter={(m) => `Tháng ${m}/${currentYear}`}
                  formatter={(v) => [formatCurrency(Number(v)), 'Tiền công']}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="top"
                  height={32}
                  formatter={(value) => <span className="text-xs font-semibold text-foreground">{value}</span>}
                />
                <Bar dataKey="total" fill="#10b981" name="Tiền công chi trả (VNĐ)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Biểu đồ 3: Cơ cấu & Trạng thái Thành viên */}
        <Card className="border-border/70 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="size-4 text-amber-600" />
                Cơ Cấu Trạng Thái Thành Viên
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Tỷ lệ phân bố thành viên đang hoạt động, tạm nghỉ và ngừng sinh hoạt
            </CardDescription>
          </CardHeader>
          <CardContent className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={memberStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  label={({ percent }) => `${(((percent as number) || 0) * 100).toFixed(0)}%`}
                >
                  {memberStatusData.map((_, index) => (
                    <Cell key={index} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`${value} thành viên`, `${name}`]}
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs font-semibold text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Biểu đồ 4: Dòng tiền Thu - Chi Sổ Quỹ (Nếu có quyền xem tài chính) */}
        {canReadFinance ? (
          <Card className="border-border/70 shadow-xs">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ReceiptText className="size-4 text-emerald-600" />
                  Dòng Tiền Thu & Chi Sổ Quỹ ({currentYear})
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                So sánh tổng số tiền thu vào (doanh thu/show) và chi ra (tiền công/mua sắm) theo tháng
              </CardDescription>
            </CardHeader>
            <CardContent className="h-72 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeSummary?.monthlyStats ?? []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="month" tickFormatter={(m) => `T${m}`} tick={{ fontSize: 12 }} />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1000000).toFixed(0)}Tr`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    labelFormatter={(m) => `Tháng ${m}/${currentYear}`}
                    formatter={(v, name) => [formatCurrency(Number(v)), name === 'income' ? 'Tổng Thu' : 'Tổng Chi']}
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
                  />
                  <Legend
                    verticalAlign="top"
                    height={32}
                    formatter={(value) => <span className="text-xs font-semibold text-foreground">{value}</span>}
                  />
                  <Bar dataKey="income" fill="#16a34a" name="Tổng Thu vào (VNĐ)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#dc2626" name="Tổng Chi ra (VNĐ)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ) : (
          /* Widget thay thế nếu không có quyền tài chính: Điểm danh & Chuyên cần */
          <Card className="border-border/70 shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Award className="size-4 text-amber-600" />
                Chỉ Số Chuyên Cần & Tham Gia Luyện Tập
              </CardTitle>
              <CardDescription className="text-xs">
                Mức độ chấp hành kỷ luật và tham gia các buổi tập luyện, biểu diễn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pb-6">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Tỷ lệ có mặt trung bình</p>
                  <p className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {attendanceRate}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Tổng số lượt điểm danh</p>
                  <p className="text-lg font-bold text-foreground mt-0.5">
                    {attendancePresent} / {attendanceTotal}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>Mức độ hoàn thành mục tiêu chuyên cần:</span>
                  <span className="text-emerald-600 font-bold">{attendanceRate >= 80 ? 'Xuất sắc' : 'Cần cải thiện'}</span>
                </div>
                <div className="h-3 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, attendanceRate)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 4. 5 LỊCH DIỄN SẮP TỚI (UPCOMING SCHEDULES) */}
      <Card className="border-border/70 shadow-xs">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
              <CalendarDays className="size-5 text-amber-600 dark:text-amber-400" />
              5 Lịch Diễn Gần Nhất
            </CardTitle>
            <CardDescription className="text-xs">
              Danh sách các buổi diễn sắp tới cần chuẩn bị nhân sự và phương tiện
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild className="text-xs gap-1.5 rounded-xl self-start sm:self-auto">
            <Link href="/schedules">
              Xem toàn bộ lịch diễn <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {!summary?.upcomingEvents || summary.upcomingEvents.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Chưa có lịch diễn nào được ghi nhận trong hệ thống.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {summary.upcomingEvents.map((ev) => {
                const evDate = new Date(ev.eventDate);
                const isPast = evDate.getTime() < new Date().setHours(0, 0, 0, 0);

                return (
                  <div
                    key={ev.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      {/* Box ngày tháng dạng Calendar */}
                      <div className={`flex flex-col items-center justify-center size-13 rounded-2xl border shrink-0 text-center shadow-xs ${isPast
                        ? 'bg-muted/40 border-border text-muted-foreground'
                        : 'bg-gradient-to-b from-amber-500/15 to-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-400'
                        }`}>
                        <span className="text-[10px] font-extrabold uppercase tracking-wide">
                          T{evDate.getMonth() + 1}
                        </span>
                        <span className="text-lg font-black leading-none">
                          {evDate.getDate()}
                        </span>
                      </div>

                      {/* Thông tin sự kiện */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-foreground hover:text-amber-600 transition-colors">
                            {ev.name}
                          </span>
                          <span className="text-[11px] font-mono font-semibold text-muted-foreground px-1.5 py-0.5 rounded-md bg-muted">
                            {ev.eventCode}
                          </span>
                          <Badge
                            variant={ev.status === 'CANCELLED' ? 'destructive' : isPast ? 'outline' : 'secondary'}
                            className="text-[10px] px-2 py-0.5"
                          >
                            {isPast ? 'Đã diễn ra' : STATUS_LABELS[ev.status] || ev.status}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium text-foreground/80">
                            <Clock className="size-3.5 text-amber-500" />
                            {evDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3.5 text-amber-500" />
                            {ev.location}
                          </span>
                          {ev.customerName && (
                            <span>
                              Khách hàng: <strong>{ev.customerName}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Số lượng người & Nút hành động */}
                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-xs font-bold text-foreground flex items-center gap-1 justify-end">
                          <Users className="size-3.5 text-amber-500" />
                          {ev._count?.eventMembers ?? 0} người
                        </div>
                        {ev.contractValue ? (
                          <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(ev.contractValue)}
                          </div>
                        ) : null}
                      </div>

                      <Button size="sm" variant="outline" asChild className="h-8 text-xs rounded-xl gap-1">
                        <Link href={`/assignments?eventId=${ev.id}`}>
                          Phân công <ChevronRight className="size-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


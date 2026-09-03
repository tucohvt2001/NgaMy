'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Plus,
  Pencil,
  Ban,
  Search,
  ClipboardList,
  Coins,
  CheckCircle2,
  AlertCircle,
  ReceiptText,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Calendar,
  Sparkles,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  CheckCheck,
  Clock,
  Layers,
  QrCode,
  Star,
} from 'lucide-react';
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
  AreaChart,
  Area,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationBar } from '@/components/tables/PaginationBar';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { ConfirmDialog } from '@/components/forms/ConfirmDialog';
import { EventFormDialog } from '@/components/forms/EventFormDialog';
import { EventSettlementDialog } from '@/components/forms/EventSettlementDialog';
import { EventReviewShareDialog } from '@/components/forms/EventReviewShareDialog';
import { useCancelEvent, useCreateEvent, useEvents, useUpdateEvent, useEventStats } from '@/hooks/useEvents';
import { EventItem } from '@/types/models';
import { EVENT_STATUSES, STATUS_LABELS, EVENT_TYPE_LABELS } from '@/types/enums';
import { EventInput } from '@/services/event.service';

const ALL_VALUE = '__all__';

function formatCurrency(val: number) {
  return val.toLocaleString('vi-VN') + ' đ';
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN');
}

export default function SchedulesPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showCharts, setShowCharts] = useState(true);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [settlementFilter, setSettlementFilter] = useState<string>(ALL_VALUE);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [confirmEvent, setConfirmEvent] = useState<EventItem | null>(null);
  const [settlementEvent, setSettlementEvent] = useState<EventItem | null>(null);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [reviewShareEvent, setReviewShareEvent] = useState<EventItem | null>(null);

  const { data, isLoading } = useEvents({
    page,
    limit: 10,
    search: search || undefined,
    status: status as EventItem['status'] | undefined,
  });

  const { data: stats, isLoading: loadingStats } = useEventStats(selectedYear);

  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const cancelMutation = useCancelEvent();

  const handleSubmit = (values: EventInput) => {
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, input: values }, { onSuccess: () => setFormOpen(false) });
    } else {
      createMutation.mutate(values, { onSuccess: () => setFormOpen(false) });
    }
  };

  const filteredItems = data?.items.filter((item) => {
    const isSettled =
      (item._count?.transactions ?? 0) > 0 ||
      (item._count?.salaryConfigs ?? 0) > 0 ||
      item.status === 'COMPLETED';
    if (settlementFilter === 'SETTLED') return isSettled;
    if (settlementFilter === 'UNSETTLED') return !isSettled;
    return true;
  }) ?? [];

  return (
    <div className="space-y-5 pb-8">
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-semibold mb-1">
            🎪 Kế hoạch biểu diễn & Hoạt động CLB
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Lịch Diễn Show</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Quản lý kế hoạch, điều phối nhân sự, dự toán và phân tích hiệu suất các show diễn
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCharts((prev) => !prev)}
            className="gap-1.5 text-xs h-9 rounded-xl border-dashed"
          >
            <BarChart3 className="size-4 text-amber-600 dark:text-amber-400" />
            {showCharts ? 'Ẩn biểu đồ' : 'Xem biểu đồ phân tích'}
            {showCharts ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>

          <Button
            onClick={() => {
              setEditingEvent(null);
              setFormOpen(true);
            }}
            className="h-9 text-xs rounded-xl shadow-xs"
          >
            <Plus className="mr-1.5 size-4" /> Tạo Sự Kiện Mới
          </Button>
        </div>
      </div>

      {/* 2. KHU VỰC THỐNG KÊ & BIỂU ĐỒ (ANALYTICS & CHARTS) */}
      {showCharts && (
        <div className="space-y-4 animate-in fade-in-50 duration-300">
          {/* KPI Mini Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card className="rounded-2xl border bg-gradient-to-br from-amber-500/10 via-background to-card shadow-2xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tổng số show ({selectedYear})</p>
                  <p className="text-2xl font-black tracking-tight text-foreground mt-0.5">
                    {stats?.totalEvents ?? 0} <span className="text-xs font-normal text-muted-foreground">show</span>
                  </p>
                </div>
                <div className="size-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Calendar className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-gradient-to-br from-emerald-500/10 via-background to-card shadow-2xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Đã hoàn thành</p>
                  <p className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {stats?.completedEvents ?? 0} <span className="text-xs font-normal text-muted-foreground">show</span>
                  </p>
                </div>
                <div className="size-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCheck className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-gradient-to-br from-blue-500/10 via-background to-card shadow-2xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Sắp diễn / Đang chạy</p>
                  <p className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400 mt-0.5">
                    {stats?.upcomingEvents ?? 0} <span className="text-xs font-normal text-muted-foreground">show</span>
                  </p>
                </div>
                <div className="size-10 rounded-2xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Clock className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border bg-gradient-to-br from-purple-500/10 via-background to-card shadow-2xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Doanh thu hợp đồng</p>
                  <p className="text-xl sm:text-2xl font-black tracking-tight text-purple-600 dark:text-purple-400 mt-0.5">
                    {formatCurrency(stats?.totalContractValue ?? 0)}
                  </p>
                </div>
                <div className="size-10 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Coins className="size-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Biểu đồ chi tiết (Grid 2 cột) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Cột 1: Biểu đồ Cột Show diễn & Doanh thu theo tháng (2/3 width) */}
            <Card className="lg:col-span-2 rounded-2xl shadow-2xs">
              <CardHeader className="p-4 sm:p-5 pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                    <TrendingUp className="size-4 text-amber-600" />
                    Tần Suất Show Diễn & Doanh Thu Theo Tháng ({selectedYear})
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Theo dõi số lượng sự kiện biểu diễn và tổng giá trị hợp đồng từng tháng
                  </CardDescription>
                </div>
                <Select
                  value={String(selectedYear)}
                  onValueChange={(val) => setSelectedYear(Number(val))}
                >
                  <SelectTrigger className="w-24 h-8 text-xs rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0">
                <div className="h-64 sm:h-72 w-full pt-2">
                  {stats?.monthlyStats ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.monthlyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                        <XAxis dataKey="monthLabel" tickLine={false} tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="rounded-xl border bg-popover/95 p-3 text-xs shadow-xl backdrop-blur-xs space-y-1.5">
                                  <p className="font-bold text-foreground">Tháng {data.month}/{selectedYear}</p>
                                  <div className="flex items-center justify-between gap-4 text-amber-600">
                                    <span>Tổng số show:</span>
                                    <strong className="font-bold">{data.eventsCount} show</strong>
                                  </div>
                                  <div className="flex items-center justify-between gap-4 text-emerald-600">
                                    <span>Đã hoàn thành:</span>
                                    <strong>{data.completedCount} show</strong>
                                  </div>
                                  <div className="flex items-center justify-between gap-4 text-purple-600 border-t pt-1">
                                    <span>Giá trị hợp đồng:</span>
                                    <strong>{formatCurrency(data.contractValue)}</strong>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend
                          wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                          formatter={(value) => {
                            if (value === 'eventsCount') return 'Tổng số show';
                            if (value === 'completedCount') return 'Show hoàn thành';
                            return value;
                          }}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="eventsCount"
                          fill="#f59e0b"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="completedCount"
                          fill="#10b981"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      Đang tải dữ liệu biểu đồ...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cột 2: Biểu đồ Tròn Phân bố Trạng thái & Tỷ lệ Dự toán (1/3 width) */}
            <Card className="rounded-2xl shadow-2xs flex flex-col justify-between">
              <CardHeader className="p-4 sm:p-5 pb-2">
                <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
                  <PieIcon className="size-4 text-purple-600" />
                  Cơ Cấu Trạng Thái Show
                </CardTitle>
                <CardDescription className="text-xs">
                  Phân bố trạng thái và tỷ lệ hoàn tất dự toán
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
                {/* Donut Chart Trạng Thái */}
                <div className="h-44 w-full relative flex items-center justify-center">
                  {stats?.statusDistribution && stats.statusDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stats.statusDistribution}
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {stats.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any, name: any) => [`${value} show`, name]}
                          contentStyle={{ borderRadius: '12px', fontSize: '11px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-xs text-muted-foreground">Chưa có dữ liệu show diễn</div>
                  )}
                </div>

                {/* Progress Mini: Tình trạng dự toán */}
                <div className="p-3 rounded-xl bg-muted/40 border space-y-2 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <ReceiptText className="size-3.5 text-emerald-600" /> Tỷ lệ đã dự toán sổ quỹ:
                    </span>
                    <span className="font-bold text-foreground">
                      {stats?.totalEvents && stats.totalEvents > 0
                        ? `${Math.round(((stats.settledEvents || 0) / stats.totalEvents) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${stats?.totalEvents ? ((stats.settledEvents || 0) / stats.totalEvents) * 100 : 0}%`,
                      }}
                      title={`Đã dự toán: ${stats?.settledEvents || 0}`}
                    />
                    <div
                      className="bg-amber-500 transition-all duration-500"
                      style={{
                        width: `${stats?.totalEvents ? ((stats.unsettledEvents || 0) / stats.totalEvents) * 100 : 0}%`,
                      }}
                      title={`Chưa dự toán: ${stats?.unsettledEvents || 0}`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground pt-0.5">
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                      🟢 Đã dự toán: {stats?.settledEvents ?? 0}
                    </span>
                    <span className="text-amber-700 dark:text-amber-400 font-medium">
                      🟡 Chưa dự toán: {stats?.unsettledEvents ?? 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 3. BỘ LỌC TÌM KIẾM & BẢNG LỊCH DIỄN */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên sự kiện, mã sự kiện hoặc địa điểm..."
            className="pl-9 rounded-xl"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status ?? ALL_VALUE}
          onValueChange={(v) => {
            setStatus(v === ALL_VALUE ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48 rounded-xl">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tất cả trạng thái</SelectItem>
            {EVENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={settlementFilter}
          onValueChange={(v) => {
            setSettlementFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48 rounded-xl">
            <SelectValue placeholder="Tất cả dự toán" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tất cả dự toán</SelectItem>
            <SelectItem value="UNSETTLED">🟡 Chưa dự toán</SelectItem>
            <SelectItem value="SETTLED">🟢 Đã dự toán</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground px-3 py-2 bg-muted/20 rounded-xl border">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-foreground">Thời gian diễn:</span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-500/20" />
            <strong className="text-emerald-700 dark:text-emerald-400">Sắp tới</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-amber-500 inline-block ring-2 ring-amber-500/20" />
            <strong className="text-amber-700 dark:text-amber-400">Hôm nay</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-slate-400 inline-block" />
            <span>Đã qua</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground">Sổ quỹ:</span>
          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="size-3.5" /> Đã dự toán
          </span>
          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
            <AlertCircle className="size-3.5" /> Chưa dự toán
          </span>
        </div>
      </div>

      <div className="rounded-md border bg-background overflow-hidden">
        {isLoading ? (
          <LoadingState />
        ) : !data || filteredItems.length === 0 ? (
          <EmptyState label="Chưa có sự kiện nào phù hợp" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-32">Mã</TableHead>
                  <TableHead>Tên sự kiện</TableHead>
                  <TableHead className="w-44">Ngày giờ diễn</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead className="w-28">Số người</TableHead>
                  <TableHead className="w-36">Dự toán thu chi</TableHead>
                  <TableHead className="w-28">Trạng thái</TableHead>
                  <TableHead className="text-right w-40">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((event) => {
                  const evDate = new Date(event.eventDate);
                  const now = new Date();
                  const isToday = evDate.toDateString() === now.toDateString();
                  const isPast = !isToday && evDate.getTime() < now.getTime();
                  const isUpcoming = !isToday && evDate.getTime() > now.getTime();
                  const isSettled =
                    (event._count?.transactions ?? 0) > 0 ||
                    (event._count?.salaryConfigs ?? 0) > 0 ||
                    event.status === 'COMPLETED';

                  return (
                    <TableRow
                      key={event.id}
                      className={`transition-colors ${
                        isToday
                          ? 'bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-l-amber-500'
                          : isUpcoming
                          ? 'bg-emerald-500/5 hover:bg-emerald-500/10 border-l-4 border-l-emerald-500 font-medium'
                          : 'opacity-75 hover:opacity-100 bg-muted/20 hover:bg-muted/40 border-l-4 border-l-slate-300 dark:border-l-slate-700'
                      }`}
                    >
                      <TableCell className="font-mono text-xs">
                        <span className={isUpcoming ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}>
                          {event.eventCode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-foreground">{event.name}</span>
                          {event.eventType && event.eventType !== 'OTHER' && (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30"
                            >
                              {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                            </Badge>
                          )}
                        </div>
                        {event.customerName && (
                          <div className="text-[11px] text-muted-foreground">
                            Khách: {event.customerName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">
                            {evDate.toLocaleDateString('vi-VN')}
                          </span>
                          {isToday ? (
                            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[9px] px-1 py-0 h-4">
                              Hôm nay
                            </Badge>
                          ) : isUpcoming ? (
                            <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-[9px] px-1 py-0 h-4">
                              Sắp tới
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 text-[9px] px-1 py-0 h-4">
                              Đã qua
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {evDate.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{event.location}</TableCell>
                      <TableCell className="text-xs">{event._count?.eventMembers ?? 0} người</TableCell>
                      <TableCell>
                        {isSettled ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] gap-1 font-semibold">
                            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                            Đã dự toán {(event._count?.transactions ?? 0) > 0 ? `(${event._count?.transactions} phiếu)` : ''}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] gap-1 font-medium bg-amber-50/60 dark:bg-amber-950/20">
                            <AlertCircle className="size-3 text-amber-600 dark:text-amber-400" />
                            Chưa dự toán
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={event.status === 'CANCELLED' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {STATUS_LABELS[event.status]}
                        </Badge>
                      </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSettlementEvent(event);
                          setSettlementOpen(true);
                        }}
                        className={
                          isSettled
                            ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        }
                        title={isSettled ? 'Xem / Lập thêm dự toán show' : 'Dự toán show & chia tiền công'}
                      >
                        <Coins className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setReviewShareEvent(event)}
                        className="text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        title="Mã QR & Link đánh giá cho khách"
                      >
                        <QrCode className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/assignments?eventId=${event.id}`} title="Phân công nhân sự">
                          <ClipboardList className="size-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingEvent(event);
                          setFormOpen(true);
                        }}
                        title="Chỉnh sửa sự kiện"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmEvent(event)}
                        title="Hủy sự kiện"
                      >
                        <Ban className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            </Table>
            <PaginationBar
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editingEvent}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <EventSettlementDialog
        open={settlementOpen}
        onOpenChange={setSettlementOpen}
        event={settlementEvent}
      />

      <EventReviewShareDialog
        open={Boolean(reviewShareEvent)}
        onOpenChange={(open) => !open && setReviewShareEvent(null)}
        event={reviewShareEvent}
      />

      <ConfirmDialog
        open={!!confirmEvent}
        onOpenChange={(open) => !open && setConfirmEvent(null)}
        title="Hủy sự kiện"
        description={`Bạn có chắc muốn hủy sự kiện "${confirmEvent?.name}"?`}
        onConfirm={() => {
          if (confirmEvent) {
            cancelMutation.mutate(confirmEvent.id, { onSuccess: () => setConfirmEvent(null) });
          }
        }}
        isLoading={cancelMutation.isPending}
      />
    </div>
  );
}

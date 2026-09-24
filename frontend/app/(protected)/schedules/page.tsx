'use client';

import { useState, useRef, useMemo } from 'react';
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
  FileText,
  MoreHorizontal,
  Globe,
  MapPin,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { toast } from 'sonner';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatTime24h, formatDateVN } from '@/lib/utils';
import { PaginationBar } from '@/components/tables/PaginationBar';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { ConfirmDialog } from '@/components/forms/ConfirmDialog';
import { EventFormDialog } from '@/components/forms/EventFormDialog';
import { EventSettlementDialog } from '@/components/forms/EventSettlementDialog';
import { EventReviewShareDialog } from '@/components/forms/EventReviewShareDialog';
import {
  useCancelEvent,
  useDeleteEvent,
  useCreateEvent,
  useEvents,
  useUpdateEvent,
  useEventStats,
} from '@/hooks/useEvents';
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

function getDayRange(dateStr: string): { fromDate?: string; toDate?: string } {
  if (!dateStr) return {};
  const parts = dateStr.split('-');
  if (parts.length !== 3) return {};
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const start = new Date(year, month, day, 0, 0, 0, 0);
  const end = new Date(year, month, day, 23, 59, 59, 999);

  return {
    fromDate: start.toISOString(),
    toDate: end.toISOString(),
  };
}

export default function SchedulesPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [showCharts, setShowCharts] = useState(true);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [confirmEvent, setConfirmEvent] = useState<EventItem | null>(null);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<EventItem | null>(null);
  const [settlementEvent, setSettlementEvent] = useState<EventItem | null>(null);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [reviewShareEvent, setReviewShareEvent] = useState<EventItem | null>(null);

  const dateRange = useMemo(() => getDayRange(selectedDate), [selectedDate]);

  const { data, isLoading } = useEvents({
    page,
    limit,
    search: search || undefined,
    status: status as EventItem['status'] | undefined,
    fromDate: dateRange.fromDate,
    toDate: dateRange.toDate,
  });

  const { data: stats, isLoading: loadingStats } = useEventStats(selectedYear);

  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const cancelMutation = useCancelEvent();
  const deleteMutation = useDeleteEvent();

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleRowTouchStart = (ev: EventItem) => {
    longPressTimerRef.current = setTimeout(() => {
      setEditingEvent(ev);
      setFormOpen(true);
    }, 500);
  };

  const handleRowTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleSubmit = (values: EventInput) => {
    if (editingEvent) {
      updateMutation.mutate({ id: editingEvent.id, input: values }, { onSuccess: () => setFormOpen(false) });
    } else {
      createMutation.mutate(values, { onSuccess: () => setFormOpen(false) });
    }
  };

  const handleApproveEvent = (event: EventItem) => {
    updateMutation.mutate(
      { id: event.id, input: { status: 'CONFIRMED' } },
      {
        onSuccess: () => {
          toast.success(`Đã duyệt show "${event.name}" thành công!`);
        },
      }
    );
  };

  const filteredItems = data?.items ?? [];

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
            asChild
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-9 rounded-xl border-blue-500/30 text-blue-600 hover:bg-blue-500/10 font-semibold"
          >
            <Link href="/shows" target="_blank">
              <Globe className="size-3.5" />
              <span className="hidden sm:inline">Trang lịch diễn công khai</span>
              <span className="sm:hidden">Trang công khai</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCharts((prev) => !prev)}
            className="gap-1.5 text-xs h-9 rounded-xl border-dashed"
          >
            <BarChart3 className="size-4 text-amber-600 dark:text-amber-400" />
            {showCharts ? 'Ẩn biểu đồ' : 'Xem biểu đồ'}
            {showCharts ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </Button>

          <Button
            onClick={() => {
              setEditingEvent(null);
              setFormOpen(true);
            }}
            className="h-9 text-xs rounded-xl shadow-xs"
          >
            <Plus className="mr-1.5 size-4" /> Tạo sự kiện
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
      {/* 3.1 Quick Status Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        <Button
          variant={!status ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatus(undefined);
            setPage(1);
          }}
          className={`h-8 text-xs rounded-xl font-bold ${!status ? 'bg-foreground text-background' : ''}`}
        >
          Tất cả ({stats?.totalEvents ?? 0})
        </Button>

        <Button
          variant={status === 'DRAFT' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatus(status === 'DRAFT' ? undefined : 'DRAFT');
            setPage(1);
          }}
          className={`h-8 text-xs rounded-xl font-bold gap-1.5 ${status === 'DRAFT'
              ? 'bg-amber-500 text-black shadow-xs shadow-amber-500/20'
              : 'border-amber-500/40 text-amber-800 dark:text-amber-200 hover:bg-amber-500/10'
            }`}
        >
          <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
          <span>⏳ Show chờ duyệt</span>
        </Button>

        <Button
          variant={status === 'CONFIRMED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatus(status === 'CONFIRMED' ? undefined : 'CONFIRMED');
            setPage(1);
          }}
          className={`h-8 text-xs rounded-xl font-semibold ${status === 'CONFIRMED' ? 'bg-blue-600 text-white' : ''
            }`}
        >
          ✅ Đã duyệt
        </Button>

        <Button
          variant={status === 'IN_PROGRESS' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatus(status === 'IN_PROGRESS' ? undefined : 'IN_PROGRESS');
            setPage(1);
          }}
          className={`h-8 text-xs rounded-xl font-semibold ${status === 'IN_PROGRESS' ? 'bg-amber-600 text-white' : ''
            }`}
        >
          ⚡ Đang diễn
        </Button>

        <Button
          variant={status === 'COMPLETED' ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setStatus(status === 'COMPLETED' ? undefined : 'COMPLETED');
            setPage(1);
          }}
          className={`h-8 text-xs rounded-xl font-semibold ${status === 'COMPLETED' ? 'bg-emerald-600 text-white' : ''
            }`}
        >
          🟢 Hoàn thành ({stats?.completedEvents ?? 0})
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên sự kiện, mã sự kiện hoặc địa điểm..."
            className="pl-9 rounded-xl h-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Ô chọn Ngày tháng năm */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-foreground/80 shrink-0">Ngày diễn:</span>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl text-xs w-40 font-medium cursor-pointer"
              title="Lọc theo ngày diễn (Ngày/Tháng/Năm)"
            />
          </div>

          {(selectedDate || search || status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDate('');
                setSearch('');
                setStatus(undefined);
                setPage(1);
              }}
              className="h-10 px-2.5 text-xs rounded-xl text-muted-foreground hover:text-foreground"
              title="Đặt lại bộ lọc"
            >
              <RotateCcw className="size-3.5 mr-1" />
              Đặt lại
            </Button>
          )}
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
                  <TableHead className="w-32">Mã sự kiện</TableHead>
                  <TableHead>Tên sự kiện</TableHead>
                  <TableHead className="max-w-[200px] md:max-w-[260px]">Địa điểm</TableHead>
                  <TableHead className="w-48">Thời gian diễn</TableHead>
                  <TableHead className="w-40">Tổng thu</TableHead>
                  <TableHead className="w-36">Dự toán quỹ</TableHead>
                  <TableHead className="w-36">Trạng thái</TableHead>
                  <TableHead className="text-right w-20">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((event) => {
                  const evDate = new Date(event.eventDate);
                  const now = new Date();

                  const evMidnight = new Date(evDate.getFullYear(), evDate.getMonth(), evDate.getDate()).getTime();
                  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
                  const diffDays = Math.round((evMidnight - nowMidnight) / (1000 * 60 * 60 * 24));

                  const isToday = diffDays === 0;
                  const isTomorrow = diffDays === 1;
                  const isNext2to3Days = diffDays >= 2 && diffDays <= 3;
                  const isThisWeek = diffDays >= 4 && diffDays <= 7;
                  const isUpcomingLater = diffDays > 7;
                  const isPast = diffDays < 0;

                  const isSettled = (event._count?.transactions ?? 0) > 0 || event.status === 'COMPLETED';
                  const hasDraft = !isSettled && (event._count?.salaryConfigs ?? 0) > 0;
                  const isDraftBooking = event.status === 'DRAFT';

                  // Tách link bản đồ nếu có trong location
                  const mapMatch = event.location.match(/https?:\/\/[^\s\)]+/);
                  const mapLink = mapMatch ? mapMatch[0] : null;
                  const cleanLocation = event.location.replace(/\(Bản đồ:.*?\)/, '').replace(/\[Bản đồ:.*?\]/, '').trim();

                  let rowStyle = 'hover:bg-muted/40 border-l-4 border-l-slate-300 dark:border-l-slate-700';
                  if (isDraftBooking) {
                    rowStyle = 'bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-l-amber-500 font-medium';
                  } else if (isToday) {
                    rowStyle = 'bg-amber-500/15 hover:bg-amber-500/20 border-l-4 border-l-amber-500 font-bold';
                  } else if (isTomorrow) {
                    rowStyle = 'bg-emerald-500/10 hover:bg-emerald-500/15 border-l-4 border-l-emerald-500 font-semibold';
                  } else if (isNext2to3Days) {
                    rowStyle = 'bg-blue-500/5 hover:bg-blue-500/10 border-l-4 border-l-blue-500 font-medium';
                  } else if (isThisWeek) {
                    rowStyle = 'bg-purple-500/5 hover:bg-purple-500/10 border-l-4 border-l-purple-500 font-medium';
                  } else if (isPast) {
                    rowStyle = 'opacity-65 hover:opacity-100 bg-muted/20 hover:bg-muted/40 border-l-4 border-l-slate-300 dark:border-l-slate-800';
                  }

                  return (
                    <TableRow
                      key={event.id}
                      onDoubleClick={() => {
                        setEditingEvent(event);
                        setFormOpen(true);
                      }}
                      onTouchStart={() => handleRowTouchStart(event)}
                      onTouchEnd={handleRowTouchEnd}
                      onTouchMove={handleRowTouchEnd}
                      onMouseDown={() => handleRowTouchStart(event)}
                      onMouseUp={handleRowTouchEnd}
                      onMouseLeave={handleRowTouchEnd}
                      title="Nhấp đúp hoặc nhấn giữ để chỉnh sửa sự kiện"
                      className={`transition-colors cursor-pointer select-none ${rowStyle}`}
                    >
                      <TableCell className="font-mono text-xs">
                        <span className={isToday ? 'font-black text-amber-700 dark:text-amber-300' : isTomorrow ? 'font-bold text-emerald-700 dark:text-emerald-400' : isNext2to3Days ? 'font-semibold text-blue-700 dark:text-blue-400' : 'text-muted-foreground'}>
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
                        {(event.customerName || event.customerPhone) && (
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Khách: {[event.customerName, event.customerPhone].filter(Boolean).join(' - ')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs max-w-[200px] md:max-w-[260px]">
                        <div
                          className="truncate text-foreground font-medium"
                          title={cleanLocation}
                        >
                          {cleanLocation}
                        </div>
                        {mapLink && (
                          <a
                            href={mapLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold mt-0.5"
                          >
                            <MapPin className="size-3 text-red-500" />
                            Xem vị trí bản đồ
                          </a>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {formatDateVN(evDate)}
                          </span>
                          {isToday ? (
                            <Badge className="bg-amber-500 text-black font-extrabold text-[9px] px-1.5 py-0 h-4 border-amber-400 animate-pulse">
                              🔥 Hôm nay
                            </Badge>
                          ) : isTomorrow ? (
                            <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-[9px] px-1.5 py-0 h-4 font-bold">
                              ⚡ Ngày mai
                            </Badge>
                          ) : isNext2to3Days ? (
                            <Badge className="bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/40 text-[9px] px-1.5 py-0 h-4 font-semibold">
                              ⏳ Còn {diffDays} ngày
                            </Badge>
                          ) : isThisWeek ? (
                            <Badge className="bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/40 text-[9px] px-1.5 py-0 h-4">
                              Tuần này
                            </Badge>
                          ) : isUpcomingLater ? (
                            <Badge variant="outline" className="text-slate-600 dark:text-slate-400 text-[9px] px-1 py-0 h-4">
                              Sắp tới ({diffDays} ngày)
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-400 text-[9px] px-1 py-0 h-4">
                              Đã qua
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                          <Clock className="size-3 text-amber-500 shrink-0" />
                          <span>
                            {formatTime24h(evDate)}
                            {event.endTime ? ` - ${formatTime24h(new Date(event.endTime))}` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {(() => {
                          const tip = Number(event.tipAmount) || 0;
                          const contract = Number(event.contractValue) || 0;
                          const total = (event.totalRevenue !== undefined && event.totalRevenue !== null)
                            ? Number(event.totalRevenue)
                            : (contract + tip);

                          return (
                            <div className="space-y-0.5">
                              <div className="font-bold text-emerald-600 dark:text-emerald-400">
                                {total > 0 ? formatCurrency(total) : '0 đ'}
                              </div>
                              {tip > 0 && (
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                  +{formatCurrency(tip)} lộc
                                </div>
                              )}
                              {(event.depositAmount ?? 0) > 0 && (
                                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                  Đã cọc: {formatCurrency(Number(event.depositAmount))}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {isSettled ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] gap-1 font-semibold">
                            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                            Đã dự toán {(event._count?.transactions ?? 0) > 0 ? `(${event._count?.transactions} phiếu)` : ''}
                          </Badge>
                        ) : hasDraft ? (
                          <Badge variant="outline" className="text-purple-700 dark:text-purple-300 border-purple-500/40 text-[10px] gap-1 font-medium bg-purple-50/70 dark:bg-purple-950/30">
                            <FileText className="size-3 text-purple-600 dark:text-purple-400" />
                            Bản nháp dự toán
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] gap-1 font-medium bg-amber-50/60 dark:bg-amber-950/20">
                            <AlertCircle className="size-3 text-amber-600 dark:text-amber-400" />
                            Chưa dự toán
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isDraftBooking ? (
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-amber-500/20 text-amber-900 dark:text-amber-200 border-amber-500/40 text-[10px] font-bold">
                              ⏳ Chờ duyệt
                            </Badge>
                            <Button
                              type="button"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveEvent(event);
                              }}
                              disabled={updateMutation.isPending}
                              className="h-6 text-[10px] px-2 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                            >
                              Duyệt
                            </Button>
                          </div>
                        ) : (
                          <Badge variant={event.status === 'CANCELLED' ? 'destructive' : 'secondary'} className="text-[10px]">
                            {STATUS_LABELS[event.status]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                            >
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Thao tác</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            {isDraftBooking && (
                              <DropdownMenuItem
                                onClick={() => handleApproveEvent(event)}
                                className="cursor-pointer gap-2 font-bold text-emerald-600 dark:text-emerald-400"
                              >
                                <CheckCircle2 className="size-4 text-emerald-600" />
                                <span>Duyệt & Tạo show ngay</span>
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem
                              onClick={() => {
                                setSettlementEvent(event);
                                setSettlementOpen(true);
                              }}
                              className="cursor-pointer gap-2"
                            >
                              <Coins className={`size-4 ${isSettled ? 'text-emerald-500' : 'text-amber-500'}`} />
                              <span>{isSettled ? 'Xem / Lập dự toán' : hasDraft ? 'Tiếp tục dự toán' : 'Dự toán & Chia lương'}</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem asChild>
                              <Link href={`/assignments?eventId=${event.id}`} className="cursor-pointer gap-2 flex items-center w-full">
                                <ClipboardList className="size-4 text-blue-500" />
                                <span>Phân công nhân sự</span>
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => setReviewShareEvent(event)}
                              className="cursor-pointer gap-2"
                            >
                              <QrCode className="size-4 text-emerald-500" />
                              <span>Mã QR & Link đánh giá</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => {
                                setEditingEvent(event);
                                setFormOpen(true);
                              }}
                              className="cursor-pointer gap-2"
                            >
                              <Pencil className="size-4 text-slate-500" />
                              <span>Chỉnh sửa sự kiện</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* HỦY SỰ KIỆN: Chỉ cho phép với show CHƯA có phân công và CHƯA có dự toán */}
                            {event.status !== 'CANCELLED' && (
                              <DropdownMenuItem
                                onClick={() => {
                                  const memberCount = event._count?.eventMembers || 0;
                                  const salaryConfigCount = event._count?.salaryConfigs || 0;
                                  const txCount = event._count?.transactions || 0;

                                  if (memberCount > 0) {
                                    toast.error(
                                      `Không thể hủy show đã phân công (${memberCount} người). Vui lòng hủy/xóa phân công trước khi hủy.`
                                    );
                                    return;
                                  }
                                  if (salaryConfigCount > 0 || txCount > 0) {
                                    toast.error(
                                      'Không thể hủy show đã lập dự toán hoặc đã có phiếu thu chi.'
                                    );
                                    return;
                                  }
                                  setConfirmEvent(event);
                                }}
                                className="cursor-pointer gap-2 text-amber-600 focus:text-amber-600 focus:bg-amber-500/10"
                              >
                                <Ban className="size-4" />
                                <span>Hủy sự kiện</span>
                              </DropdownMenuItem>
                            )}

                            {/* XÓA SỰ KIỆN: Xóa hoàn toàn sự kiện khỏi cơ sở dữ liệu */}
                            <DropdownMenuItem
                              onClick={() => {
                                const txCount = event._count?.transactions || 0;
                                if (txCount > 0) {
                                  toast.error(
                                    `Không thể xóa sự kiện đã phát sinh ${txCount} phiếu thu chi trong sổ quỹ. Vui lòng kiểm tra sổ quỹ trước.`
                                  );
                                  return;
                                }
                                setDeleteConfirmEvent(event);
                              }}
                              className="cursor-pointer gap-2 text-rose-600 focus:text-rose-600 focus:bg-rose-500/10 font-medium"
                            >
                              <Trash2 className="size-4" />
                              <span>Xóa sự kiện</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {/* Phân trang & Tùy chọn số lượng dòng */}
            <div className="p-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Hiển thị</span>
                <Select
                  value={String(limit)}
                  onValueChange={(v) => {
                    setLimit(Number(v));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-7 w-16 text-xs rounded-lg bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10" className="text-xs">10</SelectItem>
                    <SelectItem value="20" className="text-xs">20</SelectItem>
                    <SelectItem value="50" className="text-xs">50</SelectItem>
                    <SelectItem value="100" className="text-xs">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>sự kiện / trang</span>
              </div>

              <PaginationBar
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                total={data.pagination.total}
                onPageChange={setPage}
              />
            </div>
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

      {/* DIALOG XÁC NHẬN HỦY SỰ KIỆN */}
      <ConfirmDialog
        open={!!confirmEvent}
        onOpenChange={(open) => !open && setConfirmEvent(null)}
        title="Hủy sự kiện"
        description={`Bạn có chắc muốn chuyển sự kiện "${confirmEvent?.name}" (${confirmEvent?.eventCode}) sang trạng thái Đã hủy?`}
        onConfirm={() => {
          if (confirmEvent) {
            cancelMutation.mutate(confirmEvent.id, { onSuccess: () => setConfirmEvent(null) });
          }
        }}
        isLoading={cancelMutation.isPending}
      />

      {/* DIALOG XÁC NHẬN XÓA SỰ KIỆN VĨNH VIỄN */}
      <ConfirmDialog
        open={!!deleteConfirmEvent}
        onOpenChange={(open) => !open && setDeleteConfirmEvent(null)}
        title="Xóa sự kiện vĩnh viễn"
        description={`Bạn có chắc muốn xóa vĩnh viễn sự kiện "${deleteConfirmEvent?.name}" (${deleteConfirmEvent?.eventCode})? Toàn bộ dữ liệu phân công và điểm danh của sự kiện này sẽ bị xóa và không thể khôi phục.`}
        onConfirm={() => {
          if (deleteConfirmEvent) {
            deleteMutation.mutate(deleteConfirmEvent.id, {
              onSuccess: () => setDeleteConfirmEvent(null),
            });
          }
        }}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import {
  Download,
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  BarChart3,
  TableProperties,
  Sparkles,
  TrendingUp,
  Award,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { LoadingState } from '@/components/tables/States';
import {
  useAttendanceReport,
  useEventReport,
  useMemberReport,
  useSalaryReport,
  useMonthlyAttendanceMatrix,
} from '@/hooks/useReports';
import { reportService } from '@/services/report.service';

function formatCurrency(value: number) {
  return value.toLocaleString('vi-VN') + ' đ';
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

export default function ReportsPage() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState<'matrix' | 'overview'>('matrix');
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());
  const [search, setSearch] = useState<string>('');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'attended' | 'none'>('all');

  // Queries
  const { data: matrixData, isLoading: loadingMatrix } =
    useMonthlyAttendanceMatrix(month, year);
  const { data: memberReport, isLoading: loadingMembers } = useMemberReport();
  const { data: eventReport, isLoading: loadingEvents } = useEventReport();
  const { data: attendanceReport, isLoading: loadingAttendance } = useAttendanceReport();
  const { data: salaryReport, isLoading: loadingSalary } = useSalaryReport(month, year);

  // Lọc danh sách thành viên trong bảng ma trận theo tìm kiếm & bộ lọc đi show
  const filteredMembers = useMemo(() => {
    if (!matrixData?.members) return [];
    return matrixData.members.filter((m) => {
      const matchSearch =
        !search.trim() ||
        m.fullName.toLowerCase().includes(search.toLowerCase().trim()) ||
        m.memberCode.toLowerCase().includes(search.toLowerCase().trim()) ||
        m.teamNames.toLowerCase().includes(search.toLowerCase().trim()) ||
        m.positionNames.toLowerCase().includes(search.toLowerCase().trim());

      if (!matchSearch) return false;

      if (attendanceFilter === 'attended') {
        return m.totalAttended > 0;
      }
      if (attendanceFilter === 'none') {
        return m.totalAttended === 0;
      }
      return true;
    });
  }, [matrixData?.members, search, attendanceFilter]);

  // Thống kê nhanh từ ma trận
  const matrixStats = useMemo(() => {
    if (!matrixData) return { totalEvents: 0, totalAttendedSlots: 0, topMember: null, avgAttendance: 0 };
    const totalEvents = matrixData.events.length;
    const totalAttendedSlots = matrixData.members.reduce((sum, m) => sum + m.totalAttended, 0);
    const sortedMembers = [...matrixData.members].sort((a, b) => b.totalAttended - a.totalAttended);
    const topMember = sortedMembers.length > 0 && sortedMembers[0].totalAttended > 0 ? sortedMembers[0] : null;
    const avgAttendance =
      matrixData.members.length > 0
        ? Math.round((totalAttendedSlots / (matrixData.members.length * (totalEvents || 1))) * 100)
        : 0;

    return { totalEvents, totalAttendedSlots, topMember, avgAttendance };
  }, [matrixData]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Tab Switcher */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <BarChart3 className="size-7 text-amber-500" />
            Báo Cáo & Thống Kê Hoạt Động
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Theo dõi ma trận tham gia show diễn của từng thành viên, chấm công và tổng hợp hoạt động
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/80 self-start lg:self-auto shadow-2xs">
          <Button
            variant={activeTab === 'matrix' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('matrix')}
            className={`rounded-xl text-xs font-bold gap-2 transition-all ${
              activeTab === 'matrix'
                ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-md shadow-amber-500/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TableProperties className="size-4" />
            Thống Kê Thành Viên Đi Show Theo Tháng
          </Button>

          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('overview')}
            className={`rounded-xl text-xs font-bold gap-2 transition-all ${
              activeTab === 'overview'
                ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-md shadow-amber-500/20'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="size-4" />
            Tổng Hợp & Sổ Quỹ
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MA TRẬN ĐI SHOW THEO THÁNG */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-5 animate-in fade-in-50 duration-200">
          {/* Bộ lọc Tháng/Năm, Tìm kiếm & Xuất Excel */}
          <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Chọn Tháng & Năm */}
              <div className="flex items-center gap-2 bg-muted/40 p-1 rounded-2xl border border-border/70">
                <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
                  <SelectTrigger className="w-28 h-9 rounded-xl text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <SelectItem key={m} value={String(m)} className="text-xs">
                        Tháng {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                  <SelectTrigger className="w-24 h-9 rounded-xl text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[year - 1, year, year + 1].map((y) => (
                      <SelectItem key={y} value={String(y)} className="text-xs">
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tìm kiếm thành viên */}
              <div className="relative w-full sm:w-60">
                <Search className="size-3.5 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Tìm thành viên, mã, đội..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-xl"
                />
              </div>

              {/* Lọc trạng thái đi show */}
              <Select
                value={attendanceFilter}
                onValueChange={(v: 'all' | 'attended' | 'none') => setAttendanceFilter(v)}
              >
                <SelectTrigger className="w-44 h-9 rounded-xl text-xs font-medium">
                  <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">
                    Tất cả thành viên ({matrixData?.members.length || 0})
                  </SelectItem>
                  <SelectItem value="attended" className="text-xs">
                    Có đi show ({matrixData?.members.filter((m) => m.totalAttended > 0).length || 0})
                  </SelectItem>
                  <SelectItem value="none" className="text-xs">
                    Chưa đi show nào ({matrixData?.members.filter((m) => m.totalAttended === 0).length || 0})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Nút Xuất Excel Ma Trận */}
            <Button
              onClick={() => reportService.downloadMatrixExcel(month, year)}
              disabled={loadingMatrix || !matrixData?.events.length}
              className="h-10 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold gap-2 shadow-md shadow-emerald-600/20 shrink-0"
            >
              <FileSpreadsheet className="size-4" />
              Xuất Excel Ma Trận Tháng {month}/{year}
            </Button>
          </div>

          {/* 4 Thẻ KPI tóm tắt ma trận */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Card className="border-border/70 bg-gradient-to-br from-amber-500/[0.06] via-card to-card shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">Tổng show diễn tháng {month}/{year}</p>
                  <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                    {matrixStats.totalEvents} show
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <CalendarDays className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-gradient-to-br from-emerald-500/[0.06] via-card to-card shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Tổng lượt đi show</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {matrixStats.totalAttendedSlots} lượt
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-gradient-to-br from-purple-500/[0.06] via-card to-card shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="overflow-hidden pr-2">
                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">Đi show nhiều nhất</p>
                  <p className="text-sm font-black text-foreground mt-0.5 truncate">
                    {matrixStats.topMember
                      ? `${matrixStats.topMember.fullName} (${matrixStats.topMember.totalAttended} show)`
                      : 'Chưa có'}
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 shrink-0">
                  <Award className="size-5" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-gradient-to-br from-blue-500/[0.06] via-card to-card shadow-xs">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Nhân sự tham gia</p>
                  <p className="text-xl font-black text-foreground mt-0.5">
                    {matrixData?.members.filter((m) => m.totalAttended > 0).length || 0}/
                    {matrixData?.members.length || 0} thành viên
                  </p>
                </div>
                <div className="p-2.5 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
                  <Users className="size-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* BẢNG MA TRẬN ĐI SHOW (CỐ ĐỊNH 100% ĐỘ ĐỤC - KHÔNG BỊ XUYÊN THẤU DỮ LIỆU) */}
          <Card className="border-border/80 shadow-md overflow-hidden rounded-3xl bg-card">
            <CardHeader className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-card to-amber-500/5 border-b border-border/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2 text-foreground">
                    <TableProperties className="size-5 text-amber-500" />
                    Bảng Thống Kê Thành Viên Đi Show Tháng {month}/{year}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tên cột là các show diễn trong tháng • Tên hàng là thành viên • Đánh dấu tick <strong>✓</strong> khi đi show (Cố định tiêu đề khi cuộn)
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="size-2.5 rounded-full bg-emerald-500 inline-block" /> Có đi show (✓)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="size-2.5 rounded-full bg-muted-foreground/40 inline-block" /> Không đi (-)
                  </span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingMatrix ? (
                <div className="p-12">
                  <LoadingState />
                </div>
              ) : !matrixData?.events.length ? (
                <div className="py-16 text-center text-muted-foreground text-sm space-y-2">
                  <CalendarDays className="size-10 mx-auto text-muted-foreground/50" />
                  <p className="font-semibold">Không có show diễn nào trong tháng {month}/{year}</p>
                  <p className="text-xs">Vui lòng chọn tháng khác hoặc tạo thêm show diễn mới.</p>
                </div>
              ) : (
                /* CONTAINER SCROLL VỚI HEADER VÀ CỘT CỐ ĐỊNH HOÀN TOÀN ĐỤC */
                <div className="overflow-auto max-h-[72vh] relative bg-card">
                  <table className="w-full border-separate border-spacing-0 text-xs text-left">
                    {/* THEAD CỐ ĐỊNH TOP-0 */}
                    <thead>
                      <tr>
                        {/* Cột cố định góc trên-trái: STT */}
                        <th className="sticky top-0 left-0 z-40 bg-zinc-100 dark:bg-zinc-900 px-2 py-3 text-center font-bold border-b border-r border-border w-12 text-muted-foreground shadow-xs">
                          STT
                        </th>

                        {/* Cột cố định góc trên-trái: Thành Viên */}
                        <th className="sticky top-0 left-12 z-40 bg-zinc-100 dark:bg-zinc-900 px-3 py-3 font-bold border-b border-r border-border min-w-[200px] text-foreground shadow-r">
                          Thành viên
                        </th>

                        {/* Cột cố định top: Đội / Chức Vụ */}
                        <th className="sticky top-0 z-30 bg-zinc-100 dark:bg-zinc-900 px-3 py-3 font-bold border-b border-r border-border min-w-[130px] text-foreground">
                          Đội / Chức vụ
                        </th>

                        {/* CÁC CỘT SHOW TRONG THÁNG (CỐ ĐỊNH TOP-0) */}
                        {matrixData.events.map((ev) => (
                          <th
                            key={ev.eventId}
                            className="sticky top-0 z-30 bg-zinc-100 dark:bg-zinc-900 p-2 text-center border-b border-r border-border min-w-[120px] max-w-[140px]"
                            title={`${ev.name} (${formatDateShort(ev.eventDate)}) - ${ev.location}`}
                          >
                            <div className="font-bold text-foreground truncate block">
                              {ev.name}
                            </div>
                            <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                              <span className="font-semibold text-amber-600 dark:text-amber-400">
                                {formatDateShort(ev.eventDate)}
                              </span>
                              <span>•</span>
                              <span className="font-mono">{ev.eventCode}</span>
                            </div>
                            <div className="mt-1">
                              <Badge
                                variant="outline"
                                className={`text-[9px] px-1.5 py-0 h-3.5 font-semibold ${
                                  ev.status === 'COMPLETED'
                                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                    : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                }`}
                              >
                                {ev.status === 'COMPLETED' ? 'Đã xong' : 'Sắp diễn'}
                              </Badge>
                            </div>
                          </th>
                        ))}

                        {/* Cột cố định góc trên-phải: Tổng show đi */}
                        <th className="sticky top-0 right-0 z-40 bg-amber-100 dark:bg-amber-950 px-3 py-3 text-center font-bold text-amber-900 dark:text-amber-200 border-b border-l border-border min-w-[100px] shadow-l">
                          Tổng show
                        </th>
                      </tr>
                    </thead>

                    {/* TBODY */}
                    <tbody>
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td
                            colSpan={matrixData.events.length + 4}
                            className="h-28 text-center text-xs text-muted-foreground bg-card"
                          >
                            Không tìm thấy thành viên nào phù hợp với bộ lọc.
                          </td>
                        </tr>
                      ) : (
                        filteredMembers.map((member, idx) => (
                          <tr
                            key={member.memberId}
                            className={`hover:bg-amber-500/[0.04] transition-colors group ${
                              member.totalAttended > 0 ? 'bg-card' : 'bg-muted/10 opacity-70'
                            }`}
                          >
                            {/* STT (Cố định trái - Nền đục 100%) */}
                            <td className="sticky left-0 z-20 bg-card px-2 py-2.5 text-center font-mono text-xs text-muted-foreground border-b border-r border-border/70">
                              {idx + 1}
                            </td>

                            {/* Tên Thành Viên (Cố định trái - Nền đục 100%) */}
                            <td className="sticky left-12 z-20 bg-card px-3 py-2.5 border-b border-r border-border/70 shadow-r">
                              <div className="flex items-center gap-2">
                                <div className="size-6 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                                  {member.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                  <span className="font-bold text-xs text-foreground block truncate">
                                    {member.fullName}
                                  </span>
                                  <span className="font-mono text-[10px] text-muted-foreground block truncate">
                                    {member.memberCode}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Đội & Chức vụ */}
                            <td className="px-3 py-2.5 border-b border-r border-border/70 bg-card">
                              <span
                                className="text-[11px] text-foreground block truncate max-w-[120px]"
                                title={member.teamNames}
                              >
                                {member.teamNames}
                              </span>
                              <span
                                className="text-[10px] text-muted-foreground block truncate max-w-[120px]"
                                title={member.positionNames}
                              >
                                {member.positionNames}
                              </span>
                            </td>

                            {/* TỪNG CỘT SHOW DIỄN (CELL TICK ✓ HOẶC -) */}
                            {matrixData.events.map((ev) => {
                              const showInfo = member.shows[ev.eventId];
                              const isAttended = showInfo?.isAttended;
                              const isAbsent = showInfo?.attendanceStatus?.startsWith('ABSENT');

                              return (
                                <td
                                  key={ev.eventId}
                                  className="text-center p-2 border-b border-r border-border/70 bg-card"
                                >
                                  {isAttended ? (
                                    <div className="inline-flex flex-col items-center justify-center">
                                      <span
                                        className="inline-flex size-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-black text-xs border border-emerald-500/40 shadow-2xs hover:scale-110 transition-transform cursor-default"
                                        title={`Đã tham gia show: ${ev.name} ${
                                          showInfo?.positionName ? `(${showInfo.positionName})` : ''
                                        }`}
                                      >
                                        ✓
                                      </span>
                                      {showInfo?.positionName && (
                                        <span className="text-[9px] text-muted-foreground truncate max-w-[90px] block mt-0.5">
                                          {showInfo.positionName}
                                        </span>
                                      )}
                                    </div>
                                  ) : isAbsent ? (
                                    <span
                                      className="inline-flex size-5 items-center justify-center rounded-full bg-rose-500/15 text-rose-600 font-bold text-[10px]"
                                      title="Vắng mặt"
                                    >
                                      ✕
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/40 font-bold">-</span>
                                  )}
                                </td>
                              );
                            })}

                            {/* Tổng số show đi (Cố định phải - Nền đục 100%) */}
                            <td className="sticky right-0 z-20 bg-card px-3 py-2.5 text-center font-mono font-black text-xs border-b border-l border-border/80 shadow-l">
                              {member.totalAttended > 0 ? (
                                <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold">
                                  {member.totalAttended} show
                                </span>
                              ) : (
                                <span className="text-muted-foreground">0</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>

                    {/* DÒNG TỔNG KẾT TỔNG NHÂN SỰ ĐI SHOW Ở FOOTER (CỐ ĐỊNH ĐÁY BOTTOM-0 - NỀN ĐỤC 100%) */}
                    {filteredMembers.length > 0 && (
                      <tfoot>
                        <tr>
                          {/* Ô tiêu đề tổng ở góc dưới-trái (Cố định trái + đáy) */}
                          <td
                            className="sticky bottom-0 left-0 z-40 bg-amber-100 dark:bg-amber-950 p-3 text-center text-xs font-bold text-muted-foreground border-t-2 border-r border-amber-500/40 shadow-xs"
                          >
                            ∑
                          </td>
                          <td
                            className="sticky bottom-0 left-12 z-40 bg-amber-100 dark:bg-amber-950 p-3 font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wide border-t-2 border-r border-amber-500/40 shadow-r"
                          >
                            TỔNG NHÂN SỰ ĐI SHOW
                          </td>
                          <td
                            className="sticky bottom-0 z-30 bg-amber-100 dark:bg-amber-950 p-3 text-xs text-muted-foreground border-t-2 border-r border-amber-500/40"
                          >
                            -
                          </td>

                          {/* Cột số người từng show (Cố định đáy) */}
                          {matrixData.events.map((ev) => (
                            <td
                              key={ev.eventId}
                              className="sticky bottom-0 z-30 bg-amber-100 dark:bg-amber-950 p-2 text-center border-t-2 border-r border-amber-500/40"
                            >
                              <span className="font-black text-emerald-700 dark:text-emerald-400 text-xs">
                                {ev.attendeeCount} người
                              </span>
                            </td>
                          ))}

                          {/* Tổng toàn bộ lượt đi show (Cố định phải + đáy) */}
                          <td
                            className="sticky bottom-0 right-0 z-40 bg-amber-200 dark:bg-amber-900 p-3 text-center font-black text-amber-900 dark:text-amber-100 text-sm border-t-2 border-l border-amber-500/40 shadow-l"
                          >
                            {matrixStats.totalAttendedSlots} lượt
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TỔNG HỢP & BÁO CÁO KHÁC (NHÂN SỰ, SỔ QUỸ, TIỀN CÔNG) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => reportService.downloadSalaryExcel(month, year)}
              className="rounded-2xl text-xs gap-2"
            >
              <Download className="size-4" />
              Xuất Excel Tiền Công Tháng {month}/{year}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Báo cáo nhân sự */}
            <Card className="rounded-3xl border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="size-4 text-amber-500" /> Báo Cáo Nhân Sự
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMembers || !memberReport ? (
                  <LoadingState />
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-muted/40 text-center">
                        <span className="text-muted-foreground block text-[11px]">Tổng thành viên</span>
                        <strong className="text-base font-black">{memberReport.total}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-center">
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">Đang hoạt động</span>
                        <strong className="text-base font-black text-emerald-600">{memberReport.active}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-center">
                        <span className="text-amber-700 dark:text-amber-400 block text-[11px]">Đang nghỉ</span>
                        <strong className="text-base font-black text-amber-600">{memberReport.onLeave}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-rose-500/10 text-center">
                        <span className="text-rose-700 dark:text-rose-400 block text-[11px]">Ngừng hoạt động</span>
                        <strong className="text-base font-black text-rose-600">{memberReport.inactive}</strong>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow>
                            <TableHead className="text-xs">Đội / Nhóm</TableHead>
                            <TableHead className="text-xs text-right">Số thành viên</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {memberReport.byTeam.map((team) => (
                            <TableRow key={team.teamId}>
                              <TableCell className="font-semibold text-xs">{team.teamName}</TableCell>
                              <TableCell className="text-right font-bold text-xs">{team.memberCount} người</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Báo cáo lịch diễn */}
            <Card className="rounded-3xl border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CalendarDays className="size-4 text-amber-500" /> Báo Cáo Lịch Diễn
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEvents || !eventReport ? (
                  <LoadingState />
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-xl bg-muted/40 text-center">
                        <span className="text-muted-foreground block text-[11px]">Tổng số show</span>
                        <strong className="text-base font-black">{eventReport.total}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-center">
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">Hoàn thành</span>
                        <strong className="text-base font-black text-emerald-600">{eventReport.completed}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-rose-500/10 text-center">
                        <span className="text-rose-700 dark:text-rose-400 block text-[11px]">Đã hủy</span>
                        <strong className="text-base font-black text-rose-600">{eventReport.cancelled}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Báo cáo chấm công */}
            <Card className="rounded-3xl border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-500" /> Báo Cáo Chấm Công
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingAttendance || !attendanceReport ? (
                  <LoadingState />
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-muted/40 text-center">
                        <span className="text-muted-foreground block text-[11px]">Tổng lượt chấm</span>
                        <strong className="text-base font-black">{attendanceReport.totalSessions}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-center">
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">Có mặt / Đi show</span>
                        <strong className="text-base font-black text-emerald-600">{attendanceReport.present}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-center">
                        <span className="text-amber-700 dark:text-amber-400 block text-[11px]">Vắng có phép</span>
                        <strong className="text-base font-black text-amber-600">{attendanceReport.absentWithPermission}</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-rose-500/10 text-center">
                        <span className="text-rose-700 dark:text-rose-400 block text-[11px]">Vắng không phép</span>
                        <strong className="text-base font-black text-rose-600">{attendanceReport.absentWithoutPermission}</strong>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                        Tỷ lệ chuyên cần toàn CLB:
                      </span>
                      <span className="text-lg font-black text-emerald-600">
                        {attendanceReport.attendanceRate}%
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Báo cáo tiền công */}
            <Card className="rounded-3xl border-border/80 shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingUp className="size-4 text-amber-500" /> Báo Cáo Tiền Công Tháng {month}/{year}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSalary || !salaryReport ? (
                  <LoadingState />
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                      <span className="font-semibold text-amber-900 dark:text-amber-200">
                        Tổng tiền công tháng {month}/{year}:
                      </span>
                      <span className="text-lg font-black text-amber-600 dark:text-amber-400">
                        {formatCurrency(salaryReport.grandTotal)}
                      </span>
                    </div>

                    <div className="rounded-2xl border border-border/70 overflow-hidden max-h-48 overflow-y-auto">
                      <Table>
                        <TableHeader className="bg-muted/40">
                          <TableRow>
                            <TableHead className="text-xs">Thành viên</TableHead>
                            <TableHead className="text-xs text-right">Tổng tiền</TableHead>
                            <TableHead className="text-xs text-center">Trạng thái</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {salaryReport.byMember.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                                Chưa có bảng lương nào trong tháng {month}/{year}
                              </TableCell>
                            </TableRow>
                          ) : (
                            salaryReport.byMember.map((row, idx) => (
                              <TableRow key={idx}>
                                <TableCell className="font-semibold text-xs">{row.memberName}</TableCell>
                                <TableCell className="text-right font-bold text-xs text-amber-600 dark:text-amber-400">
                                  {formatCurrency(row.totalAmount)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge
                                    variant={row.status === 'CONFIRMED' ? 'default' : 'secondary'}
                                    className="text-[10px]"
                                  >
                                    {row.status === 'CONFIRMED' ? 'Đã trả' : 'Chờ trả'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

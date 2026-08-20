'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  Users,
  Search,
  Save,
  Zap,
  UserPlus,
  Trash2,
  Calendar,
  MapPin,
  RefreshCw,
  SlidersHorizontal,
  History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingState, EmptyState } from '@/components/tables/States';
import {
  useEventAttendanceSheet,
  useRecordAttendance,
  useBatchAttendance,
  useDeleteAttendance,
  useAttendanceList,
} from '@/hooks/useAttendance';
import { useEvents } from '@/hooks/useEvents';
import { useMembers } from '@/hooks/useMembers';
import { useAuthStore } from '@/stores/authStore';
import { ATTENDANCE_STATUSES, STATUS_LABELS } from '@/types/enums';
import { Member } from '@/types/models';
import { toast } from 'sonner';

const ALL_VALUE = '__all__';

interface AttendanceRowState {
  memberId: string;
  member: Member;
  positionName: string;
  isAssigned: boolean;
  attendanceId?: string;
  status: string;
  note: string;
  isDirty: boolean;
}

function formatDisplayDate(dateStr?: string | Date | null) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return isNaN(d.getTime())
    ? '-'
    : d.toLocaleDateString('vi-VN', {
        weekday: 'short',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
}

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'sheet' | 'history'>('sheet');
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Dialog thêm thành viên ngoài danh sách
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [addMemberSearch, setAddMemberSearch] = useState('');

  // Row state lưu dữ liệu đang chỉnh sửa
  const [rowStates, setRowStates] = useState<Record<string, AttendanceRowState>>({});

  const user = useAuthStore((state) => state.user);
  const canManageAttendance =
    user?.permissions.includes('attendance:confirm') ||
    user?.roleName === 'ADMIN' ||
    user?.roleName === 'SUPER_ADMIN' ||
    user?.roleName === 'TEAM_LEADER';

  // Lấy danh sách sự kiện
  const { data: eventsData, isLoading: loadingEvents } = useEvents({ page: 1, limit: 100 });

  // Tự động chọn sự kiện đầu tiên nếu chưa chọn
  useEffect(() => {
    if (!selectedEventId && eventsData?.items && eventsData.items.length > 0) {
      setSelectedEventId(eventsData.items[0].id);
    }
  }, [eventsData, selectedEventId]);

  // Lấy bảng điểm danh của sự kiện được chọn
  const {
    data: sheetData,
    isLoading: loadingSheet,
    refetch: refetchSheet,
  } = useEventAttendanceSheet(selectedEventId);

  // Lấy danh sách thành viên trong CLB để bổ sung
  const { data: allMembersData } = useMembers({ page: 1, limit: 100, status: 'ACTIVE' });

  // Mutations
  const recordMutation = useRecordAttendance();
  const batchMutation = useBatchAttendance();
  const deleteMutation = useDeleteAttendance();

  // Tab lịch sử
  const [historyEventId, setHistoryEventId] = useState<string | undefined>();
  const [historyStatus, setHistoryStatus] = useState<string | undefined>();
  const { data: historyData, isLoading: loadingHistory } = useAttendanceList({
    eventId: historyEventId,
    status: historyStatus,
    page: 1,
    limit: 50,
  });

  // Đồng bộ rowStates khi sheetData thay đổi
  useEffect(() => {
    if (!sheetData?.members) return;

    const initialRows: Record<string, AttendanceRowState> = {};
    for (const item of sheetData.members) {
      const att = item.attendance;
      initialRows[item.member.id] = {
        memberId: item.member.id,
        member: item.member,
        positionName: item.position?.name ?? (item.isAssigned ? 'Thành viên' : 'Bổ sung'),
        isAssigned: item.isAssigned,
        attendanceId: att?.id,
        status: att?.status ?? 'PRESENT', // Mặc định có mặt nếu chưa chấm
        note: att?.note ?? '',
        isDirty: false,
      };
    }
    setRowStates(initialRows);
  }, [sheetData]);

  // Thay đổi 1 trường trong hàng
  const handleRowChange = (memberId: string, field: keyof AttendanceRowState, value: any) => {
    setRowStates((prev) => {
      const current = prev[memberId];
      if (!current) return prev;
      return {
        ...prev,
        [memberId]: {
          ...current,
          [field]: value,
          isDirty: true,
        },
      };
    });
  };

  // Chọn nhanh trạng thái 1-chạm
  const handleSelectStatus = (memberId: string, status: string) => {
    setRowStates((prev) => {
      const current = prev[memberId];
      if (!current) return prev;
      return {
        ...prev,
        [memberId]: {
          ...current,
          status,
          isDirty: true,
        },
      };
    });
  };

  // Chấm nhanh tất cả có mặt
  const handleMarkAllPresent = () => {
    setRowStates((prev) => {
      const next = { ...prev };
      for (const id of Object.keys(next)) {
        next[id] = {
          ...next[id],
          status: 'PRESENT',
          isDirty: true,
        };
      }
      return next;
    });
    toast.info('Đã đánh dấu tất cả thành viên "Có mặt". Hãy bấm "Lưu bảng điểm danh" để lưu lại.');
  };

  // Lưu 1 dòng
  const handleSaveSingleRow = (memberId: string) => {
    if (!selectedEventId) return;
    const row = rowStates[memberId];
    if (!row) return;

    recordMutation.mutate(
      {
        eventId: selectedEventId,
        memberId,
        status: row.status,
        note: row.note,
      },
      {
        onSuccess: () => {
          setRowStates((prev) => ({
            ...prev,
            [memberId]: { ...prev[memberId], isDirty: false },
          }));
        },
      },
    );
  };

  // Lưu toàn bộ bảng điểm danh
  const handleSaveAll = () => {
    if (!selectedEventId) return;
    const items = Object.values(rowStates).map((row) => ({
      memberId: row.memberId,
      status: row.status,
      note: row.note,
    }));

    if (items.length === 0) {
      toast.error('Không có thành viên nào để lưu');
      return;
    }

    batchMutation.mutate(
      {
        eventId: selectedEventId,
        items,
      },
      {
        onSuccess: () => {
          setRowStates((prev) => {
            const next = { ...prev };
            for (const id of Object.keys(next)) {
              next[id] = { ...next[id], isDirty: false };
            }
            return next;
          });
        },
      },
    );
  };

  // Xóa bản ghi điểm danh
  const handleDeleteAttendance = (memberId: string) => {
    const row = rowStates[memberId];
    if (!row?.attendanceId) {
      // Chỉ là bản ghi chưa lưu trên DB, nếu là ngoài danh sách phân công thì xóa khỏi state
      if (!row.isAssigned) {
        setRowStates((prev) => {
          const next = { ...prev };
          delete next[memberId];
          return next;
        });
      }
      return;
    }

    deleteMutation.mutate(row.attendanceId, {
      onSuccess: () => {
        refetchSheet();
      },
    });
  };

  // Thêm thành viên ngoài danh sách
  const handleAddMemberToSheet = (member: Member) => {
    if (rowStates[member.id]) {
      toast.warning(`Thành viên ${member.fullName} đã có trong danh sách.`);
      return;
    }

    setRowStates((prev) => ({
      ...prev,
      [member.id]: {
        memberId: member.id,
        member,
        positionName: 'Bổ sung',
        isAssigned: false,
        status: 'PRESENT',
        note: 'Thành viên bổ sung',
        isDirty: true,
      },
    }));

    setIsAddMemberOpen(false);
    toast.success(`Đã thêm ${member.fullName} vào bảng chấm công.`);
  };

  // Danh sách hiển thị sau khi lọc tìm kiếm
  const filteredRows = useMemo(() => {
    const rows = Object.values(rowStates);
    return rows.filter((row) => {
      const matchSearch =
        !memberSearchQuery.trim() ||
        row.member.fullName.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
        row.member.memberCode.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
        row.positionName.toLowerCase().includes(memberSearchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || row.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [rowStates, memberSearchQuery, statusFilter]);

  // Đếm số dòng đã chỉnh sửa nhưng chưa lưu
  const dirtyCount = useMemo(() => {
    return Object.values(rowStates).filter((r) => r.isDirty).length;
  }, [rowStates]);

  // Thành viên có thể bổ sung (chưa có trong bảng)
  const availableMembersToAdd = useMemo(() => {
    if (!allMembersData?.items) return [];
    return allMembersData.items.filter((m) => {
      const notInSheet = !rowStates[m.id];
      const matchSearch =
        !addMemberSearch.trim() ||
        m.fullName.toLowerCase().includes(addMemberSearch.toLowerCase()) ||
        m.memberCode.toLowerCase().includes(addMemberSearch.toLowerCase());
      return notInSheet && matchSearch;
    });
  }, [allMembersData, rowStates, addMemberSearch]);

  const selectedEvent = sheetData?.event;
  const stats = sheetData?.stats;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý Chấm công Sự kiện</h1>
          <p className="text-muted-foreground text-sm">
            Admin trực tiếp điểm danh trạng thái có mặt / vắng của thành viên tham gia sự kiện
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-1">
          <Button
            variant={activeTab === 'sheet' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('sheet')}
            className="gap-1.5"
          >
            <UserCheck className="size-4" />
            Chấm công theo sự kiện
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('history')}
            className="gap-1.5"
          >
            <History className="size-4" />
            Lịch sử tổng hợp
          </Button>
        </div>
      </div>

      {activeTab === 'sheet' && (
        <>
          {/* Bộ chọn Sự kiện & Thông tin tổng quan */}
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Event Selector Box */}
            <Card className="border-border/60 shadow-xs lg:col-span-4">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Chọn sự kiện chấm công
                  </label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6 text-muted-foreground"
                    title="Làm mới"
                    onClick={() => refetchSheet()}
                  >
                    <RefreshCw className="size-3.5" />
                  </Button>
                </div>

                <Select value={selectedEventId ?? ''} onValueChange={setSelectedEventId}>
                  <SelectTrigger className="w-full font-medium">
                    <SelectValue placeholder="Chọn một sự kiện để chấm công..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {loadingEvents ? (
                      <div className="p-2 text-center text-xs text-muted-foreground">Đang tải sự kiện...</div>
                    ) : !eventsData?.items || eventsData.items.length === 0 ? (
                      <div className="p-2 text-center text-xs text-muted-foreground">Không có sự kiện nào</div>
                    ) : (
                      eventsData.items.map((evt) => (
                        <SelectItem key={evt.id} value={evt.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">{evt.eventCode}</span>
                            <span className="truncate">{evt.name}</span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>

                {selectedEvent && (
                  <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground text-sm truncate">{selectedEvent.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {STATUS_LABELS[selectedEvent.status] ?? selectedEvent.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="size-3.5 shrink-0 text-primary" />
                      <span>{formatDisplayDate(selectedEvent.eventDate)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0 text-primary" />
                      <span className="truncate">{selectedEvent.location || 'Chưa cập nhật địa điểm'}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick KPI Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:col-span-8 gap-3">
              <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-card p-3 shadow-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Quân số phân công</span>
                  <Users className="size-4 text-blue-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold">{stats?.totalAssigned ?? 0}</span>
                  <span className="text-[11px] text-muted-foreground">người</span>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 shadow-xs">
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                  <span className="text-xs font-medium">Có mặt</span>
                  <CheckCircle2 className="size-4" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {stats?.present ?? 0}
                  </span>
                  <span className="text-[11px] text-muted-foreground">người</span>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 shadow-xs">
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
                  <span className="text-xs font-medium">Đi trễ</span>
                  <Clock className="size-4" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {stats?.late ?? 0}
                  </span>
                  <span className="text-[11px] text-muted-foreground">người</span>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 shadow-xs">
                <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                  <span className="text-xs font-medium">Vắng có phép</span>
                  <UserCheck className="size-4" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats?.absentWithPermission ?? 0}
                  </span>
                  <span className="text-[11px] text-muted-foreground">người</span>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 shadow-xs">
                <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                  <span className="text-xs font-medium">Vắng không phép</span>
                  <UserX className="size-4" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                    {stats?.absentWithoutPermission ?? 0}
                  </span>
                  <span className="text-[11px] text-muted-foreground">người</span>
                </div>
              </div>

              <div className="flex flex-col justify-between rounded-xl border border-border/60 bg-muted/20 p-3 shadow-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span className="text-xs font-medium">Chưa chấm</span>
                  <AlertCircle className="size-4 text-muted-foreground" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-muted-foreground">
                    {stats?.unmarked ?? 0}
                  </span>
                  <span className="text-[11px] text-muted-foreground">người</span>
                </div>
              </div>
            </div>
          </div>

          {/* Toolbar Actions */}
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm thành viên / vai trò..."
                  className="pl-9 h-9 text-xs"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-40 text-xs">
                  <SlidersHorizontal className="mr-1.5 size-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Lọc trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                  {ATTENDANCE_STATUSES.map((st) => (
                    <SelectItem key={st} value={st}>
                      {STATUS_LABELS[st] ?? st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {canManageAttendance && (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllPresent}
                  className="gap-1.5 border-emerald-600/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                >
                  <Zap className="size-4 text-emerald-500 fill-emerald-500/30" />
                  Chấm tất cả Có mặt
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddMemberOpen(true)}
                  className="gap-1.5"
                >
                  <UserPlus className="size-4" />
                  Thêm thành viên ngoài
                </Button>

                <Button
                  size="sm"
                  onClick={handleSaveAll}
                  isLoading={batchMutation.isPending}
                  className="gap-1.5 bg-primary font-medium"
                >
                  <Save className="size-4" />
                  Lưu bảng chấm công
                  {dirtyCount > 0 && (
                    <span className="ml-1 rounded-full bg-primary-foreground px-1.5 py-0.2 text-[10px] font-bold text-primary">
                      {dirtyCount}
                    </span>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Interactive Attendance Table */}
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-xs">
            {loadingSheet ? (
              <LoadingState />
            ) : !selectedEventId ? (
              <EmptyState label="Vui lòng chọn sự kiện để bắt đầu chấm công" />
            ) : filteredRows.length === 0 ? (
              <EmptyState label="Không tìm thấy thành viên nào phù hợp" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-12 text-center">STT</TableHead>
                      <TableHead className="min-w-[200px]">Thành viên</TableHead>
                      <TableHead className="min-w-[140px]">Vai trò biểu diễn</TableHead>
                      <TableHead className="min-w-[360px]">Trạng thái chấm công</TableHead>
                      <TableHead className="min-w-[200px]">Ghi chú</TableHead>
                      {canManageAttendance && <TableHead className="w-24 text-right">Lưu / Xóa</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row, index) => {
                      const isSavingThis =
                        recordMutation.isPending && recordMutation.variables?.memberId === row.memberId;

                      return (
                        <TableRow
                          key={row.memberId}
                          className={`transition-colors ${row.isDirty ? 'bg-amber-500/5 dark:bg-amber-500/10' : ''}`}
                        >
                          <TableCell className="text-center font-mono text-xs text-muted-foreground">
                            {index + 1}
                          </TableCell>

                          <TableCell>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-sm">{row.member.fullName}</span>
                                {!row.isAssigned && (
                                  <Badge
                                    variant="outline"
                                    className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px] py-0"
                                  >
                                    Bổ sung
                                  </Badge>
                                )}
                              </div>
                              <span className="font-mono text-xs text-muted-foreground">{row.member.memberCode}</span>
                            </div>
                          </TableCell>

                          <TableCell>
                            <Badge variant="secondary" className="font-normal text-xs">
                              {row.positionName}
                            </Badge>
                          </TableCell>

                          {/* Quick 1-click status selector buttons */}
                          <TableCell>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSelectStatus(row.memberId, 'PRESENT')}
                                className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-all ${
                                  row.status === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                                    : 'bg-muted/60 text-muted-foreground hover:bg-emerald-500/15 hover:text-emerald-700 dark:hover:text-emerald-400'
                                }`}
                              >
                                Có mặt
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSelectStatus(row.memberId, 'LATE')}
                                className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-all ${
                                  row.status === 'LATE'
                                    ? 'bg-amber-600 text-white shadow-xs font-semibold'
                                    : 'bg-muted/60 text-muted-foreground hover:bg-amber-500/15 hover:text-amber-700 dark:hover:text-amber-400'
                                }`}
                              >
                                Đi trễ
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSelectStatus(row.memberId, 'ABSENT_WITH_PERMISSION')}
                                className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-all ${
                                  row.status === 'ABSENT_WITH_PERMISSION'
                                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                                    : 'bg-muted/60 text-muted-foreground hover:bg-blue-500/15 hover:text-blue-700 dark:hover:text-blue-400'
                                }`}
                              >
                                Vắng phép
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSelectStatus(row.memberId, 'ABSENT_WITHOUT_PERMISSION')}
                                className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-all ${
                                  row.status === 'ABSENT_WITHOUT_PERMISSION'
                                    ? 'bg-rose-600 text-white shadow-xs font-semibold'
                                    : 'bg-muted/60 text-muted-foreground hover:bg-rose-500/15 hover:text-rose-700 dark:hover:text-rose-400'
                                }`}
                              >
                                Vắng K.Phép
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSelectStatus(row.memberId, 'REPLACED')}
                                className={`px-2.5 py-1.5 text-xs rounded-md font-medium transition-all ${
                                  row.status === 'REPLACED'
                                    ? 'bg-purple-600 text-white shadow-xs font-semibold'
                                    : 'bg-muted/60 text-muted-foreground hover:bg-purple-500/15 hover:text-purple-700 dark:hover:text-purple-400'
                                }`}
                              >
                                Thay thế
                              </button>
                            </div>
                          </TableCell>

                          {/* Note */}
                          <TableCell>
                            <Input
                              type="text"
                              placeholder="Ghi chú..."
                              className="h-8 text-xs"
                              value={row.note}
                              onChange={(e) => handleRowChange(row.memberId, 'note', e.target.value)}
                            />
                          </TableCell>

                          {/* Action */}
                          {canManageAttendance && (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant={row.isDirty ? 'default' : 'ghost'}
                                  size="icon"
                                  className="size-7"
                                  title="Lưu dòng này"
                                  isLoading={isSavingThis}
                                  onClick={() => handleSaveSingleRow(row.memberId)}
                                >
                                  <Save className="size-3.5" />
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                                  title="Xóa điểm danh"
                                  onClick={() => handleDeleteAttendance(row.memberId)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab Lịch sử tổng hợp */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs sm:flex-row sm:items-center">
            <Select
              value={historyEventId ?? ALL_VALUE}
              onValueChange={(v) => setHistoryEventId(v === ALL_VALUE ? undefined : v)}
            >
              <SelectTrigger className="sm:w-72 text-xs">
                <SelectValue placeholder="Lọc theo sự kiện" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Tất cả sự kiện</SelectItem>
                {eventsData?.items.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.eventCode} - {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={historyStatus ?? ALL_VALUE}
              onValueChange={(v) => setHistoryStatus(v === ALL_VALUE ? undefined : v)}
            >
              <SelectTrigger className="sm:w-56 text-xs">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_VALUE}>Tất cả trạng thái</SelectItem>
                {ATTENDANCE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s] ?? s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-xs">
            {loadingHistory ? (
              <LoadingState />
            ) : !historyData || historyData.items.length === 0 ? (
              <EmptyState label="Chưa có dữ liệu chấm công nào được lưu" />
            ) : (
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Thành viên</TableHead>
                    <TableHead>Sự kiện</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead>Người xác nhận</TableHead>
                    <TableHead>Thời gian chấm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.items.map((att) => (
                    <TableRow key={att.id}>
                      <TableCell className="font-semibold text-sm">
                        {att.member?.fullName}
                        <div className="font-mono text-xs text-muted-foreground">{att.member?.memberCode}</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium text-foreground">{att.event?.name}</div>
                        <div className="font-mono text-muted-foreground">{att.event?.eventCode}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs font-normal">
                          {STATUS_LABELS[att.status] ?? att.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{att.note || '-'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {att.confirmedBy ? 'Admin' : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {formatDisplayDate(att.confirmedAt || att.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}

      {/* Dialog bổ sung thành viên ngoài danh sách */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm thành viên vào buổi biểu diễn</DialogTitle>
            <DialogDescription>
              Chọn thành viên trong CLB để bổ sung vào bảng điểm danh sự kiện này.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Tìm tên hoặc mã thành viên..."
                className="pl-9 h-9 text-xs"
                value={addMemberSearch}
                onChange={(e) => setAddMemberSearch(e.target.value)}
              />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y rounded-md border">
              {availableMembersToAdd.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Không tìm thấy thành viên nào khả dụng
                </div>
              ) : (
                availableMembersToAdd.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-xs">{m.fullName}</div>
                      <div className="font-mono text-[10px] text-muted-foreground">{m.memberCode}</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleAddMemberToSheet(m)}>
                      Chọn
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsAddMemberOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

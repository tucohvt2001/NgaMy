'use client';

import { Suspense, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  Users,
  Calendar,
  Layers,
  Search,
  Sparkles,
  MapPin,
  Clock,
  Shield,
  X,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { ConfirmDialog } from '@/components/forms/ConfirmDialog';
import { AssignMemberDialog } from '@/components/forms/AssignMemberDialog';
import { useBatchAssignMembers, useEventMembers, useEvents, useRemoveAssignment } from '@/hooks/useEvents';
import { EventMember } from '@/types/models';
import { STATUS_LABELS } from '@/types/enums';
import { AssignMemberInput } from '@/services/event.service';

interface GroupedMemberAssignment {
  memberId: string;
  member: EventMember['member'];
  roles: Array<{
    id: string; // EventMember id
    positionId: string;
    position: EventMember['position'];
    status: string;
    note: string | null;
  }>;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

function AssignmentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get('eventId') ?? undefined;

  const { data: eventsData } = useEvents({ page: 1, limit: 100 });
  const { data: assignments, isLoading } = useEventMembers(eventId);
  const [formOpen, setFormOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Dialog xác nhận xóa
  const [confirmDelete, setConfirmDelete] = useState<{
    memberId: string;
    memberName: string;
    positionId?: string;
    positionName?: string;
    assignmentId?: string;
    isAll: boolean;
  } | null>(null);

  const batchAssignMutation = useBatchAssignMembers(eventId ?? '');
  const removeMutation = useRemoveAssignment(eventId ?? '');

  const currentEvent = useMemo(() => {
    return eventsData?.items.find((e) => e.id === eventId);
  }, [eventsData?.items, eventId]);

  // Gom nhóm danh sách phân công theo từng thành viên (1 người -> nhiều vai trò)
  const groupedAssignments: GroupedMemberAssignment[] = useMemo(() => {
    if (!assignments) return [];
    const map = new Map<string, GroupedMemberAssignment>();

    for (const item of assignments) {
      if (!map.has(item.memberId)) {
        map.set(item.memberId, {
          memberId: item.memberId,
          member: item.member,
          roles: [],
        });
      }
      map.get(item.memberId)!.roles.push({
        id: item.id,
        positionId: item.positionId,
        position: item.position,
        status: item.status,
        note: item.note ?? null,
      });
    }

    return Array.from(map.values());
  }, [assignments]);

  // Lọc theo tìm kiếm
  const filteredGrouped = useMemo(() => {
    if (!search.trim()) return groupedAssignments;
    const term = search.toLowerCase().trim();
    return groupedAssignments.filter(
      (g) =>
        g.member.fullName.toLowerCase().includes(term) ||
        g.member.memberCode.toLowerCase().includes(term) ||
        g.member.phone?.toLowerCase().includes(term) ||
        g.roles.some((r) => r.position.name.toLowerCase().includes(term)),
    );
  }, [groupedAssignments, search]);

  const handleSubmit = (values: AssignMemberInput[]) => {
    batchAssignMutation.mutate(values, { onSuccess: () => setFormOpen(false) });
  };

  const handleRemoveSingleRole = (role: { id: string; positionId: string; position: { name: string } }, member: { id: string; fullName: string }) => {
    setConfirmDelete({
      memberId: member.id,
      memberName: member.fullName,
      positionId: role.positionId,
      positionName: role.position.name,
      assignmentId: role.id,
      isAll: false,
    });
  };

  const handleRemoveAllRoles = (member: { id: string; fullName: string }) => {
    setConfirmDelete({
      memberId: member.id,
      memberName: member.fullName,
      isAll: true,
    });
  };

  // Thống kê nhanh
  const totalUniqueMembers = groupedAssignments.length;
  const totalRoleAssignments = assignments?.length ?? 0;
  const multiRoleMembers = groupedAssignments.filter((g) => g.roles.length > 1);

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="size-7 text-amber-500" />
            Phân Công Nhân Sự Sự Kiện
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Phân công thành viên tham gia từng sự kiện, hỗ trợ <strong>1 người đảm nhiệm nhiều vai trò</strong>
          </p>
        </div>

        {eventId && (
          <Button
            onClick={() => setFormOpen(true)}
            className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-2 shadow-md shadow-amber-500/20"
          >
            <Plus className="size-4" />
            Phân công thành viên
          </Button>
        )}
      </div>

      {/* 2. Chọn Sự Kiện & Thông tin nhanh */}
      <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select
            value={eventId ?? ''}
            onValueChange={(value) => router.push(`/assignments?eventId=${value}`)}
          >
            <SelectTrigger className="w-full sm:w-96 rounded-2xl text-xs font-semibold h-10">
              <SelectValue placeholder="-- Chọn sự kiện để phân công --" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {eventsData?.items.map((event) => (
                <SelectItem key={event.id} value={event.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-600 dark:text-amber-400">{event.eventCode}</span>
                    <span>-</span>
                    <span className="font-bold">{event.name}</span>
                    <span className="text-muted-foreground">({formatDate(event.eventDate)})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {currentEvent && (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5 text-amber-500" />
              {formatDate(currentEvent.eventDate)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 truncate max-w-xs" title={currentEvent.location}>
              <MapPin className="size-3.5 text-amber-500" />
              {currentEvent.location}
            </span>
            <span>•</span>
            <Badge
              variant="outline"
              className={`text-[10px] ${
                currentEvent.status === 'COMPLETED'
                  ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-700 border-amber-500/30'
              }`}
            >
              {currentEvent.status === 'COMPLETED' ? 'Đã xong' : 'Sắp diễn'}
            </Badge>
          </div>
        )}
      </div>

      {/* 3. Thẻ KPI Thống Kê Phân Công */}
      {eventId && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <Card className="rounded-3xl border-border/80 bg-gradient-to-br from-amber-500/[0.06] via-card to-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">Tổng nhân sự tham gia</p>
                <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {totalUniqueMembers} người
                </p>
              </div>
              <div className="p-2.5 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <UserCheck className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/80 bg-gradient-to-br from-emerald-500/[0.06] via-card to-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Tổng lượt vai trò đảm nhiệm</p>
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {totalRoleAssignments} lượt
                </p>
              </div>
              <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Layers className="size-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/80 bg-gradient-to-br from-purple-500/[0.06] via-card to-card shadow-xs">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-purple-700 dark:text-purple-400">Kiêm nhiệm nhiều vai trò</p>
                <p className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                  {multiRoleMembers.length} thành viên
                </p>
              </div>
              <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
                <Sparkles className="size-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. Danh Sách Phân Công Nhân Sự */}
      {!eventId ? (
        <EmptyState label="Vui lòng chọn một sự kiện ở trên để xem và phân công nhân sự" />
      ) : (
        <Card className="rounded-3xl border-border/80 shadow-md overflow-hidden bg-card">
          <CardHeader className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-card to-amber-500/5 border-b border-border/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Layers className="size-5 text-amber-500" />
                  Danh Sách Nhân Sự Đã Phân Công ({totalUniqueMembers} người • {totalRoleAssignments} lượt vai trò)
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  1 thành viên có thể đảm nhiệm nhiều vai trò khác nhau trong show diễn
                </p>
              </div>

              {/* Ô tìm kiếm nhanh */}
              <div className="relative w-full sm:w-64">
                <Search className="size-3.5 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tên, mã, vai trò..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9 text-xs rounded-xl"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-12">
                <LoadingState />
              </div>
            ) : filteredGrouped.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm space-y-2">
                <Users className="size-10 mx-auto text-muted-foreground/50" />
                <p className="font-semibold">
                  {assignments && assignments.length > 0
                    ? 'Không tìm thấy thành viên nào phù hợp với từ khóa'
                    : 'Chưa có ai được phân công cho sự kiện này'}
                </p>
                <p className="text-xs">Bấm nút &quot;Phân công thành viên&quot; ở trên để bắt đầu thêm nhân sự.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-12 text-center text-xs font-bold">STT</TableHead>
                      <TableHead className="min-w-[200px] text-xs font-bold">Thành viên</TableHead>
                      <TableHead className="min-w-[280px] text-xs font-bold">Các vai trò đảm nhiệm trong show</TableHead>
                      <TableHead className="min-w-[120px] text-xs font-bold">Trạng thái</TableHead>
                      <TableHead className="min-w-[150px] text-xs font-bold">Ghi chú</TableHead>
                      <TableHead className="w-24 text-right text-xs font-bold">Xóa tất cả</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGrouped.map((item, idx) => (
                      <TableRow key={item.memberId} className="hover:bg-muted/20 transition-colors">
                        {/* STT */}
                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                          {idx + 1}
                        </TableCell>

                        {/* Thông tin thành viên */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-xs shrink-0">
                              {item.member.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-xs text-foreground">{item.member.fullName}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono mt-0.5">
                                <span>{item.member.memberCode}</span>
                                {item.member.phone && (
                                  <>
                                    <span>•</span>
                                    <span>{item.member.phone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {/* Danh sách các vai trò (Mỗi vai trò là 1 Badge có nút Xóa riêng) */}
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5 py-1">
                            {item.roles.map((r) => (
                              <Badge
                                key={r.id}
                                variant="secondary"
                                className="pl-2.5 pr-1.5 py-1 rounded-xl text-xs flex items-center gap-1.5 bg-amber-500/10 text-amber-900 dark:text-amber-200 border border-amber-500/30 group hover:border-amber-500/50 transition-colors"
                              >
                                <span className="font-bold">{r.position.name}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSingleRole(r, item.member)}
                                  title={`Hủy vai trò "${r.position.name}" của ${item.member.fullName}`}
                                  className="size-4 rounded-full bg-amber-500/20 hover:bg-rose-500 hover:text-white flex items-center justify-center text-amber-800 dark:text-amber-200 transition-colors"
                                >
                                  <X className="size-2.5 stroke-[2.5]" />
                                </button>
                              </Badge>
                            ))}
                            {item.roles.length > 1 && (
                              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold px-1.5 py-0.5 bg-purple-500/10 rounded-lg">
                                Kiêm {item.roles.length} vai trò
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Trạng thái */}
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-[10px] rounded-lg font-medium"
                          >
                            {STATUS_LABELS[item.roles[0]?.status] ?? item.roles[0]?.status ?? 'ASSIGNED'}
                          </Badge>
                        </TableCell>

                        {/* Ghi chú */}
                        <TableCell>
                          <span className="text-xs text-muted-foreground block truncate max-w-[200px]">
                            {item.roles
                              .map((r) => r.note)
                              .filter(Boolean)
                              .join('; ') || '-'}
                          </span>
                        </TableCell>

                        {/* Thao tác xóa tất cả vai trò của thành viên */}
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAllRoles(item.member)}
                            title={`Xóa tất cả phân công của ${item.member.fullName}`}
                            className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog Thêm Phân Công Hỗ Trợ 1 Người Nhiều Vai Trò */}
      <AssignMemberDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        isLoading={batchAssignMutation.isPending}
        existingAssignments={assignments?.map((a) => ({
          memberId: a.memberId,
          positionId: a.positionId,
          memberName: a.member.fullName,
          positionName: a.position.name,
        })) ?? []}
      />

      {/* Dialog Xác Nhận Hủy Phân Công */}
      <ConfirmDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title={confirmDelete?.isAll ? 'Hủy toàn bộ phân công của thành viên' : 'Hủy vai trò phân công'}
        description={
          confirmDelete?.isAll
            ? `Bạn có chắc muốn hủy tất cả các vai trò phân công của "${confirmDelete?.memberName}" trong sự kiện này?`
            : `Bạn có chắc muốn hủy vai trò "${confirmDelete?.positionName}" của "${confirmDelete?.memberName}"?`
        }
        onConfirm={() => {
          if (confirmDelete) {
            removeMutation.mutate(
              confirmDelete.isAll
                ? confirmDelete.memberId
                : {
                    memberId: confirmDelete.memberId,
                    positionId: confirmDelete.positionId,
                    assignmentId: confirmDelete.assignmentId,
                  },
              {
                onSuccess: () => setConfirmDelete(null),
              },
            );
          }
        }}
        isLoading={removeMutation.isPending}
      />
    </div>
  );
}

export default function AssignmentsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <AssignmentsContent />
    </Suspense>
  );
}

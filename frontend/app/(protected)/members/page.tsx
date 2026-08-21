'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Ban,
  Search,
  Users,
  UserCheck,
  UserX,
  CreditCard,
  QrCode,
  Phone,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationBar } from '@/components/tables/PaginationBar';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { ConfirmDialog } from '@/components/forms/ConfirmDialog';
import { MemberFormDialog } from '@/components/forms/MemberFormDialog';
import { MemberQrPreviewDialog } from '@/components/forms/MemberQrPreviewDialog';
import {
  useCreateMember,
  useMembers,
  useMemberStats,
  useRemoveMember,
  useUpdateMember,
} from '@/hooks/useMembers';
import { useTeams } from '@/hooks/useTeams';
import { Member } from '@/types/models';
import { MEMBER_STATUSES, STATUS_LABELS } from '@/types/enums';
import { MemberInput } from '@/services/member.service';

const ALL_VALUE = '__all__';

// Helper tạo màu avatar dựa theo tên
function getAvatarBg(name: string) {
  const colors = [
    'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
    'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function MembersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [teamId, setTeamId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [confirmMember, setConfirmMember] = useState<Member | null>(null);
  const [previewQrMember, setPreviewQrMember] = useState<Member | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Debounce search input (300ms) để tối ưu hiệu năng
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const { data: teams } = useTeams();
  const { data: stats } = useMemberStats();

  const { data, isLoading } = useMembers({
    page,
    limit,
    search: debouncedSearch || undefined,
    teamId,
    status: status as Member['status'] | undefined,
  });

  const createMutation = useCreateMember();
  const updateMutation = useUpdateMember();
  const removeMutation = useRemoveMember();

  const handleSubmit = (values: MemberInput) => {
    if (editingMember) {
      updateMutation.mutate(
        { id: editingMember.id, input: values },
        { onSuccess: () => setFormOpen(false) }
      );
    } else {
      createMutation.mutate(values, { onSuccess: () => setFormOpen(false) });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`Đã sao chép ${label}`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const hasFilter = Boolean(searchInput || teamId || status);

  const resetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setTeamId(undefined);
    setStatus(undefined);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Nút thêm mới */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-6 text-amber-500" />
            Quản Lý Nhân Sự & Thành Viên
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Quản lý hồ sơ, chức vụ, đội nhóm và thông tin thanh toán VietQR của các thành viên CLB
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingMember(null);
            setFormOpen(true);
          }}
          className="rounded-2xl gap-2 font-semibold shadow-sm"
        >
          <Plus className="size-4" />
          Thêm thành viên mới
        </Button>
      </div>

      {/* 2. Thống kê KPI nhân sự nhanh */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-card border shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground">Tổng nhân sự</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{stats?.total ?? 0}</div>
          </div>
          <div className="size-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users className="size-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground">Đang hoạt động</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats?.active ?? 0}
            </div>
          </div>
          <div className="size-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <UserCheck className="size-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground">Tạm nghỉ / Khác</div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
              {(stats?.onLeave ?? 0) + (stats?.inactive ?? 0)}
            </div>
          </div>
          <div className="size-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <UserX className="size-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-card border shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-muted-foreground">Đã có TK ngân hàng</div>
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
              {stats?.withBank ?? 0} / {stats?.total ?? 0}
            </div>
          </div>
          <div className="size-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <CreditCard className="size-5" />
          </div>
        </div>
      </div>

      {/* 3. Bộ lọc & Tìm kiếm */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 bg-card/60 p-2.5 rounded-2xl border border-border/80 shadow-2xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, mã (M001), SĐT, STK ngân hàng..."
            className="pl-9 h-9 text-xs rounded-xl bg-background"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <Select
          value={teamId ?? ALL_VALUE}
          onValueChange={(v) => {
            setTeamId(v === ALL_VALUE ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-44 h-9 text-xs rounded-xl bg-background font-medium">
            <SelectValue placeholder="Tất cả đội" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tất cả đội</SelectItem>
            {teams?.map((team) => (
              <SelectItem key={team.id} value={team.id} className="text-xs">
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status ?? ALL_VALUE}
          onValueChange={(v) => {
            setStatus(v === ALL_VALUE ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-40 h-9 text-xs rounded-xl bg-background font-medium">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tất cả trạng thái</SelectItem>
            {MEMBER_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilter && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-xl"
            title="Xóa bộ lọc"
          >
            <RotateCcw className="size-3.5 mr-1" />
            Đặt lại
          </Button>
        )}
      </div>

      {/* 4. Bảng danh sách thành viên */}
      <div className="rounded-2xl border bg-card shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-12">
            <LoadingState />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="py-12">
            <EmptyState label="Không tìm thấy thành viên nào phù hợp với điều kiện tìm kiếm" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-16 text-center font-bold text-xs">Mã</TableHead>
                    <TableHead className="font-bold text-xs min-w-[200px]">Họ tên thành viên</TableHead>
                    <TableHead className="font-bold text-xs min-w-[130px]">Đội / Nhóm</TableHead>
                    <TableHead className="font-bold text-xs min-w-[130px]">Chức vụ</TableHead>
                    <TableHead className="font-bold text-xs min-w-[120px]">Số điện thoại</TableHead>
                    <TableHead className="font-bold text-xs min-w-[210px]">Tài khoản ngân hàng</TableHead>
                    <TableHead className="font-bold text-xs text-center min-w-[110px]">Trạng thái</TableHead>
                    <TableHead className="font-bold text-xs text-right pr-4">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/50">
                  {data.items.map((member) => {
                    const avatarStyle = getAvatarBg(member.fullName);
                    const initials = getInitials(member.fullName);

                    return (
                      <TableRow
                        key={member.id}
                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                        onClick={() => {
                          setEditingMember(member);
                          setFormOpen(true);
                        }}
                      >
                        {/* 1. Mã thành viên */}
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded-md bg-muted text-foreground">
                            {member.memberCode}
                          </span>
                        </TableCell>

                        {/* 2. Avatar & Họ tên */}
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`size-8 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 ${avatarStyle}`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-xs text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate">
                                {member.fullName}
                              </div>
                              {member.note && (
                                <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                  {member.note}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* 3. Đội nhóm */}
                        <TableCell>
                          {member.teams && member.teams.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {member.teams.map((team) => (
                                <Badge
                                  key={team.id}
                                  variant="outline"
                                  className="text-[10px] py-0 font-medium bg-muted/40"
                                >
                                  {team.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* 4. Chức vụ */}
                        <TableCell>
                          {member.positions && member.positions.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {member.positions.map((position) => (
                                <Badge
                                  key={position.id}
                                  variant="secondary"
                                  className="text-[10px] py-0 font-medium bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-200/50"
                                >
                                  {position.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* 5. Số điện thoại */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {member.phone ? (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`tel:${member.phone}`}
                                className="font-mono text-xs text-foreground hover:text-amber-600 dark:hover:text-amber-400 hover:underline flex items-center gap-1"
                              >
                                <Phone className="size-3 text-muted-foreground" />
                                {member.phone}
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        {/* 6. Tài khoản VietQR */}
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {member.bankAccount ? (
                            <div className="flex items-center justify-between gap-2 max-w-[220px] p-1 rounded-xl bg-muted/20 border border-border/60">
                              <div className="flex items-center gap-2 min-w-0">
                                {member.bank?.logo ? (
                                  <div className="relative size-5 shrink-0 rounded overflow-hidden bg-white p-0.5 border">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={member.bank.logo}
                                      alt={member.bank.shortName}
                                      className="w-full h-full object-contain"
                                      onError={(e) => {
                                        (e.target as any).style.display = 'none';
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <CreditCard className="size-4 text-amber-500 shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <div className="font-mono font-bold text-xs text-foreground truncate">
                                    {member.bankAccount}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate">
                                    {member.bank?.shortName || member.bankName || 'Ngân hàng'}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-0.5 shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-6 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg"
                                  onClick={() => setPreviewQrMember(member)}
                                  title="Xem trước mã VietQR"
                                >
                                  <QrCode className="size-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="size-6 text-muted-foreground hover:text-foreground rounded-lg"
                                  onClick={() => copyToClipboard(member.bankAccount!, 'Số tài khoản')}
                                  title="Sao chép số tài khoản"
                                >
                                  {copiedText === member.bankAccount ? (
                                    <Check className="size-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="size-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/70 italic flex items-center gap-1">
                              <CreditCard className="size-3 text-muted-foreground/40" /> Chưa có
                            </span>
                          )}
                        </TableCell>

                        {/* 7. Trạng thái (Đổi nhanh trực tiếp) */}
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={member.status}
                            onValueChange={(newStatus) => {
                              updateMutation.mutate({
                                id: member.id,
                                input: { status: newStatus as Member['status'] },
                              });
                            }}
                          >
                            <SelectTrigger className="h-7 w-[125px] text-[11px] font-bold rounded-lg border shadow-none px-2 mx-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="center">
                              <SelectItem value="ACTIVE" className="text-xs font-semibold text-emerald-600">
                                🟢 Hoạt động
                              </SelectItem>
                              <SelectItem value="ON_LEAVE" className="text-xs font-semibold text-amber-600">
                                🟡 Tạm nghỉ
                              </SelectItem>
                              <SelectItem value="INACTIVE" className="text-xs font-semibold text-zinc-500">
                                ⚫ Ngưng HĐ
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* 8. Thao tác */}
                        <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                              onClick={() => {
                                setEditingMember(member);
                                setFormOpen(true);
                              }}
                              title="Chỉnh sửa thông tin"
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            {member.status === 'ACTIVE' ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-lg text-rose-500/80 hover:text-rose-600 hover:bg-rose-500/10"
                                onClick={() => setConfirmMember(member)}
                                title="Vô hiệu hóa thành viên"
                              >
                                <Ban className="size-3.5" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                                onClick={() => {
                                  updateMutation.mutate({
                                    id: member.id,
                                    input: { status: 'ACTIVE' },
                                  });
                                }}
                                title="Kích hoạt lại thành viên"
                              >
                                <UserCheck className="size-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

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
                  </SelectContent>
                </Select>
                <span>thành viên / trang</span>
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

      {/* Modal Thêm / Cập nhật Thành viên */}
      <MemberFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        member={editingMember}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Modal Xác nhận Vô hiệu hóa */}
      <ConfirmDialog
        open={!!confirmMember}
        onOpenChange={(open) => !open && setConfirmMember(null)}
        title="Vô hiệu hóa thành viên"
        description={`Bạn có chắc chắn muốn chuyển trạng thái của "${confirmMember?.fullName}" sang ngưng hoạt động?`}
        onConfirm={() => {
          if (confirmMember) {
            removeMutation.mutate(confirmMember.id, {
              onSuccess: () => setConfirmMember(null),
            });
          }
        }}
        isLoading={removeMutation.isPending}
      />

      {/* Modal Xem Trước Mã VietQR */}
      <MemberQrPreviewDialog
        open={!!previewQrMember}
        onOpenChange={(open) => !open && setPreviewQrMember(null)}
        member={previewQrMember}
      />
    </div>
  );
}

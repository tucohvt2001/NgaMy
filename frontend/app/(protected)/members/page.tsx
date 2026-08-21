'use client';

import { useState } from 'react';
import { Plus, Pencil, Ban, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationBar } from '@/components/tables/PaginationBar';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { ConfirmDialog } from '@/components/forms/ConfirmDialog';
import { MemberFormDialog } from '@/components/forms/MemberFormDialog';
import { useCreateMember, useMembers, useRemoveMember, useUpdateMember } from '@/hooks/useMembers';
import { useTeams } from '@/hooks/useTeams';
import { Member } from '@/types/models';
import { MEMBER_STATUSES, STATUS_LABELS } from '@/types/enums';
import { MemberInput } from '@/services/member.service';

const ALL_VALUE = '__all__';

export default function MembersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [teamId, setTeamId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [confirmMember, setConfirmMember] = useState<Member | null>(null);

  const { data: teams } = useTeams();
  const { data, isLoading } = useMembers({
    page,
    limit: 10,
    search: search || undefined,
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
        { onSuccess: () => setFormOpen(false) },
      );
    } else {
      createMutation.mutate(values, { onSuccess: () => setFormOpen(false) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Thành viên</h1>
          <p className="text-muted-foreground">Quản lý danh sách thành viên CLB</p>
        </div>
        <Button
          onClick={() => {
            setEditingMember(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Thêm thành viên
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, mã, số điện thoại..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={teamId ?? ALL_VALUE}
          onValueChange={(v) => {
            setTeamId(v === ALL_VALUE ? undefined : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Tất cả đội" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tất cả đội</SelectItem>
            {teams?.map((team) => (
              <SelectItem key={team.id} value={team.id}>
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
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Tất cả trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tất cả trạng thái</SelectItem>
            {MEMBER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-background">
        {isLoading ? (
          <LoadingState />
        ) : !data || data.items.length === 0 ? (
          <EmptyState label="Không tìm thấy thành viên nào" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Đội</TableHead>
                  <TableHead>Chức vụ</TableHead>
                  <TableHead>SĐT</TableHead>
                  <TableHead>Tài khoản ngân hàng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.memberCode}</TableCell>
                    <TableCell>{member.fullName}</TableCell>
                    <TableCell>
                      {member.teams && member.teams.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.teams.map((team) => (
                            <Badge key={team.id} variant="outline">
                              {team.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {member.positions && member.positions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {member.positions.map((position) => (
                            <Badge key={position.id} variant="outline">
                              {position.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{member.phone ?? '-'}</TableCell>
                    <TableCell>
                      {member.bankAccount ? (
                        <div className="flex items-center gap-2">
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
                          ) : null}
                          <div className="text-xs">
                            <div className="font-mono font-semibold text-foreground">
                              {member.bankAccount}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {member.bank?.shortName || member.bankName || 'Ngân hàng'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Chưa có</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={member.status === 'ACTIVE' ? 'success' : 'secondary'}>
                        {STATUS_LABELS[member.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingMember(member);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmMember(member)}>
                        <Ban className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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

      <MemberFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        member={editingMember}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!confirmMember}
        onOpenChange={(open) => !open && setConfirmMember(null)}
        title="Vô hiệu hóa thành viên"
        description={`Bạn có chắc muốn vô hiệu hóa "${confirmMember?.fullName}"?`}
        onConfirm={() => {
          if (confirmMember) {
            removeMutation.mutate(confirmMember.id, { onSuccess: () => setConfirmMember(null) });
          }
        }}
        isLoading={removeMutation.isPending}
      />
    </div>
  );
}

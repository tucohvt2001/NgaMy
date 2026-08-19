'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { ConfirmDialog } from '@/components/forms/ConfirmDialog';
import { TeamFormDialog } from '@/components/forms/TeamFormDialog';
import { useCreateTeam, useRemoveTeam, useTeams, useUpdateTeam } from '@/hooks/useTeams';
import { Team } from '@/types/models';
import { TeamInput } from '@/services/team.service';

export default function TeamsPage() {
  const { data: teams, isLoading } = useTeams();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [confirmTeam, setConfirmTeam] = useState<Team | null>(null);

  const createMutation = useCreateTeam();
  const updateMutation = useUpdateTeam();
  const removeMutation = useRemoveTeam();

  const handleSubmit = (values: TeamInput) => {
    if (editingTeam) {
      updateMutation.mutate({ id: editingTeam.id, input: values }, { onSuccess: () => setFormOpen(false) });
    } else {
      createMutation.mutate(values, { onSuccess: () => setFormOpen(false) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Đội / Nhóm</h1>
          <p className="text-muted-foreground">Quản lý các đội trong CLB (Lân, Sư, Trống, Nhạc, Hậu cần...)</p>
        </div>
        <Button
          onClick={() => {
            setEditingTeam(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Thêm đội/nhóm
        </Button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : !teams || teams.length === 0 ? (
        <EmptyState label="Chưa có đội/nhóm nào" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UsersRound className="size-4 text-primary" />
                  {team.name}
                </CardTitle>
                <Badge variant={team.isActive ? 'success' : 'secondary'}>
                  {team.isActive ? 'Hoạt động' : 'Ngừng'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{team.description || 'Không có mô tả'}</p>
                <p className="text-sm">Đội trưởng: {team.leader?.fullName ?? 'Chưa có'}</p>
                <p className="text-sm">Số thành viên: {team._count?.members ?? 0}</p>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingTeam(team);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="mr-1 size-4" />
                    Sửa
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setConfirmTeam(team)}>
                    <Trash2 className="mr-1 size-4" />
                    Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <TeamFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        team={editingTeam}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!confirmTeam}
        onOpenChange={(open) => !open && setConfirmTeam(null)}
        title="Xóa đội/nhóm"
        description={`Bạn có chắc muốn xóa "${confirmTeam?.name}"? Chỉ xóa được khi đội không còn thành viên.`}
        onConfirm={() => {
          if (confirmTeam) {
            removeMutation.mutate(confirmTeam.id, { onSuccess: () => setConfirmTeam(null) });
          }
        }}
        isLoading={removeMutation.isPending}
      />
    </div>
  );
}

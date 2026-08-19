'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { ConfirmDialog } from '@/components/forms/ConfirmDialog';
import { PositionFormDialog } from '@/components/forms/PositionFormDialog';
import { useCreatePosition, usePositions, useRemovePosition, useUpdatePosition } from '@/hooks/usePositions';
import { Position } from '@/types/models';
import { PositionInput } from '@/services/position.service';

export default function PositionsPage() {
  const { data: positions, isLoading } = usePositions();
  const [formOpen, setFormOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [confirmPosition, setConfirmPosition] = useState<Position | null>(null);

  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition();
  const removeMutation = useRemovePosition();

  const handleSubmit = (values: PositionInput) => {
    if (editingPosition) {
      updateMutation.mutate(
        { id: editingPosition.id, input: values },
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
          <h1 className="text-2xl font-bold">Chức vụ</h1>
          <p className="text-muted-foreground">Cấu hình chức vụ/vai trò biểu diễn (Lân đầu, Trống, Đội trưởng...)</p>
        </div>
        <Button
          onClick={() => {
            setEditingPosition(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Thêm chức vụ
        </Button>
      </div>

      <div className="rounded-md border bg-background">
        {isLoading ? (
          <LoadingState />
        ) : !positions || positions.length === 0 ? (
          <EmptyState label="Chưa có chức vụ nào" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên chức vụ</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => (
                <TableRow key={position.id}>
                  <TableCell className="font-medium">{position.name}</TableCell>
                  <TableCell>{position.description ?? '-'}</TableCell>
                  <TableCell>
                    <Badge variant={position.isActive ? 'success' : 'secondary'}>
                      {position.isActive ? 'Hoạt động' : 'Ngừng'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingPosition(position);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmPosition(position)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <PositionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        position={editingPosition}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={!!confirmPosition}
        onOpenChange={(open) => !open && setConfirmPosition(null)}
        title="Xóa chức vụ"
        description={`Bạn có chắc muốn xóa "${confirmPosition?.name}"?`}
        onConfirm={() => {
          if (confirmPosition) {
            removeMutation.mutate(confirmPosition.id, { onSuccess: () => setConfirmPosition(null) });
          }
        }}
        isLoading={removeMutation.isPending}
      />
    </div>
  );
}

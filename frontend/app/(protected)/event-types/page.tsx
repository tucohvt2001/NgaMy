'use client';

import { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  Info,
  CalendarHeart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EventTypeFormDialog } from '@/components/forms/EventTypeFormDialog';
import { ConfirmDialog } from '@/components/forms/ConfirmDialog';
import {
  useEventTypes,
  useCreateEventType,
  useUpdateEventType,
  useRemoveEventType,
} from '@/hooks/useEventTypes';
import { EventTypeModel } from '@/types/models';
import { EventTypeInput } from '@/services/eventType.service';
import { useAuthStore } from '@/stores/authStore';

export default function EventTypesPage() {
  const user = useAuthStore((state) => state.user);
  const canManage = user?.permissions.includes('event:create') || user?.permissions.includes('event:update');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EventTypeModel | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: eventTypes = [], isLoading } = useEventTypes();
  const createMutation = useCreateEventType();
  const updateMutation = useUpdateEventType();
  const removeMutation = useRemoveEventType();

  const filteredItems = useMemo(() => {
    return eventTypes.filter((item) => {
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && item.isActive) ||
        (statusFilter === 'INACTIVE' && !item.isActive);

      return matchSearch && matchStatus;
    });
  }, [eventTypes, search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (item: EventTypeModel) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleFormSubmit = (values: EventTypeInput) => {
    if (editingItem) {
      updateMutation.mutate(
        { id: editingItem.id, input: values },
        {
          onSuccess: () => setFormOpen(false),
        },
      );
    } else {
      createMutation.mutate(values, {
        onSuccess: () => setFormOpen(false),
      });
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteId) return;
    removeMutation.mutate(deleteId, {
      onSuccess: () => setDeleteId(null),
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <CalendarHeart className="size-7 text-amber-500" />
            Quản Lý Loại Show Diễn
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Danh mục các loại sự kiện (Khai trương, Trung thu, Tết, Lễ hội...) dùng để phân loại lịch diễn và thiết lập mức lương tương ứng.
          </p>
        </div>

        {canManage && (
          <Button
            onClick={handleOpenCreate}
            className="rounded-2xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs gap-1.5 shadow-md shadow-amber-500/20 shrink-0 self-start sm:self-auto"
          >
            <Plus className="size-4" />
            Thêm loại show
          </Button>
        )}
      </div>

      {/* 2. Thanh tìm kiếm & lọc */}
      <div className="p-4 rounded-3xl bg-card border border-border/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã loại show..."
            className="h-9 text-xs pl-9 rounded-2xl bg-background"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-background border border-border shrink-0 self-start sm:self-auto">
          <Button
            type="button"
            variant={statusFilter === 'ALL' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('ALL')}
            className="h-7 text-xs px-2.5 rounded-lg font-semibold"
          >
            Tất cả ({eventTypes.length})
          </Button>
          <Button
            type="button"
            variant={statusFilter === 'ACTIVE' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('ACTIVE')}
            className="h-7 text-xs px-2.5 rounded-lg font-semibold text-emerald-600 dark:text-emerald-400"
          >
            Kích hoạt ({eventTypes.filter((e) => e.isActive).length})
          </Button>
          <Button
            type="button"
            variant={statusFilter === 'INACTIVE' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setStatusFilter('INACTIVE')}
            className="h-7 text-xs px-2.5 rounded-lg font-semibold text-muted-foreground"
          >
            Tạm ẩn ({eventTypes.filter((e) => !e.isActive).length})
          </Button>
        </div>
      </div>

      {/* 3. Bảng danh sách */}
      <div className="rounded-3xl border border-border/80 overflow-hidden shadow-xs bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-12 text-center text-xs font-bold">STT</TableHead>
              <TableHead className="min-w-[140px] text-xs font-bold">Mã loại show</TableHead>
              <TableHead className="min-w-[200px] text-xs font-bold">Tên loại show & Nhãn badge</TableHead>
              <TableHead className="min-w-[250px] text-xs font-bold">Mô tả</TableHead>
              <TableHead className="w-32 text-center text-xs font-bold">Trạng thái</TableHead>
              {canManage && <TableHead className="w-24 text-right text-xs font-bold">Thao tác</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="h-32 text-center text-xs text-muted-foreground">
                  Đang tải danh sách loại show...
                </TableCell>
              </TableRow>
            ) : filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 6 : 5} className="h-32 text-center text-xs text-muted-foreground">
                  Không tìm thấy loại show diễn nào.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item, idx) => {
                const color = item.color || '#f59e0b';
                return (
                  <TableRow key={item.id} className="hover:bg-muted/20">
                    <TableCell className="text-center font-mono text-xs text-muted-foreground">
                      {idx + 1}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-foreground">
                      {item.code}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold px-2.5 py-1 rounded-full border shadow-xs"
                          style={{
                            backgroundColor: `${color}18`,
                            color: color,
                            borderColor: `${color}40`,
                          }}
                        >
                          {item.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.description || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.isActive ? (
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                        >
                          <CheckCircle2 className="size-3 mr-1" />
                          Kích hoạt
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[11px] font-medium text-muted-foreground"
                        >
                          <XCircle className="size-3 mr-1" />
                          Tạm ẩn
                        </Badge>
                      )}
                    </TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                            className="size-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(item.id)}
                            className="size-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <EventTypeFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        eventType={editingItem}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Xác nhận xóa loại show"
        description="Bạn có chắc chắn muốn xóa loại show này? Lưu ý: Việc xóa có thể ảnh hưởng đến hiển thị của các sự kiện đã gán loại này trước đó."
        confirmLabel="Xóa loại show"
        onConfirm={handleConfirmDelete}
        isLoading={removeMutation.isPending}
      />
    </div>
  );
}

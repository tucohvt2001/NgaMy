'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Ban, Search, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationBar } from '@/components/tables/PaginationBar';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { ConfirmDialog } from '@/components/forms/ConfirmDialog';
import { EventFormDialog } from '@/components/forms/EventFormDialog';
import { useCancelEvent, useCreateEvent, useEvents, useUpdateEvent } from '@/hooks/useEvents';
import { EventItem } from '@/types/models';
import { EVENT_STATUSES, STATUS_LABELS } from '@/types/enums';
import { EventInput } from '@/services/event.service';

const ALL_VALUE = '__all__';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN');
}

export default function SchedulesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [confirmEvent, setConfirmEvent] = useState<EventItem | null>(null);

  const { data, isLoading } = useEvents({
    page,
    limit: 10,
    search: search || undefined,
    status: status as EventItem['status'] | undefined,
  });

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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lịch diễn</h1>
          <p className="text-muted-foreground">Quản lý các sự kiện biểu diễn của CLB</p>
        </div>
        <Button
          onClick={() => {
            setEditingEvent(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" />
          Tạo sự kiện
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, mã sự kiện, địa điểm..."
            className="pl-9"
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
          <SelectTrigger className="sm:w-52">
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
      </div>

      <div className="rounded-md border bg-background">
        {isLoading ? (
          <LoadingState />
        ) : !data || data.items.length === 0 ? (
          <EmptyState label="Chưa có sự kiện nào" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên sự kiện</TableHead>
                  <TableHead>Ngày diễn</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead>Số người tham gia</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.eventCode}</TableCell>
                    <TableCell>{event.name}</TableCell>
                    <TableCell>{formatDate(event.eventDate)}</TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell>{event._count?.eventMembers ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={event.status === 'CANCELLED' ? 'destructive' : 'secondary'}>
                        {STATUS_LABELS[event.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
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
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setConfirmEvent(event)}>
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

      <EventFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        event={editingEvent}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
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

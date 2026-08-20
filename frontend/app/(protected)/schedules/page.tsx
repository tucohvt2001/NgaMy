'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, Pencil, Ban, Search, ClipboardList, Coins, CheckCircle2, AlertCircle, ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PaginationBar } from '@/components/tables/PaginationBar';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { ConfirmDialog } from '@/components/forms/ConfirmDialog';
import { EventFormDialog } from '@/components/forms/EventFormDialog';
import { EventSettlementDialog } from '@/components/forms/EventSettlementDialog';
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
  const [settlementFilter, setSettlementFilter] = useState<string>(ALL_VALUE);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [confirmEvent, setConfirmEvent] = useState<EventItem | null>(null);
  const [settlementEvent, setSettlementEvent] = useState<EventItem | null>(null);
  const [settlementOpen, setSettlementOpen] = useState(false);

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

  const filteredItems = data?.items.filter((item) => {
    const isSettled = (item._count?.transactions ?? 0) > 0;
    if (settlementFilter === 'SETTLED') return isSettled;
    if (settlementFilter === 'UNSETTLED') return !isSettled;
    return true;
  }) ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lịch diễn</h1>
          <p className="text-sm text-muted-foreground">Quản lý các sự kiện và lịch biểu diễn của đoàn</p>
        </div>
        <Button
          onClick={() => {
            setEditingEvent(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 size-4" /> Tạo sự kiện
        </Button>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên sự kiện, mã sự kiện hoặc địa điểm..."
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
          <SelectTrigger className="sm:w-48">
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

        <Select
          value={settlementFilter}
          onValueChange={(v) => {
            setSettlementFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="sm:w-48">
            <SelectValue placeholder="Tất cả quyết toán" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tất cả quyết toán</SelectItem>
            <SelectItem value="UNSETTLED">🟡 Chưa quyết toán</SelectItem>
            <SelectItem value="SETTLED">🟢 Đã quyết toán</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground px-1 py-1 bg-muted/20 rounded-md border">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-foreground">Thời gian diễn:</span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-500/20" />
            <strong className="text-emerald-700 dark:text-emerald-400">Sắp tới</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-amber-500 inline-block ring-2 ring-amber-500/20" />
            <strong className="text-amber-700 dark:text-amber-400">Hôm nay</strong>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-slate-400 inline-block" />
            <span>Đã qua</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-semibold text-foreground">Sổ quỹ:</span>
          <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="size-3.5" /> Đã quyết toán
          </span>
          <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium">
            <AlertCircle className="size-3.5" /> Chưa quyết toán
          </span>
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
                  <TableHead className="w-32">Mã</TableHead>
                  <TableHead>Tên sự kiện</TableHead>
                  <TableHead className="w-44">Ngày giờ diễn</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead className="w-28">Số người</TableHead>
                  <TableHead className="w-36">Quyết toán thu chi</TableHead>
                  <TableHead className="w-28">Trạng thái</TableHead>
                  <TableHead className="text-right w-40">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((event) => {
                  const evDate = new Date(event.eventDate);
                  const now = new Date();
                  const isToday = evDate.toDateString() === now.toDateString();
                  const isPast = !isToday && evDate.getTime() < now.getTime();
                  const isUpcoming = !isToday && evDate.getTime() > now.getTime();
                  const isSettled = (event._count?.transactions ?? 0) > 0;

                  return (
                    <TableRow
                      key={event.id}
                      className={`transition-colors ${
                        isToday
                          ? 'bg-amber-500/10 hover:bg-amber-500/15 border-l-4 border-l-amber-500'
                          : isUpcoming
                          ? 'bg-emerald-500/5 hover:bg-emerald-500/10 border-l-4 border-l-emerald-500 font-medium'
                          : 'opacity-75 hover:opacity-100 bg-muted/20 hover:bg-muted/40 border-l-4 border-l-slate-300 dark:border-l-slate-700'
                      }`}
                    >
                      <TableCell className="font-mono text-xs">
                        <span className={isUpcoming ? 'font-bold text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'}>
                          {event.eventCode}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-foreground">{event.name}</div>
                        {event.customerName && (
                          <div className="text-[11px] text-muted-foreground">
                            Khách: {event.customerName}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-foreground">
                            {evDate.toLocaleDateString('vi-VN')}
                          </span>
                          {isToday ? (
                            <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40 text-[9px] px-1 py-0 h-4">
                              Hôm nay
                            </Badge>
                          ) : isUpcoming ? (
                            <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 text-[9px] px-1 py-0 h-4">
                              Sắp tới
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 text-[9px] px-1 py-0 h-4">
                              Đã qua
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {evDate.toLocaleTimeString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{event.location}</TableCell>
                      <TableCell className="text-xs">{event._count?.eventMembers ?? 0} người</TableCell>
                      <TableCell>
                        {isSettled ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 text-[10px] gap-1 font-semibold">
                            <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                            Đã quyết toán ({event._count?.transactions} phiếu)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] gap-1 font-medium bg-amber-50/60 dark:bg-amber-950/20">
                            <AlertCircle className="size-3 text-amber-600 dark:text-amber-400" />
                            Chưa quyết toán
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={event.status === 'CANCELLED' ? 'destructive' : 'secondary'} className="text-[10px]">
                          {STATUS_LABELS[event.status]}
                        </Badge>
                      </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSettlementEvent(event);
                          setSettlementOpen(true);
                        }}
                        className={
                          isSettled
                            ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            : 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        }
                        title={isSettled ? 'Xem / Lập thêm quyết toán show' : 'Quyết toán show & chia tiền thù lao'}
                      >
                        <Coins className="size-4" />
                      </Button>
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
                        title="Chỉnh sửa sự kiện"
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmEvent(event)}
                        title="Hủy sự kiện"
                      >
                        <Ban className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      <EventSettlementDialog
        open={settlementOpen}
        onOpenChange={setSettlementOpen}
        event={settlementEvent}
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

'use client';

import { useState } from 'react';
import { CheckCircle2, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { useAttendanceList, useCheckIn, useCheckOut, useConfirmAttendance } from '@/hooks/useAttendance';
import { useEvents } from '@/hooks/useEvents';
import { useAuthStore } from '@/stores/authStore';
import { ATTENDANCE_STATUSES, STATUS_LABELS } from '@/types/enums';

const ALL_VALUE = '__all__';

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  return new Date(value).toLocaleString('vi-VN');
}

export default function AttendancePage() {
  const [eventId, setEventId] = useState<string | undefined>();
  const [status, setStatus] = useState<string | undefined>();
  const user = useAuthStore((state) => state.user);
  const canCheck = user?.permissions.includes('attendance:check');
  const canConfirm = user?.permissions.includes('attendance:confirm');

  const { data: eventsData } = useEvents({ page: 1, limit: 100 });
  const { data, isLoading } = useAttendanceList({ eventId, status, page: 1, limit: 50 });

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const confirmMutation = useConfirmAttendance();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Chấm công</h1>
        <p className="text-muted-foreground">Check-in / check-out và xác nhận chấm công theo sự kiện</p>
      </div>

      {canCheck && (
        <div className="flex flex-col gap-3 rounded-md border bg-background p-4 sm:flex-row sm:items-center">
          <Select value={eventId ?? ''} onValueChange={setEventId}>
            <SelectTrigger className="sm:w-96">
              <SelectValue placeholder="Chọn sự kiện để check-in/out" />
            </SelectTrigger>
            <SelectContent>
              {eventsData?.items.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.eventCode} - {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={!eventId}
            isLoading={checkInMutation.isPending}
            onClick={() => eventId && checkInMutation.mutate(eventId)}
          >
            <LogIn className="mr-2 size-4" />
            Check-in
          </Button>
          <Button
            variant="outline"
            disabled={!eventId}
            isLoading={checkOutMutation.isPending}
            onClick={() => eventId && checkOutMutation.mutate(eventId)}
          >
            <LogOut className="mr-2 size-4" />
            Check-out
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Select value={eventId ?? ALL_VALUE} onValueChange={(v) => setEventId(v === ALL_VALUE ? undefined : v)}>
          <SelectTrigger className="sm:w-72">
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
        <Select value={status ?? ALL_VALUE} onValueChange={(v) => setStatus(v === ALL_VALUE ? undefined : v)}>
          <SelectTrigger className="sm:w-56">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>Tất cả trạng thái</SelectItem>
            {ATTENDANCE_STATUSES.map((s) => (
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
          <EmptyState label="Chưa có dữ liệu chấm công" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thành viên</TableHead>
                <TableHead>Sự kiện</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Trạng thái</TableHead>
                {canConfirm && <TableHead className="text-right">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((attendance) => (
                <TableRow key={attendance.id}>
                  <TableCell className="font-medium">{attendance.member?.fullName}</TableCell>
                  <TableCell>{attendance.event?.name}</TableCell>
                  <TableCell>{formatDateTime(attendance.checkInTime)}</TableCell>
                  <TableCell>{formatDateTime(attendance.checkOutTime)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{STATUS_LABELS[attendance.status] ?? attendance.status}</Badge>
                  </TableCell>
                  {canConfirm && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Xác nhận có mặt"
                        onClick={() =>
                          confirmMutation.mutate({ id: attendance.id, status: 'PRESENT' })
                        }
                      >
                        <CheckCircle2 className="size-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

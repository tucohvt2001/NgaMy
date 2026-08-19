'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { ConfirmDialog } from '@/components/forms/ConfirmDialog';
import { AssignMemberDialog } from '@/components/forms/AssignMemberDialog';
import { useAssignMember, useEventMembers, useEvents, useRemoveAssignment } from '@/hooks/useEvents';
import { EventMember } from '@/types/models';
import { STATUS_LABELS } from '@/types/enums';
import { AssignMemberInput } from '@/services/event.service';

function AssignmentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const eventId = searchParams.get('eventId') ?? undefined;

  const { data: eventsData } = useEvents({ page: 1, limit: 100 });
  const { data: assignments, isLoading } = useEventMembers(eventId);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmAssignment, setConfirmAssignment] = useState<EventMember | null>(null);

  const assignMutation = useAssignMember(eventId ?? '');
  const removeMutation = useRemoveAssignment(eventId ?? '');

  const handleSubmit = (values: AssignMemberInput) => {
    assignMutation.mutate(values, { onSuccess: () => setFormOpen(false) });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Phân công nhân sự</h1>
        <p className="text-muted-foreground">Phân công thành viên tham gia từng sự kiện</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select
          value={eventId ?? ''}
          onValueChange={(value) => router.push(`/assignments?eventId=${value}`)}
        >
          <SelectTrigger className="sm:w-96">
            <SelectValue placeholder="Chọn sự kiện để phân công" />
          </SelectTrigger>
          <SelectContent>
            {eventsData?.items.map((event) => (
              <SelectItem key={event.id} value={event.id}>
                {event.eventCode} - {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {eventId && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 size-4" />
            Phân công thành viên
          </Button>
        )}
      </div>

      {!eventId ? (
        <EmptyState label="Vui lòng chọn một sự kiện để xem/phân công nhân sự" />
      ) : (
        <div className="rounded-md border bg-background">
          {isLoading ? (
            <LoadingState />
          ) : !assignments || assignments.length === 0 ? (
            <EmptyState label="Chưa có ai được phân công cho sự kiện này" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thành viên</TableHead>
                  <TableHead>Vị trí</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ghi chú</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell className="font-medium">{assignment.member.fullName}</TableCell>
                    <TableCell>{assignment.position.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{STATUS_LABELS[assignment.status] ?? assignment.status}</Badge>
                    </TableCell>
                    <TableCell>{assignment.note ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setConfirmAssignment(assignment)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      <AssignMemberDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        isLoading={assignMutation.isPending}
      />

      <ConfirmDialog
        open={!!confirmAssignment}
        onOpenChange={(open) => !open && setConfirmAssignment(null)}
        title="Hủy phân công"
        description={`Bạn có chắc muốn hủy phân công của "${confirmAssignment?.member.fullName}"?`}
        onConfirm={() => {
          if (confirmAssignment) {
            removeMutation.mutate(confirmAssignment.memberId, {
              onSuccess: () => setConfirmAssignment(null),
            });
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

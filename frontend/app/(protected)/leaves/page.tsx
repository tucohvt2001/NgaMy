'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { useApproveLeave, useCreateLeave, useLeaves, useRejectLeave } from '@/hooks/useLeaves';
import { useAuthStore } from '@/stores/authStore';
import { STATUS_LABELS } from '@/types/enums';
import { LeaveInput } from '@/services/leave.service';

const leaveSchema = z
  .object({
    fromDate: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
    toDate: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
    reason: z.string().min(1, 'Vui lòng nhập lý do'),
  })
  .refine((data) => data.toDate >= data.fromDate, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['toDate'],
  });

type LeaveFormValues = z.infer<typeof leaveSchema>;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('vi-VN');
}

export default function LeavesPage() {
  const user = useAuthStore((state) => state.user);
  const canCreate = user?.permissions.includes('leave:create');
  const canApprove = user?.permissions.includes('leave:approve');

  const { data, isLoading } = useLeaves({ page: 1, limit: 50 });
  const [formOpen, setFormOpen] = useState(false);

  const createMutation = useCreateLeave();
  const approveMutation = useApproveLeave();
  const rejectMutation = useRejectLeave();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveFormValues>({ resolver: zodResolver(leaveSchema) });

  const onSubmit = (values: LeaveFormValues) => {
    const input: LeaveInput = {
      fromDate: new Date(values.fromDate).toISOString(),
      toDate: new Date(values.toDate).toISOString(),
      reason: values.reason,
    };
    createMutation.mutate(input, {
      onSuccess: () => {
        setFormOpen(false);
        reset();
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nghỉ phép</h1>
          <p className="text-muted-foreground">Gửi và duyệt đơn nghỉ phép của thành viên</p>
        </div>
        {canCreate && (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="mr-2 size-4" />
            Gửi đơn nghỉ
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-background">
        {isLoading ? (
          <LoadingState />
        ) : !data || data.items.length === 0 ? (
          <EmptyState label="Chưa có đơn nghỉ phép nào" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thành viên</TableHead>
                <TableHead>Từ ngày</TableHead>
                <TableHead>Đến ngày</TableHead>
                <TableHead>Lý do</TableHead>
                <TableHead>Trạng thái</TableHead>
                {canApprove && <TableHead className="text-right">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((leave) => (
                <TableRow key={leave.id}>
                  <TableCell className="font-medium">{leave.member?.fullName}</TableCell>
                  <TableCell>{formatDate(leave.fromDate)}</TableCell>
                  <TableCell>{formatDate(leave.toDate)}</TableCell>
                  <TableCell>{leave.reason}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        leave.status === 'APPROVED'
                          ? 'success'
                          : leave.status === 'REJECTED'
                            ? 'destructive'
                            : 'warning'
                      }
                    >
                      {STATUS_LABELS[leave.status] ?? leave.status}
                    </Badge>
                  </TableCell>
                  {canApprove && (
                    <TableCell className="text-right space-x-2">
                      {leave.status === 'PENDING' && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => approveMutation.mutate(leave.id)}>
                            <Check className="size-4 text-emerald-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => rejectMutation.mutate(leave.id)}>
                            <X className="size-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gửi đơn nghỉ phép</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromDate">Từ ngày</Label>
                <Input id="fromDate" type="date" {...register('fromDate')} />
                {errors.fromDate && <p className="text-sm text-destructive">{errors.fromDate.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="toDate">Đến ngày</Label>
                <Input id="toDate" type="date" {...register('toDate')} />
                {errors.toDate && <p className="text-sm text-destructive">{errors.toDate.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Lý do</Label>
              <Textarea id="reason" {...register('reason')} />
              {errors.reason && <p className="text-sm text-destructive">{errors.reason.message}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" isLoading={createMutation.isPending}>
                {createMutation.isPending ? 'Đang gửi...' : 'Gửi đơn'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

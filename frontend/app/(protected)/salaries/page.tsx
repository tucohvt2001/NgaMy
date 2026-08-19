'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calculator, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState, EmptyState } from '@/components/tables/States';
import { useCalculateSalary, useConfirmSalary, useSalaries } from '@/hooks/useSalaries';
import { useMembers } from '@/hooks/useMembers';
import { useAuthStore } from '@/stores/authStore';
import { CalculateSalaryInput } from '@/services/salary.service';

const calcSchema = z.object({
  memberId: z.string().min(1, 'Vui lòng chọn thành viên'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000),
  allowance: z.coerce.number().optional(),
  bonus: z.coerce.number().optional(),
  deduction: z.coerce.number().optional(),
});

type CalcFormValues = z.infer<typeof calcSchema>;

function formatCurrency(value: number) {
  return value.toLocaleString('vi-VN') + ' đ';
}

export default function SalariesPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [formOpen, setFormOpen] = useState(false);

  const user = useAuthStore((state) => state.user);
  const canManage = user?.permissions.includes('salary:manage');

  const { data, isLoading } = useSalaries({ month, year, page: 1, limit: 50 });
  const { data: memberData } = useMembers({ page: 1, limit: 200, status: 'ACTIVE' });
  const calculateMutation = useCalculateSalary();
  const confirmMutation = useConfirmSalary();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CalcFormValues>({
    resolver: zodResolver(calcSchema),
    defaultValues: { month, year },
  });

  const onSubmit = (values: CalcFormValues) => {
    const input: CalculateSalaryInput = values;
    calculateMutation.mutate(input, {
      onSuccess: () => {
        setFormOpen(false);
        reset();
      },
    });
  };

  const grandTotal = data?.items.reduce((sum, r) => sum + r.totalAmount, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tiền công</h1>
          <p className="text-muted-foreground">Tính và quản lý tiền công thành viên theo tháng</p>
        </div>
        {canManage && (
          <Button onClick={() => setFormOpen(true)}>
            <Calculator className="mr-2 size-4" />
            Tính tiền công
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <SelectItem key={m} value={String(m)}>
                Tháng {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[year - 1, year, year + 1].map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-background">
        {isLoading ? (
          <LoadingState />
        ) : !data || data.items.length === 0 ? (
          <EmptyState label="Chưa có dữ liệu tiền công cho tháng này" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Thành viên</TableHead>
                <TableHead>Số buổi</TableHead>
                <TableHead>Lương cơ bản</TableHead>
                <TableHead>Phụ cấp</TableHead>
                <TableHead>Thưởng</TableHead>
                <TableHead>Khấu trừ</TableHead>
                <TableHead>Tổng</TableHead>
                <TableHead>Trạng thái</TableHead>
                {canManage && <TableHead className="text-right">Thao tác</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.member?.fullName}</TableCell>
                  <TableCell>{record.totalSessions}</TableCell>
                  <TableCell>{formatCurrency(record.baseAmount)}</TableCell>
                  <TableCell>{formatCurrency(record.allowance)}</TableCell>
                  <TableCell>{formatCurrency(record.bonus)}</TableCell>
                  <TableCell>{formatCurrency(record.deduction)}</TableCell>
                  <TableCell className="font-semibold">{formatCurrency(record.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={record.status === 'CONFIRMED' ? 'success' : 'secondary'}>
                      {record.status === 'CONFIRMED' ? 'Đã xác nhận' : 'Nháp'}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      {record.status !== 'CONFIRMED' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Xác nhận"
                          onClick={() => confirmMutation.mutate(record.id)}
                        >
                          <CheckCircle2 className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {data && data.items.length > 0 && (
        <p className="text-right font-semibold">Tổng cộng: {formatCurrency(grandTotal)}</p>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tính tiền công</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Thành viên</Label>
              <Controller
                control={control}
                name="memberId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn thành viên" />
                    </SelectTrigger>
                    <SelectContent>
                      {memberData?.items.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.memberId && <p className="text-sm text-destructive">{errors.memberId.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month">Tháng</Label>
                <Input id="month" type="number" min={1} max={12} {...register('month')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Năm</Label>
                <Input id="year" type="number" {...register('year')} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="allowance">Phụ cấp</Label>
                <Input id="allowance" type="number" {...register('allowance')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonus">Thưởng</Label>
                <Input id="bonus" type="number" {...register('bonus')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deduction">Khấu trừ</Label>
                <Input id="deduction" type="number" {...register('deduction')} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={calculateMutation.isPending}>
                {calculateMutation.isPending ? 'Đang tính...' : 'Tính tiền công'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

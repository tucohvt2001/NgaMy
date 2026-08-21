'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/forms/MultiSelect';
import { BankSelect } from '@/components/ui/bank-select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTeams } from '@/hooks/useTeams';
import { usePositions } from '@/hooks/usePositions';
import { Member } from '@/types/models';
import { MEMBER_STATUSES, STATUS_LABELS } from '@/types/enums';
import { MemberInput } from '@/services/member.service';

const memberSchema = z.object({
  memberCode: z.string().optional(),
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  phone: z.string().optional(),
  address: z.string().optional(),
  teamIds: z.array(z.string()).optional(),
  positionIds: z.array(z.string()).optional(),
  status: z.enum(MEMBER_STATUSES).optional(),
  bankAccount: z.string().optional(),
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  bankBin: z.string().optional(),
  bankId: z.string().optional(),
  note: z.string().optional(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface MemberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
  onSubmit: (values: MemberInput) => void;
  isLoading?: boolean;
}

export function MemberFormDialog({ open, onOpenChange, member, onSubmit, isLoading }: MemberFormDialogProps) {
  const { data: teams } = useTeams();
  const { data: positions } = usePositions();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<MemberFormValues>({ resolver: zodResolver(memberSchema) });

  useEffect(() => {
    if (open) {
      reset({
        memberCode: member?.memberCode ?? '',
        fullName: member?.fullName ?? '',
        phone: member?.phone ?? '',
        address: member?.address ?? '',
        teamIds: member?.teams?.map((t) => t.id) ?? [],
        positionIds: member?.positions?.map((p) => p.id) ?? [],
        status: (member?.status as MemberFormValues['status']) ?? 'ACTIVE',
        bankAccount: member?.bankAccount ?? '',
        bankName: member?.bankName ?? '',
        bankCode: member?.bankCode ?? '',
        bankBin: member?.bankBin ?? '',
        bankId: member?.bankId ?? '',
        note: member?.note ?? '',
      });
    }
  }, [open, member, reset]);

  const submitHandler = (values: MemberFormValues) => {
    onSubmit({
      ...values,
      memberCode: member ? member.memberCode : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{member ? 'Cập nhật thành viên' : 'Thêm thành viên'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="memberCode" className="flex items-center justify-between">
                <span>Mã thành viên</span>
                {!member && (
                  <span className="text-[11px] text-emerald-600 font-medium">Tự động sinh</span>
                )}
              </Label>
              <Input
                id="memberCode"
                disabled
                placeholder={member ? member.memberCode : 'Tự động tạo mã (vd: M006)'}
                className="bg-muted/50 cursor-not-allowed font-mono text-xs"
                {...register('memberCode')}
              />
              {errors.memberCode && <p className="text-sm text-destructive">{errors.memberCode.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ tên *</Label>
              <Input id="fullName" placeholder="Nhập họ và tên..." {...register('fullName')} />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input id="phone" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input id="address" {...register('address')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Đội/nhóm (có thể chọn nhiều)</Label>
              <Controller
                control={control}
                name="teamIds"
                render={({ field }) => (
                  <MultiSelect
                    options={(teams ?? []).map((team) => ({ value: team.id, label: team.name }))}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Chọn đội/nhóm"
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Chức vụ (có thể chọn nhiều)</Label>
              <Controller
                control={control}
                name="positionIds"
                render={({ field }) => (
                  <MultiSelect
                    options={(positions ?? []).map((position) => ({ value: position.id, label: position.name }))}
                    value={field.value ?? []}
                    onChange={field.onChange}
                    placeholder="Chọn chức vụ"
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Trạng thái</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEMBER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {STATUS_LABELS[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Ngân hàng (VietQR)</Label>
              <Controller
                control={control}
                name="bankCode"
                render={({ field }) => (
                  <BankSelect
                    value={field.value || member?.bankCode || member?.bankName}
                    onChange={(bank) => {
                      field.onChange(bank?.code ?? '');
                      reset((prev) => ({
                        ...prev,
                        bankCode: bank?.code ?? '',
                        bankName: bank?.shortName ?? '',
                        bankBin: bank?.bin ?? '',
                        bankId: bank?.id ?? '',
                      }));
                    }}
                  />
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankAccount">Số tài khoản</Label>
              <Input
                id="bankAccount"
                placeholder="Nhập số tài khoản..."
                className="font-mono text-sm"
                {...register('bankAccount')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea id="note" {...register('note')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" isLoading={isLoading}>
              {isLoading ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

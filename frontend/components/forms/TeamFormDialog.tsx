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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Team } from '@/types/models';
import { TeamInput } from '@/services/team.service';
import { useMembers } from '@/hooks/useMembers';

const teamSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên đội/nhóm'),
  description: z.string().optional(),
  leaderId: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

const NONE_VALUE = '__none__';

interface TeamFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: Team | null;
  onSubmit: (values: TeamInput) => void;
  isLoading?: boolean;
}

export function TeamFormDialog({ open, onOpenChange, team, onSubmit, isLoading }: TeamFormDialogProps) {
  const { data: memberData } = useMembers({ page: 1, limit: 100 });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<TeamFormValues>({ resolver: zodResolver(teamSchema) });

  useEffect(() => {
    if (open) {
      reset({
        name: team?.name ?? '',
        description: team?.description ?? '',
        leaderId: team?.leaderId ?? undefined,
      });
    }
  }, [open, team, reset]);

  const submitHandler = (values: TeamFormValues) => {
    onSubmit({ ...values, leaderId: values.leaderId || null });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{team ? 'Cập nhật đội/nhóm' : 'Thêm đội/nhóm'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên đội/nhóm</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea id="description" {...register('description')} />
          </div>
          <div className="space-y-2">
            <Label>Đội trưởng</Label>
            <Controller
              control={control}
              name="leaderId"
              render={({ field }) => (
                <Select value={field.value ?? NONE_VALUE} onValueChange={(v) => field.onChange(v === NONE_VALUE ? undefined : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn đội trưởng" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>Chưa có đội trưởng</SelectItem>
                    {memberData?.items.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
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

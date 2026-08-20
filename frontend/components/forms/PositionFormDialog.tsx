'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Position } from '@/types/models';
import { PositionInput } from '@/services/position.service';

const positionSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên chức vụ'),
  description: z.string().optional(),
});

type PositionFormValues = z.infer<typeof positionSchema>;

interface PositionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: Position | null;
  onSubmit: (values: PositionInput) => void;
  isLoading?: boolean;
}

export function PositionFormDialog({
  open,
  onOpenChange,
  position,
  onSubmit,
  isLoading,
}: PositionFormDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PositionFormValues>({ resolver: zodResolver(positionSchema) });

  useEffect(() => {
    if (open) {
      reset({ name: position?.name ?? '', description: position?.description ?? '' });
    }
  }, [open, position, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{position ? 'Cập nhật chức vụ' : 'Thêm chức vụ'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên chức vụ</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea id="description" {...register('description')} />
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

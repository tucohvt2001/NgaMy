'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EventTypeModel } from '@/types/models';
import { EventTypeInput } from '@/services/eventType.service';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Palette } from 'lucide-react';

const PRESET_COLORS = [
  { label: 'Vàng Hổ Phách', value: '#f59e0b' },
  { label: 'Đỏ Lửa', value: '#ef4444' },
  { label: 'Cam Rực Rỡ', value: '#f97316' },
  { label: 'Hồng Hỷ Sự', value: '#ec4899' },
  { label: 'Tím Quý Phái', value: '#8b5cf6' },
  { label: 'Xanh Lam', value: '#3b82f6' },
  { label: 'Xanh Ngọc', value: '#10b981' },
  { label: 'Xám Tối Giản', value: '#64748b' },
];

const eventTypeSchema = z.object({
  code: z
    .string()
    .min(1, 'Vui lòng nhập mã loại show')
    .regex(/^[A-Za-z0-9_]+$/, 'Mã chỉ chứa chữ cái, số và dấu gạch dưới'),
  name: z.string().min(1, 'Vui lòng nhập tên loại show'),
  description: z.string().optional(),
  color: z.string().optional(),
  isActive: z.boolean().optional(),
});

type EventTypeFormValues = z.infer<typeof eventTypeSchema>;

interface EventTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventType?: EventTypeModel | null;
  onSubmit: (values: EventTypeInput) => void;
  isLoading?: boolean;
}

export function EventTypeFormDialog({
  open,
  onOpenChange,
  eventType,
  onSubmit,
  isLoading,
}: EventTypeFormDialogProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EventTypeFormValues>({
    resolver: zodResolver(eventTypeSchema),
    defaultValues: {
      code: '',
      name: '',
      description: '',
      color: '#f59e0b',
      isActive: true,
    },
  });

  const selectedColor = watch('color') || '#f59e0b';
  const nameValue = watch('name') || '';

  useEffect(() => {
    if (open) {
      reset({
        code: eventType?.code ?? '',
        name: eventType?.name ?? '',
        description: eventType?.description ?? '',
        color: eventType?.color ?? '#f59e0b',
        isActive: eventType?.isActive ?? true,
      });
    }
  }, [open, eventType, reset]);

  const submitHandler = (values: EventTypeFormValues) => {
    onSubmit({
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      description: values.description?.trim() || null,
      color: values.color || '#f59e0b',
      isActive: values.isActive ?? true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="size-5 text-amber-500" />
            {eventType ? 'Chỉnh sửa loại show' : 'Thêm loại show mới'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4 pt-2">
          {/* Xem trước Badge hiển thị */}
          <div className="p-3 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">Xem trước nhãn badge:</span>
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-full border shadow-xs transition-colors"
              style={{
                backgroundColor: `${selectedColor}18`,
                color: selectedColor,
                borderColor: `${selectedColor}40`,
              }}
            >
              {nameValue || 'Tên loại show'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-bold">
                Mã loại show *
              </Label>
              <Input
                id="code"
                disabled={!!eventType}
                placeholder="vd: KHAI_TRUONG"
                className="h-9 text-xs font-mono font-semibold rounded-xl uppercase"
                {...register('code')}
              />
              {errors.code && <p className="text-[11px] text-destructive">{errors.code.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold">
                Tên loại show *
              </Label>
              <Input
                id="name"
                placeholder="vd: Khai trương..."
                className="h-9 text-xs rounded-xl"
                {...register('name')}
              />
              {errors.name && <p className="text-[11px] text-destructive">{errors.name.message}</p>}
            </div>
          </div>

          {/* Chọn màu sắc đại diện */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold flex items-center gap-1.5">
                <Palette className="size-3.5 text-muted-foreground" />
                Màu sắc nhận diện
              </Label>
              <span className="font-mono text-[10px] text-muted-foreground">{selectedColor}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              {PRESET_COLORS.map((c) => {
                const isSelected = selectedColor === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setValue('color', c.value)}
                    title={c.label}
                    className={`size-6 rounded-full transition-all flex items-center justify-center ${
                      isSelected ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                );
              })}
              <div className="flex items-center gap-1 ml-auto">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setValue('color', e.target.value)}
                  className="size-6 rounded-lg cursor-pointer border-0 bg-transparent"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-bold">
              Mô tả chi tiết
            </Label>
            <Textarea
              id="description"
              rows={2}
              placeholder="vd: Show mừng khai trương văn phòng, cửa hàng..."
              className="text-xs rounded-xl resize-none"
              {...register('description')}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border/80">
            <div>
              <Label htmlFor="isActive" className="text-xs font-bold text-foreground cursor-pointer">
                Đang kích hoạt
              </Label>
              <p className="text-[11px] text-muted-foreground">Cho phép chọn khi tạo sự kiện và thiết lập lương</p>
            </div>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Checkbox
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={(val) => field.onChange(!!val)}
                />
              )}
            />
          </div>

          <DialogFooter className="pt-2 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={isLoading}
              className="rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs shadow-xs"
            >
              {eventType ? 'Lưu thay đổi' : 'Tạo mới'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

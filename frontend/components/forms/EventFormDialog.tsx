'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EventItem } from '@/types/models';
import { EVENT_STATUSES, STATUS_LABELS, EVENT_TYPES, EVENT_TYPE_LABELS } from '@/types/enums';
import { EventInput } from '@/services/event.service';

import { useEventTypes } from '@/hooks/useEventTypes';

const eventSchema = z.object({
  eventCode: z.string().optional(),
  name: z.string().min(1, 'Vui lòng nhập tên sự kiện'),
  eventType: z.string().optional(),
  eventDate: z.string().min(1, 'Vui lòng chọn ngày giờ diễn'),
  location: z.string().min(1, 'Vui lòng nhập địa điểm'),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  contractValue: z.coerce.number().optional(),
  status: z.enum(EVENT_STATUSES).optional(),
  description: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: EventItem | null;
  onSubmit: (values: EventInput) => void;
  isLoading?: boolean;
}

function formatForDateTimeLocal(dateStr?: string | null) {
  if (!dateStr) {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  }
  const d = new Date(dateStr);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function EventFormDialog({ open, onOpenChange, event, onSubmit, isLoading }: EventFormDialogProps) {
  const { data: dbEventTypes = [] } = useEventTypes({ isActive: true });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({ resolver: zodResolver(eventSchema) });

  useEffect(() => {
    if (open) {
      reset({
        eventCode: event?.eventCode ?? '',
        name: event?.name ?? '',
        eventType: event?.eventType ?? 'OTHER',
        eventDate: event?.eventDate ? formatForDateTimeLocal(event.eventDate) : formatForDateTimeLocal(),
        location: event?.location ?? '',
        customerName: event?.customerName ?? '',
        customerPhone: event?.customerPhone ?? '',
        contractValue: event?.contractValue ?? undefined,
        status: (event?.status as EventFormValues['status']) ?? 'DRAFT',
        description: event?.description ?? '',
      });
    }
  }, [open, event, reset]);

  const submitHandler = (values: EventFormValues) => {
    const dateObj = new Date(values.eventDate);
    const validDateIso = !isNaN(dateObj.getTime()) ? dateObj.toISOString() : new Date().toISOString();

    const payload: EventInput = {
      name: values.name.trim(),
      eventType: values.eventType || 'OTHER',
      location: values.location.trim(),
      eventDate: validDateIso,
      customerName: values.customerName?.trim() || undefined,
      customerPhone: values.customerPhone?.trim() || undefined,
      contractValue:
        values.contractValue !== undefined && !isNaN(Number(values.contractValue))
          ? Number(values.contractValue)
          : undefined,
      status: values.status || 'DRAFT',
      description: values.description?.trim() || undefined,
    };

    if (event?.eventCode) {
      payload.eventCode = event.eventCode;
    }

    onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{event ? 'Cập nhật sự kiện' : 'Tạo sự kiện'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventCode" className="flex items-center justify-between">
                <span>Mã sự kiện</span>
                {!event && <span className="text-[11px] text-emerald-600 font-medium">Tự động sinh</span>}
              </Label>
              <Input
                id="eventCode"
                disabled
                placeholder={event ? event.eventCode : 'Tự động tạo mã (vd: SK-202608-0001)'}
                className="bg-muted/50 cursor-not-allowed font-mono text-xs"
                {...register('eventCode')}
              />
              {errors.eventCode && <p className="text-sm text-destructive">{errors.eventCode.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDate">Ngày giờ biểu diễn *</Label>
              <Input id="eventDate" type="datetime-local" {...register('eventDate')} />
              {errors.eventDate && <p className="text-sm text-destructive">{errors.eventDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="name">Tên sự kiện / Show diễn *</Label>
              <Input id="name" placeholder="vd: Khai trương Thẩm mỹ viện..." {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Loại show diễn *</Label>
              <Controller
                control={control}
                name="eventType"
                render={({ field }) => (
                  <Select value={field.value || 'OTHER'} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn loại show..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dbEventTypes.length > 0
                        ? dbEventTypes.map((type) => (
                            <SelectItem key={type.code} value={type.code}>
                              <div className="flex items-center gap-2">
                                <span
                                  className="size-2 rounded-full inline-block"
                                  style={{ backgroundColor: type.color || '#f59e0b' }}
                                />
                                <span>{type.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        : EVENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {EVENT_TYPE_LABELS[type] || type}
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Địa điểm</Label>
            <Input id="location" {...register('location')} />
            {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Khách hàng</Label>
              <Input id="customerName" {...register('customerName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">SĐT khách hàng</Label>
              <Input id="customerPhone" {...register('customerPhone')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contractValue">Giá trị hợp đồng</Label>
              <Controller
                control={control}
                name="contractValue"
                render={({ field }) => (
                  <MoneyInput
                    id="contractValue"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="0"
                  />
                )}
              />
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
                      {EVENT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
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

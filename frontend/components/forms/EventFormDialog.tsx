'use client';

import { useEffect } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoneyInput } from '@/components/ui/money-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EventTimeRangePicker } from '@/components/ui/event-time-range-picker';
import { EventItem } from '@/types/models';
import { EVENT_STATUSES, STATUS_LABELS, EVENT_TYPES, EVENT_TYPE_LABELS } from '@/types/enums';
import { EventInput } from '@/services/event.service';
import { useEventTypes } from '@/hooks/useEventTypes';

const eventSchema = z.object({
  eventCode: z.string().optional(),
  name: z.string().min(1, 'Vui lòng nhập tên sự kiện'),
  eventType: z.string().optional(),
  eventDate: z.string().min(1, 'Vui lòng chọn ngày giờ diễn'),
  endTime: z.string().optional().nullable(),
  location: z.string().min(1, 'Vui lòng nhập địa điểm'),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  contractValue: z.coerce.number().optional(),
  depositAmount: z.coerce.number().optional(),
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

export function EventFormDialog({ open, onOpenChange, event, onSubmit, isLoading }: EventFormDialogProps) {
  const { data: dbEventTypes = [] } = useEventTypes({ isActive: true });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EventFormValues>({ resolver: zodResolver(eventSchema) });

  const contractVal = useWatch({ control, name: 'contractValue' }) || 0;
  const depositVal = useWatch({ control, name: 'depositAmount' }) || 0;
  const eventDateVal = useWatch({ control, name: 'eventDate' });
  const endTimeVal = useWatch({ control, name: 'endTime' });
  const remainingAmount = Math.max(0, Number(contractVal) - Number(depositVal));

  useEffect(() => {
    if (open) {
      reset({
        eventCode: event?.eventCode ?? '',
        name: event?.name ?? '',
        eventType: event?.eventType ?? 'OTHER',
        eventDate: event?.eventDate ? new Date(event.eventDate).toISOString() : new Date().toISOString(),
        endTime: event?.endTime ? new Date(event.endTime).toISOString() : '',
        location: event?.location ?? '',
        customerName: event?.customerName ?? '',
        customerPhone: event?.customerPhone ?? '',
        contractValue: event?.contractValue ?? undefined,
        depositAmount: event?.depositAmount ?? undefined,
        status: (event?.status as EventFormValues['status']) ?? 'DRAFT',
        description: event?.description ?? '',
      });
    }
  }, [open, event, reset]);

  const submitHandler = (values: EventFormValues) => {
    const dateObj = new Date(values.eventDate);
    const validDateIso = !isNaN(dateObj.getTime()) ? dateObj.toISOString() : new Date().toISOString();

    let validEndTimeIso: string | undefined = undefined;
    if (values.endTime) {
      const endObj = new Date(values.endTime);
      if (!isNaN(endObj.getTime())) {
        validEndTimeIso = endObj.toISOString();
      }
    }

    const payload: EventInput = {
      name: values.name.trim(),
      eventType: values.eventType || 'OTHER',
      location: values.location.trim(),
      eventDate: validDateIso,
      endTime: validEndTimeIso,
      customerName: values.customerName?.trim() || undefined,
      customerPhone: values.customerPhone?.trim() || undefined,
      contractValue:
        values.contractValue !== undefined && !isNaN(Number(values.contractValue))
          ? Number(values.contractValue)
          : undefined,
      depositAmount:
        values.depositAmount !== undefined && !isNaN(Number(values.depositAmount))
          ? Number(values.depositAmount)
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
      <DialogContent className="sm:max-w-xl max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{event ? 'Cập nhật sự kiện' : 'Tạo sự kiện'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventCode" className="flex items-center justify-between text-xs font-semibold">
                <span>Mã sự kiện</span>
                {!event && <span className="text-[10px] text-emerald-600 font-medium">Tự động sinh</span>}
              </Label>
              <Input
                id="eventCode"
                disabled
                placeholder={event ? event.eventCode : 'SK-YYYYMM-XXXX'}
                className="bg-muted/50 cursor-not-allowed font-mono text-xs"
                {...register('eventCode')}
              />
              {errors.eventCode && <p className="text-xs text-destructive">{errors.eventCode.message}</p>}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Loại sự kiện *</Label>
              <Controller
                control={control}
                name="eventType"
                render={({ field }) => (
                  <Select value={field.value || 'OTHER'} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Chọn loại sự kiện..." />
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
            <Label htmlFor="eventTimeRange" className="text-xs font-semibold flex items-center justify-between">
              <span>Thời gian diễn (Ngày & Khung giờ) *</span>
              <span className="text-[10px] text-muted-foreground font-normal">Chỉ trong ngày</span>
            </Label>
            <EventTimeRangePicker
              id="eventTimeRange"
              startDateIso={eventDateVal}
              endDateIso={endTimeVal}
              onChange={(startIso, endIso) => {
                setValue('eventDate', startIso, { shouldValidate: true, shouldDirty: true });
                setValue('endTime', endIso || '', { shouldValidate: true, shouldDirty: true });
              }}
            />
            {errors.eventDate && <p className="text-xs text-destructive">{errors.eventDate.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-semibold">
              Tên sự kiện *
            </Label>
            <Input id="name" placeholder="vd: Khai trương Thẩm mỹ viện..." {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-xs font-semibold">
              Địa điểm *
            </Label>
            <Input id="location" placeholder="vd: 92 P. Bế Văn Đàn, Hà Đông, Hà Nội" {...register('location')} />
            {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-xs font-semibold">
                Khách hàng
              </Label>
              <Input id="customerName" placeholder="vd: Anh Tuấn / Chị Lan" {...register('customerName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="text-xs font-semibold">
                SĐT khách hàng
              </Label>
              <Input id="customerPhone" placeholder="vd: 0912345678" {...register('customerPhone')} />
            </div>
          </div>

          {/* Khối Thông tin Hợp đồng & Tiền cọc */}
          <div className="p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="contractValue" className="text-xs font-semibold">
                  Giá trị hợp đồng (Tổng tiền show)
                </Label>
                <Controller
                  control={control}
                  name="contractValue"
                  render={({ field }) => (
                    <MoneyInput
                      id="contractValue"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0 đ"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="depositAmount" className="text-xs font-semibold flex items-center justify-between">
                  <span>Số tiền đã cọc</span>
                  {Number(contractVal) > 0 && Number(depositVal) > 0 && (
                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">
                      {Number(depositVal) >= Number(contractVal)
                        ? '✓ Đã cọc đủ 100%'
                        : `Còn lại: ${remainingAmount.toLocaleString('vi-VN')} đ`}
                    </span>
                  )}
                </Label>
                <Controller
                  control={control}
                  name="depositAmount"
                  render={({ field }) => (
                    <MoneyInput
                      id="depositAmount"
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="0 đ"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold">Trạng thái sự kiện</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
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

          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs font-semibold">
              Ghi chú / Yêu cầu thêm
            </Label>
            <Textarea id="description" placeholder="Ghi chú về đạo cụ, trang phục, lịch trình..." {...register('description')} />
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

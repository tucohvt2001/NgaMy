'use client';

import * as React from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Sparkles,
  ArrowRight,
  Check,
  Plus,
  Minus,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EventTimeRangePickerProps {
  startDateIso?: string | Date | null;
  endDateIso?: string | Date | null;
  onChange?: (startDateIso: string, endDateIso: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const QUICK_TIMES = ['08:00', '09:00', '14:00', '16:00', '18:00', '19:30', '20:00'];

export function EventTimeRangePicker({
  startDateIso,
  endDateIso,
  onChange,
  placeholder = 'Chọn ngày & giờ biểu diễn...',
  disabled = false,
  className,
  id,
}: EventTimeRangePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [mobileStep, setMobileStep] = React.useState<'date' | 'time'>('date');
  const [activeTab, setActiveTab] = React.useState<'start' | 'end'>('start');

  // Parse start date
  const parsedStart = React.useMemo(() => {
    if (!startDateIso) return null;
    const d = typeof startDateIso === 'string' ? new Date(startDateIso) : startDateIso;
    return isNaN(d.getTime()) ? null : d;
  }, [startDateIso]);

  // Parse end date
  const parsedEnd = React.useMemo(() => {
    if (!endDateIso) return null;
    const d = typeof endDateIso === 'string' ? new Date(endDateIso) : endDateIso;
    return isNaN(d.getTime()) ? null : d;
  }, [endDateIso]);

  const [viewDate, setViewDate] = React.useState<Date>(() => parsedStart || new Date());

  React.useEffect(() => {
    if (parsedStart) {
      setViewDate(parsedStart);
    }
  }, [parsedStart, open]);

  // Reset mobile step when popover opens
  React.useEffect(() => {
    if (open) {
      setMobileStep(parsedStart ? 'time' : 'date');
    }
  }, [open, parsedStart]);

  const selectedYear = parsedStart?.getFullYear();
  const selectedMonth = parsedStart?.getMonth();
  const selectedDay = parsedStart?.getDate();

  const startHour = parsedStart ? String(parsedStart.getHours()).padStart(2, '0') : '08';
  const startMinute = parsedStart ? String(parsedStart.getMinutes()).padStart(2, '0') : '00';

  const endHour = parsedEnd ? String(parsedEnd.getHours()).padStart(2, '0') : '';
  const endMinute = parsedEnd ? String(parsedEnd.getMinutes()).padStart(2, '0') : '';

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const startHourRef = React.useRef<HTMLDivElement>(null);
  const startMinRef = React.useRef<HTMLDivElement>(null);
  const endHourRef = React.useRef<HTMLDivElement>(null);
  const endMinRef = React.useRef<HTMLDivElement>(null);

  // Auto scroll in desktop lists
  React.useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (activeTab === 'start') {
          if (startHourRef.current) {
            const el = startHourRef.current.querySelector('[data-selected="true"]') as HTMLElement;
            if (el) startHourRef.current.scrollTop = el.offsetTop - 50;
          }
          if (startMinRef.current) {
            const el = startMinRef.current.querySelector('[data-selected="true"]') as HTMLElement;
            if (el) startMinRef.current.scrollTop = el.offsetTop - 50;
          }
        } else {
          if (endHourRef.current) {
            const el = endHourRef.current.querySelector('[data-selected="true"]') as HTMLElement;
            if (el) endHourRef.current.scrollTop = el.offsetTop - 50;
          }
          if (endMinRef.current) {
            const el = endMinRef.current.querySelector('[data-selected="true"]') as HTMLElement;
            if (el) endMinRef.current.scrollTop = el.offsetTop - 50;
          }
        }
      }, 70);
      return () => clearTimeout(timer);
    }
  }, [open, activeTab, mobileStep]);

  // Calendar days
  const calendarDays = React.useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      day: number;
      monthOffset: number;
      date: Date;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const date = new Date(viewYear, viewMonth - 1, d);
      days.push({
        day: d,
        monthOffset: -1,
        date,
        isToday: false,
        isSelected: false,
      });
    }

    const today = new Date();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const isToday =
        today.getDate() === d && today.getMonth() === viewMonth && today.getFullYear() === viewYear;
      const isSelected =
        selectedDay === d && selectedMonth === viewMonth && selectedYear === viewYear;
      days.push({
        day: d,
        monthOffset: 0,
        date,
        isToday,
        isSelected: Boolean(isSelected),
      });
    }

    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(viewYear, viewMonth + 1, d);
      days.push({
        day: d,
        monthOffset: 1,
        date,
        isToday: false,
        isSelected: false,
      });
    }

    return days;
  }, [viewYear, viewMonth, selectedYear, selectedMonth, selectedDay]);

  const emitChange = (newStart: Date, newEnd: Date | null) => {
    onChange?.(newStart.toISOString(), newEnd ? newEnd.toISOString() : null);
  };

  const handleSelectDay = (dayItem: { date: Date; monthOffset: number }) => {
    if (dayItem.monthOffset !== 0) {
      setViewDate(new Date(dayItem.date.getFullYear(), dayItem.date.getMonth(), 1));
    }
    const d = new Date(dayItem.date);
    d.setHours(parseInt(startHour, 10) || 8, parseInt(startMinute, 10) || 0, 0, 0);

    let nextEnd: Date | null = null;
    if (parsedEnd) {
      nextEnd = new Date(dayItem.date);
      nextEnd.setHours(parsedEnd.getHours(), parsedEnd.getMinutes(), 0, 0);
    }
    emitChange(d, nextEnd);
    setMobileStep('time');
  };

  const handleSelectStartHour = (h: string) => {
    const base = parsedStart || new Date(viewYear, viewMonth, selectedDay || new Date().getDate());
    const newStart = new Date(base);
    newStart.setHours(parseInt(h, 10), parseInt(startMinute, 10), 0, 0);

    let nextEnd = parsedEnd;
    if (parsedEnd) {
      nextEnd = new Date(newStart);
      nextEnd.setHours(parsedEnd.getHours(), parsedEnd.getMinutes(), 0, 0);
    }
    emitChange(newStart, nextEnd);
  };

  const handleSelectStartMinute = (m: string) => {
    const base = parsedStart || new Date(viewYear, viewMonth, selectedDay || new Date().getDate());
    const newStart = new Date(base);
    newStart.setHours(parseInt(startHour, 10), parseInt(m, 10), 0, 0);

    let nextEnd = parsedEnd;
    if (parsedEnd) {
      nextEnd = new Date(newStart);
      nextEnd.setHours(parsedEnd.getHours(), parsedEnd.getMinutes(), 0, 0);
    }
    emitChange(newStart, nextEnd);
  };

  const handleSelectEndHour = (h: string) => {
    const base = parsedStart || new Date(viewYear, viewMonth, selectedDay || new Date().getDate());
    const m = endMinute || startMinute || '00';
    const newEnd = new Date(base);
    newEnd.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

    const start = parsedStart || base;
    emitChange(start, newEnd);
  };

  const handleSelectEndMinute = (m: string) => {
    const base = parsedStart || new Date(viewYear, viewMonth, selectedDay || new Date().getDate());
    const h = endHour || String((parseInt(startHour, 10) + 1) % 24).padStart(2, '0');
    const newEnd = new Date(base);
    newEnd.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

    const start = parsedStart || base;
    emitChange(start, newEnd);
  };

  // Adjust hours by delta (+1 / -1)
  const adjustHour = (target: 'start' | 'end', delta: number) => {
    if (target === 'start') {
      const current = parseInt(startHour, 10) || 0;
      const next = (current + delta + 24) % 24;
      handleSelectStartHour(String(next).padStart(2, '0'));
    } else {
      const current = parseInt(endHour || startHour, 10) || 0;
      const next = (current + delta + 24) % 24;
      handleSelectEndHour(String(next).padStart(2, '0'));
    }
  };

  // Adjust minutes by delta (+5 / -5 / +15)
  const adjustMinute = (target: 'start' | 'end', delta: number) => {
    if (target === 'start') {
      const current = parseInt(startMinute, 10) || 0;
      const next = (current + delta + 60) % 60;
      handleSelectStartMinute(String(next).padStart(2, '0'));
    } else {
      const current = parseInt(endMinute || startMinute, 10) || 0;
      const next = (current + delta + 60) % 60;
      handleSelectEndMinute(String(next).padStart(2, '0'));
    }
  };

  const handleAddDuration = (minutesToAdd: number) => {
    const base = parsedStart || new Date(viewYear, viewMonth, selectedDay || new Date().getDate());
    const start = new Date(base);
    start.setHours(parseInt(startHour, 10), parseInt(startMinute, 10), 0, 0);

    const newEnd = new Date(start.getTime() + minutesToAdd * 60 * 1000);
    emitChange(start, newEnd);
    setActiveTab('end');
  };

  const handleApplyQuickTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':');
    if (activeTab === 'start') {
      const base = parsedStart || new Date(viewYear, viewMonth, selectedDay || new Date().getDate());
      const newStart = new Date(base);
      newStart.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

      let nextEnd = parsedEnd;
      if (parsedEnd) {
        nextEnd = new Date(newStart);
        nextEnd.setHours(parsedEnd.getHours(), parsedEnd.getMinutes(), 0, 0);
      }
      emitChange(newStart, nextEnd);
    } else {
      const base = parsedStart || new Date(viewYear, viewMonth, selectedDay || new Date().getDate());
      const newEnd = new Date(base);
      newEnd.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      const start = parsedStart || base;
      emitChange(start, newEnd);
    }
  };

  const handleClearEndTime = () => {
    if (parsedStart) {
      emitChange(parsedStart, null);
    }
  };

  const handleSetToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const start = new Date(now);
    start.setHours(now.getHours(), now.getMinutes(), 0, 0);
    emitChange(start, null);
    setMobileStep('time');
  };

  // Display text formatted
  const formattedDisplay = React.useMemo(() => {
    if (!parsedStart) return '';
    const day = String(parsedStart.getDate()).padStart(2, '0');
    const month = String(parsedStart.getMonth() + 1).padStart(2, '0');
    const year = parsedStart.getFullYear();
    const sh = String(parsedStart.getHours()).padStart(2, '0');
    const sm = String(parsedStart.getMinutes()).padStart(2, '0');

    if (parsedEnd) {
      const eh = String(parsedEnd.getHours()).padStart(2, '0');
      const em = String(parsedEnd.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year}  •  ${sh}:${sm} – ${eh}:${em}`;
    }

    return `${day}/${month}/${year}  •  ${sh}:${sm}`;
  }, [parsedStart, parsedEnd]);

  const currentDisplayHour = activeTab === 'start' ? startHour : (endHour || startHour);
  const currentDisplayMin = activeTab === 'start' ? startMinute : (endMinute || startMinute);

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:border-amber-500/60',
            !parsedStart && 'text-muted-foreground',
            className
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden text-left">
            <CalendarIcon className="size-4 text-amber-500 shrink-0" />
            <span className="font-mono text-xs sm:text-sm truncate">
              {formattedDisplay || placeholder}
            </span>
          </div>
          {parsedEnd && (
            <span className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold px-1.5 py-0.5 rounded shrink-0 hidden sm:inline-block">
              {parsedEnd.getHours() - (parsedStart?.getHours() || 0) > 0
                ? `${((parsedEnd.getTime() - (parsedStart?.getTime() || 0)) / (1000 * 60 * 60)).toFixed(1).replace('.0', '')}h`
                : 'Khung giờ'}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="w-[calc(100vw-32px)] sm:w-auto p-0 border-2 border-amber-500/40 shadow-2xl rounded-2xl overflow-hidden bg-white dark:bg-neutral-950 text-slate-900 dark:text-white z-[200] max-h-[88vh] sm:max-h-none overflow-y-auto"
      >
        {/* MOBILE STEP SWITCHER (<sm) */}
        <div className="sm:hidden grid grid-cols-2 p-1.5 bg-muted/80 border-b border-border/60 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMobileStep('date')}
            className={cn(
              'py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5',
              mobileStep === 'date'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-background/70 text-muted-foreground hover:text-foreground'
            )}
          >
            <CalendarIcon className="size-3.5" />
            <span>1. Chọn Ngày</span>
            {parsedStart && (
              <span className="font-mono text-[10px] opacity-90">
                ({String(parsedStart.getDate()).padStart(2, '0')}/{String(parsedStart.getMonth() + 1).padStart(2, '0')})
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMobileStep('time')}
            className={cn(
              'py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5',
              mobileStep === 'time'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-background/70 text-muted-foreground hover:text-foreground'
            )}
          >
            <Clock className="size-3.5" />
            <span>2. Khung Giờ</span>
            {parsedStart && (
              <span className="font-mono text-[10px] opacity-90">
                ({startHour}:{startMinute})
              </span>
            )}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          {/* Calendar Panel (Step 1 on Mobile, Left Column on Desktop) */}
          <div className={cn('p-3 w-full sm:w-[270px]', mobileStep !== 'date' && 'hidden sm:block')}>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
              <span className="text-xs font-bold text-foreground">
                Tháng {viewMonth + 1}, {viewYear}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewDate(new Date(viewYear, viewMonth - 1, 1));
                  }}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewDate(new Date(viewYear, viewMonth + 1, 1));
                  }}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="text-[10px] font-semibold text-muted-foreground py-1">
                  {wd}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectDay(item)}
                  className={cn(
                    'size-8 rounded-lg text-xs font-medium flex items-center justify-center transition-all',
                    item.monthOffset !== 0 && 'text-muted-foreground/40 hover:text-foreground',
                    item.monthOffset === 0 && 'text-foreground hover:bg-amber-500/15',
                    item.isToday && !item.isSelected && 'border border-amber-500/60 font-bold text-amber-600 dark:text-amber-400',
                    item.isSelected && 'bg-amber-600 text-white font-bold shadow-xs hover:bg-amber-700'
                  )}
                >
                  {item.day}
                </button>
              ))}
            </div>

            <div className="pt-3 mt-2 border-t border-border/40 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] px-2 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold"
                onClick={handleSetToday}
              >
                Hôm nay
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-7 text-[11px] px-3 font-bold bg-amber-500 hover:bg-amber-600 text-white sm:hidden"
                onClick={() => setMobileStep('time')}
              >
                Tiếp: Chọn giờ ➔
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground font-semibold hidden sm:inline-flex"
                onClick={() => setOpen(false)}
              >
                Xong
              </Button>
            </div>
          </div>

          {/* Time & Duration Panel (Step 2 on Mobile, Right Column on Desktop) */}
          <div className={cn('p-3 bg-muted/20 flex flex-col w-full sm:w-[280px]', mobileStep !== 'time' && 'hidden sm:flex')}>
            {/* Tab switch between Start Time and End Time */}
            <div className="grid grid-cols-2 p-1 bg-muted/80 rounded-xl mb-2.5 text-xs font-semibold gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('start')}
                className={cn(
                  'py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs',
                  activeTab === 'start'
                    ? 'bg-amber-500 text-white font-black shadow-md border border-amber-600 ring-2 ring-amber-400/40'
                    : 'bg-background/60 hover:bg-background text-foreground/80 hover:text-foreground border border-border/40'
                )}
              >
                <Clock className={cn('size-3.5 shrink-0', activeTab === 'start' ? 'text-white' : 'text-amber-500')} />
                <span>Bắt đầu</span>
                {parsedStart && (
                  <span className={cn('font-mono text-[11px] font-bold px-1 rounded', activeTab === 'start' ? 'bg-black/20 text-white' : 'text-amber-600 dark:text-amber-400 bg-amber-500/10')}>
                    ({startHour}:{startMinute})
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('end')}
                className={cn(
                  'py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs',
                  activeTab === 'end'
                    ? 'bg-blue-600 text-white font-black shadow-md border border-blue-700 ring-2 ring-blue-400/40'
                    : 'bg-background/60 hover:bg-background text-foreground/80 hover:text-foreground border border-border/40'
                )}
              >
                <ArrowRight className={cn('size-3.5 shrink-0', activeTab === 'end' ? 'text-white' : 'text-blue-500')} />
                <span>Kết thúc</span>
                {parsedEnd && (
                  <span className={cn('font-mono text-[11px] font-bold px-1 rounded', activeTab === 'end' ? 'bg-black/20 text-white' : 'text-blue-600 dark:text-blue-400 bg-blue-500/10')}>
                    ({endHour}:{endMinute})
                  </span>
                )}
              </button>
            </div>

            {/* Quick duration presets: 15p, 30p, 1h */}
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 shrink-0">
                <Sparkles className="size-3 text-amber-500" /> Nhanh:
              </span>
              <div className="grid grid-cols-3 gap-1 flex-1">
                {[
                  { label: '+15p', mins: 15 },
                  { label: '+30p', mins: 30 },
                  { label: '+1h', mins: 60 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleAddDuration(preset.mins)}
                    className="text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-500/40 py-1 rounded-md transition-all active:scale-95 text-center shadow-xs"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              {parsedEnd && (
                <button
                  type="button"
                  onClick={handleClearEndTime}
                  title="Xóa giờ kết thúc"
                  className="text-[11px] text-destructive hover:bg-destructive/15 p-1 rounded-md border border-destructive/30 flex items-center justify-center shrink-0 transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* MOBILE INTERACTIVE WHEEL & STEPPER (Displayed on mobile screens) */}
            <div className="sm:hidden p-3 bg-background/80 border border-border/80 rounded-2xl mb-2.5 shadow-inner">
              <div className="text-[11px] text-center font-bold text-muted-foreground mb-2">
                {activeTab === 'start' ? 'Chạm số để chọn giờ bắt đầu' : 'Chạm số để chọn giờ kết thúc'}
              </div>
              <div className="flex items-center justify-center gap-4">
                {/* Hour Stepper with Native Wheel Dropdown */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Giờ (00-23)</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustHour(activeTab, -1)}
                      className="size-8 rounded-lg bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center font-bold active:scale-90 transition-transform"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <div className="relative">
                      <div className="size-12 rounded-xl bg-amber-500/15 border-2 border-amber-500/50 flex items-center justify-center font-mono text-2xl font-black text-amber-600 dark:text-amber-400 shadow-sm">
                        {currentDisplayHour}
                      </div>
                      <select
                        aria-label="Chọn giờ"
                        value={currentDisplayHour}
                        onChange={(e) => {
                          if (activeTab === 'start') handleSelectStartHour(e.target.value);
                          else handleSelectEndHour(e.target.value);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-base"
                      >
                        {HOURS_24.map((h) => (
                          <option key={h} value={h}>
                            {h} giờ
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => adjustHour(activeTab, 1)}
                      className="size-8 rounded-lg bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center font-bold active:scale-90 transition-transform"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>

                <div className="text-2xl font-black font-mono text-muted-foreground mt-4">:</div>

                {/* Minute Stepper with Native Wheel Dropdown */}
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Phút (00-59)</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => adjustMinute(activeTab, -5)}
                      className="size-8 rounded-lg bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center font-bold active:scale-90 transition-transform"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <div className="relative">
                      <div className="size-12 rounded-xl bg-amber-500/15 border-2 border-amber-500/50 flex items-center justify-center font-mono text-2xl font-black text-amber-600 dark:text-amber-400 shadow-sm">
                        {currentDisplayMin}
                      </div>
                      <select
                        aria-label="Chọn phút"
                        value={currentDisplayMin}
                        onChange={(e) => {
                          if (activeTab === 'start') handleSelectStartMinute(e.target.value);
                          else handleSelectEndMinute(e.target.value);
                        }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-base"
                      >
                        {MINUTES.map((m) => (
                          <option key={m} value={m}>
                            {m} phút
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => adjustMinute(activeTab, 5)}
                      className="size-8 rounded-lg bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center font-bold active:scale-90 transition-transform"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Pick Time Chips on Mobile */}
              <div className="mt-3 pt-2 border-t border-border/50">
                <div className="text-[10px] font-bold text-muted-foreground mb-1.5 text-center">Khung giờ phổ biến:</div>
                <div className="flex items-center justify-center gap-1 flex-wrap">
                  {QUICK_TIMES.map((qt) => (
                    <button
                      key={qt}
                      type="button"
                      onClick={() => handleApplyQuickTime(qt)}
                      className="text-[11px] font-mono font-bold bg-muted hover:bg-amber-500/20 px-2 py-0.5 rounded-md border border-border/60 transition-colors"
                    >
                      {qt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DESKTOP 24H SCROLL LISTS (Displayed on desktop/tablet) */}
            <div className="hidden sm:flex flex-col flex-1">
              {activeTab === 'start' ? (
                <div className="flex flex-col flex-1">
                  <div className="text-[11px] font-semibold text-muted-foreground text-center mb-1">
                    Chọn giờ bắt đầu
                  </div>
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    {/* Hours */}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-center font-medium text-muted-foreground mb-1">Giờ</span>
                      <div
                        ref={startHourRef}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        className="h-[155px] overflow-y-auto pr-1 space-y-1 touch-pan-y overscroll-contain"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                      >
                        {HOURS_24.map((h) => {
                          const isSel = h === startHour;
                          return (
                            <button
                              key={h}
                              type="button"
                              data-selected={isSel}
                              onClick={() => handleSelectStartHour(h)}
                              className={cn(
                                'w-full py-0.5 text-center font-mono text-xs rounded-md transition-colors',
                                isSel ? 'bg-amber-600 text-white font-bold' : 'hover:bg-amber-500/15 text-foreground'
                              )}
                            >
                              {h}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* Minutes */}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-center font-medium text-muted-foreground mb-1">Phút</span>
                      <div
                        ref={startMinRef}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        className="h-[155px] overflow-y-auto pr-1 space-y-1 touch-pan-y overscroll-contain"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                      >
                        {MINUTES.map((m) => {
                          const isSel = m === startMinute;
                          return (
                            <button
                              key={m}
                              type="button"
                              data-selected={isSel}
                              onClick={() => handleSelectStartMinute(m)}
                              className={cn(
                                'w-full py-0.5 text-center font-mono text-xs rounded-md transition-colors',
                                isSel ? 'bg-amber-600 text-white font-bold' : 'hover:bg-amber-500/15 text-foreground'
                              )}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-1">
                  <div className="text-[11px] font-semibold text-muted-foreground text-center mb-1">
                    Chọn giờ kết thúc (dự kiến)
                  </div>
                  <div className="grid grid-cols-2 gap-2 flex-1">
                    {/* End Hours */}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-center font-medium text-muted-foreground mb-1">Giờ</span>
                      <div
                        ref={endHourRef}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        className="h-[155px] overflow-y-auto pr-1 space-y-1 touch-pan-y overscroll-contain"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                      >
                        {HOURS_24.map((h) => {
                          const isSel = h === endHour;
                          return (
                            <button
                              key={h}
                              type="button"
                              data-selected={isSel}
                              onClick={() => handleSelectEndHour(h)}
                              className={cn(
                                'w-full py-0.5 text-center font-mono text-xs rounded-md transition-colors',
                                isSel ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-500/15 text-foreground'
                              )}
                            >
                              {h}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {/* End Minutes */}
                    <div className="flex flex-col">
                      <span className="text-[10px] text-center font-medium text-muted-foreground mb-1">Phút</span>
                      <div
                        ref={endMinRef}
                        onTouchStart={(e) => e.stopPropagation()}
                        onTouchMove={(e) => e.stopPropagation()}
                        className="h-[155px] overflow-y-auto pr-1 space-y-1 touch-pan-y overscroll-contain"
                        style={{ WebkitOverflowScrolling: 'touch' }}
                      >
                        {MINUTES.map((m) => {
                          const isSel = m === endMinute;
                          return (
                            <button
                              key={m}
                              type="button"
                              data-selected={isSel}
                              onClick={() => handleSelectEndMinute(m)}
                              className={cn(
                                'w-full py-0.5 text-center font-mono text-xs rounded-md transition-colors',
                                isSel ? 'bg-blue-600 text-white font-bold' : 'hover:bg-blue-500/15 text-foreground'
                              )}
                            >
                              {m}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom action bar */}
            <div className="pt-2 mt-2 border-t border-border/40 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground sm:hidden"
                onClick={() => setMobileStep('date')}
              >
                ⬅ Đổi ngày
              </Button>
              <Button
                type="button"
                variant="default"
                size="sm"
                className="h-7 text-[11px] px-3 ml-auto font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1"
                onClick={() => setOpen(false)}
              >
                <Check className="size-3.5" />
                <span>Hoàn tất</span>
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

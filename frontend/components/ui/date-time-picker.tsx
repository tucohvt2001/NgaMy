'use client';

import * as React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DateTimePickerProps {
  value?: string | Date | null;
  onChange?: (dateIso: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Chọn ngày và giờ (24h)...',
  disabled = false,
  className,
  id,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // Parse current date & time
  const parsedDate = React.useMemo(() => {
    if (!value) return null;
    const d = typeof value === 'string' ? new Date(value) : value;
    return isNaN(d.getTime()) ? null : d;
  }, [value]);

  const [viewDate, setViewDate] = React.useState<Date>(() => parsedDate || new Date());

  // Keep viewDate in sync when value changes or popover opens
  React.useEffect(() => {
    if (parsedDate) {
      setViewDate(parsedDate);
    }
  }, [parsedDate, open]);

  const selectedYear = parsedDate?.getFullYear();
  const selectedMonth = parsedDate?.getMonth();
  const selectedDay = parsedDate?.getDate();
  const selectedHour = parsedDate ? String(parsedDate.getHours()).padStart(2, '0') : '08';
  const selectedMinute = parsedDate ? String(parsedDate.getMinutes()).padStart(2, '0') : '00';

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Scroll references for hours and minutes
  const hourScrollRef = React.useRef<HTMLDivElement>(null);
  const minuteScrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (hourScrollRef.current) {
          const selectedBtn = hourScrollRef.current.querySelector('[data-selected="true"]') as HTMLElement;
          if (selectedBtn) {
            hourScrollRef.current.scrollTop = selectedBtn.offsetTop - 60;
          }
        }
        if (minuteScrollRef.current) {
          const selectedBtn = minuteScrollRef.current.querySelector('[data-selected="true"]') as HTMLElement;
          if (selectedBtn) {
            minuteScrollRef.current.scrollTop = selectedBtn.offsetTop - 60;
          }
        }
      }, 50);
    }
  }, [open]);

  // Calendar days calculation
  const calendarDays = React.useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    // Monday-based (0 = Mon, ..., 6 = Sun)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: Array<{
      day: number;
      monthOffset: number; // -1 prev, 0 current, 1 next
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

    // Fill remaining to 35 or 42 cells
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

  const updateDateTime = (newDate: Date, hourStr: string, minuteStr: string) => {
    const d = new Date(newDate);
    d.setHours(parseInt(hourStr, 10), parseInt(minuteStr, 10), 0, 0);
    onChange?.(d.toISOString());
  };

  const handleSelectDay = (dayItem: { date: Date; monthOffset: number }) => {
    if (dayItem.monthOffset !== 0) {
      setViewDate(new Date(dayItem.date.getFullYear(), dayItem.date.getMonth(), 1));
    }
    updateDateTime(dayItem.date, selectedHour, selectedMinute);
  };

  const handleSelectHour = (h: string) => {
    const baseDate = parsedDate || new Date(viewYear, viewMonth, selectedDay || new Date().getDate());
    updateDateTime(baseDate, h, selectedMinute);
  };

  const handleSelectMinute = (m: string) => {
    const baseDate = parsedDate || new Date(viewYear, viewMonth, selectedDay || new Date().getDate());
    updateDateTime(baseDate, selectedHour, m);
  };

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleSetToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    updateDateTime(now, String(now.getHours()).padStart(2, '0'), String(now.getMinutes()).padStart(2, '0'));
  };

  // Formatted display text (24h: DD/MM/YYYY HH:mm)
  const formattedDisplay = React.useMemo(() => {
    if (!parsedDate) return '';
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const year = parsedDate.getFullYear();
    const hours = String(parsedDate.getHours()).padStart(2, '0');
    const minutes = String(parsedDate.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }, [parsedDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          disabled={disabled}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            !parsedDate && 'text-muted-foreground',
            className
          )}
        >
          <span className="font-mono text-xs sm:text-sm">
            {formattedDisplay || placeholder}
          </span>
          <CalendarIcon className="size-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto p-0 border border-border/80 shadow-2xl rounded-2xl overflow-hidden bg-card text-card-foreground"
      >
        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          {/* Calendar Panel (Left) */}
          <div className="p-3 w-[270px]">
            {/* Month & Year Navigation */}
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
                  onClick={handlePrevMonth}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-md"
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {WEEKDAYS.map((wd) => (
                <div key={wd} className="text-[10px] font-semibold text-muted-foreground py-1">
                  {wd}
                </div>
              ))}
            </div>

            {/* Days grid */}
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

            {/* Bottom quick actions */}
            <div className="pt-3 mt-2 border-t border-border/40 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] px-2 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
                onClick={handleSetToday}
              >
                Hôm nay
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] px-2 text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Xong
              </Button>
            </div>
          </div>

          {/* Time Panel (24 Hours & Minutes - Right) */}
          <div className="p-3 bg-muted/20 flex flex-col w-[170px]">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/40">
              <span className="text-xs font-bold text-foreground flex items-center gap-1">
                <Clock className="size-3.5 text-amber-500" />
                Giờ 24h
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                {selectedHour}:{selectedMinute}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 flex-1">
              {/* Hours 00 - 23 */}
              <div className="flex flex-col">
                <span className="text-[10px] text-center font-semibold text-muted-foreground mb-1">
                  Giờ
                </span>
                <div
                  ref={hourScrollRef}
                  className="h-[200px] overflow-y-auto pr-1 space-y-1 scrollbar-thin"
                >
                  {HOURS_24.map((h) => {
                    const isSel = h === selectedHour;
                    return (
                      <button
                        key={h}
                        type="button"
                        data-selected={isSel}
                        onClick={() => handleSelectHour(h)}
                        className={cn(
                          'w-full py-1 text-center font-mono text-xs rounded-md transition-colors',
                          isSel
                            ? 'bg-amber-600 text-white font-bold'
                            : 'hover:bg-amber-500/15 text-foreground'
                        )}
                      >
                        {h}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Minutes 00 - 59 */}
              <div className="flex flex-col">
                <span className="text-[10px] text-center font-semibold text-muted-foreground mb-1">
                  Phút
                </span>
                <div
                  ref={minuteScrollRef}
                  className="h-[200px] overflow-y-auto pr-1 space-y-1 scrollbar-thin"
                >
                  {MINUTES.map((m) => {
                    const isSel = m === selectedMinute;
                    return (
                      <button
                        key={m}
                        type="button"
                        data-selected={isSel}
                        onClick={() => handleSelectMinute(m)}
                        className={cn(
                          'w-full py-1 text-center font-mono text-xs rounded-md transition-colors',
                          isSel
                            ? 'bg-amber-600 text-white font-bold'
                            : 'hover:bg-amber-500/15 text-foreground'
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
        </div>
      </PopoverContent>
    </Popover>
  );
}

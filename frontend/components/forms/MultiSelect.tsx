'use client';

import { useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({ options, value, onChange, placeholder = 'Chọn...', className }: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const selectedLabels = options.filter((o) => value.includes(o.value)).map((o) => o.label);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className="truncate text-left">
            {selectedLabels.length > 0 ? selectedLabels.join(', ') : placeholder}
          </span>
          <ChevronsUpDown className="size-4 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-52 max-h-56 overflow-y-auto overscroll-contain p-1 shadow-lg"
        onWheel={(e) => e.stopPropagation()}
      >
        {options.length === 0 ? (
          <p className="p-2 text-xs text-muted-foreground">Không có lựa chọn nào</p>
        ) : (
          <div className="space-y-0.5 p-0.5">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs sm:text-sm hover:bg-accent transition-colors select-none"
              >
                <Checkbox
                  checked={value.includes(option.value)}
                  onCheckedChange={() => toggle(option.value)}
                />
                <span className="truncate">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface MoneyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value?: number | null | string;
  onChange?: (value: number) => void;
  onValueChange?: (value: number) => void;
  suffix?: string;
}

/**
 * Format a number to string with thousand separators (e.g. 1000000 -> "1,000,000")
 */
export function formatMoneyString(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '';
  const num = typeof val === 'string' ? Number(val.replace(/\D/g, '')) : val;
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US'); // en-US uses comma (1,000,000) which is standard in web inputs
}

/**
 * Parse a string with thousand separators back to number
 */
export function parseMoneyString(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, onValueChange, suffix = 'đ', className, placeholder = '0', disabled, ...props }, ref) => {
    // Local display string
    const [displayVal, setDisplayVal] = React.useState<string>(() => formatMoneyString(value));

    // Sync when external value prop changes
    React.useEffect(() => {
      setDisplayVal(formatMoneyString(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      const num = parseMoneyString(rawInput);
      const formatted = formatMoneyString(num === 0 && rawInput === '' ? '' : num);
      setDisplayVal(formatted);

      if (onChange) onChange(num);
      if (onValueChange) onValueChange(num);
    };

    return (
      <div className="relative flex items-center w-full">
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayVal}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={cn('font-mono font-bold pr-7 text-right', className)}
          {...props}
        />
        {suffix && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none select-none">
            {suffix}
          </span>
        )}
      </div>
    );
  }
);

MoneyInput.displayName = 'MoneyInput';

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Định dạng giờ 24h: "HH:mm" (ví dụ: "14:30", "08:05")
 */
export function formatTime24h(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Định dạng ngày: "DD/MM/YYYY" (ví dụ: "25/09/2026")
 */
export function formatDateVN(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Định dạng ngày giờ 24h: "HH:mm DD/MM/YYYY" (ví dụ: "14:30 25/09/2026")
 */
export function formatDateTime24h(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return `${formatTime24h(d)} ${formatDateVN(d)}`;
}

/**
 * Định dạng ngày giờ 24h có thứ: "Th 6, 25/09/2026 14:30"
 */
export function formatDisplayDateWithWeekday24h(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  const daysOfWeek = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
  const weekday = daysOfWeek[d.getDay()];
  return `${weekday}, ${formatDateVN(d)} ${formatTime24h(d)}`;
}

/**
 * Định dạng cho datetime-local input: "YYYY-MM-DDTHH:mm"
 */
export function formatForDateTimeLocal(dateStr?: string | Date | null): string {
  if (!dateStr) {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  }
  const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  if (isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

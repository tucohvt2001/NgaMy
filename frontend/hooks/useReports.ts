import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';

export function useMemberReport() {
  return useQuery({ queryKey: ['reports', 'members'], queryFn: () => reportService.members() });
}

export function useEventReport() {
  return useQuery({ queryKey: ['reports', 'events'], queryFn: () => reportService.events() });
}

export function useAttendanceReport() {
  return useQuery({ queryKey: ['reports', 'attendance'], queryFn: () => reportService.attendance() });
}

export function useSalaryReport(month?: number, year?: number) {
  return useQuery({
    queryKey: ['reports', 'salary', month, year],
    queryFn: () => reportService.salary(month, year),
  });
}

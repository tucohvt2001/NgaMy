import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';

export function useDashboardSummary() {
  return useQuery({ queryKey: ['dashboard', 'summary'], queryFn: () => dashboardService.getSummary() });
}

export function useDashboardCharts(year: number) {
  return useQuery({ queryKey: ['dashboard', 'charts', year], queryFn: () => dashboardService.getCharts(year) });
}

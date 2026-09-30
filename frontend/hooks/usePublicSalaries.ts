import { useQuery } from '@tanstack/react-query';
import { publicSalaryService, PublicSalaryParams } from '@/services/publicSalary.service';

export function usePublicSalaries(params?: PublicSalaryParams) {
  return useQuery({
    queryKey: ['publicSalaries', params],
    queryFn: () => publicSalaryService.getPublicSalaries(params),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });
}

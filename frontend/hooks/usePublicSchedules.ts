import { useQuery } from '@tanstack/react-query';
import { publicScheduleService, PublicScheduleParams } from '@/services/publicSchedule.service';

export function usePublicSchedules(params?: PublicScheduleParams) {
  return useQuery({
    queryKey: ['public-schedules', params],
    queryFn: () => publicScheduleService.getUpcomingSchedules(params),
    refetchInterval: 30000, // Tự động làm mới mỗi 30 giây để cập nhật lịch diễn
  });
}

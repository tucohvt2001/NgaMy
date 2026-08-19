import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { attendanceService, AttendanceListParams } from '@/services/attendance.service';
import { getErrorMessage } from '@/lib/errors';

export function useAttendanceList(params: AttendanceListParams) {
  return useQuery({ queryKey: ['attendance', params], queryFn: () => attendanceService.list(params) });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => attendanceService.checkIn(eventId),
    onSuccess: () => {
      toast.success('Check-in thành công');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCheckOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => attendanceService.checkOut(eventId),
    onSuccess: () => {
      toast.success('Check-out thành công');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useConfirmAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: string; note?: string }) =>
      attendanceService.confirm(id, status, note),
    onSuccess: () => {
      toast.success('Xác nhận chấm công thành công');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

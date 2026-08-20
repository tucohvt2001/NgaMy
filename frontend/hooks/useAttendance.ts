import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  attendanceService,
  AttendanceListParams,
  AdminRecordAttendancePayload,
  AdminBatchAttendancePayload,
} from '@/services/attendance.service';
import { getErrorMessage } from '@/lib/errors';

export function useAttendanceList(params: AttendanceListParams) {
  return useQuery({
    queryKey: ['attendance', params],
    queryFn: () => attendanceService.list(params),
  });
}

export function useEventAttendanceSheet(eventId?: string) {
  return useQuery({
    queryKey: ['attendance', 'sheet', eventId],
    queryFn: () => attendanceService.getEventSheet(eventId!),
    enabled: Boolean(eventId),
  });
}

export function useRecordAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminRecordAttendancePayload) => attendanceService.recordByAdmin(payload),
    onSuccess: (_, variables) => {
      toast.success('Chấm công thành công');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useBatchAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminBatchAttendancePayload) => attendanceService.batchRecordByAdmin(payload),
    onSuccess: () => {
      toast.success('Lưu bảng chấm công thành công');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => attendanceService.delete(id),
    onSuccess: () => {
      toast.success('Xóa bản ghi chấm công thành công');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) => attendanceService.checkIn(eventId),
    onSuccess: () => {
      toast.success('Check-in thành công');
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
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
      queryClient.invalidateQueries({ queryKey: ['reports'] });
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
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

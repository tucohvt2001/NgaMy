import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { leaveService, LeaveInput, LeaveListParams } from '@/services/leave.service';
import { getErrorMessage } from '@/lib/errors';

export function useLeaves(params: LeaveListParams) {
  return useQuery({ queryKey: ['leaves', params], queryFn: () => leaveService.list(params) });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LeaveInput) => leaveService.create(input),
    onSuccess: (data) => {
      toast.success('Gửi đơn nghỉ phép thành công');
      data.warnings.forEach((warning) => toast.warning(warning));
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leaveService.approve(id),
    onSuccess: () => {
      toast.success('Duyệt đơn nghỉ phép thành công');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leaveService.reject(id),
    onSuccess: () => {
      toast.success('Từ chối đơn nghỉ phép thành công');
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

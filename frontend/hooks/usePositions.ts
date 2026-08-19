import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { positionService, PositionInput } from '@/services/position.service';
import { getErrorMessage } from '@/lib/errors';

export function usePositions() {
  return useQuery({ queryKey: ['positions'], queryFn: () => positionService.list() });
}

export function useCreatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PositionInput) => positionService.create(input),
    onSuccess: () => {
      toast.success('Tạo chức vụ thành công');
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<PositionInput> }) =>
      positionService.update(id, input),
    onSuccess: () => {
      toast.success('Cập nhật chức vụ thành công');
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemovePosition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => positionService.remove(id),
    onSuccess: () => {
      toast.success('Xóa chức vụ thành công');
      queryClient.invalidateQueries({ queryKey: ['positions'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

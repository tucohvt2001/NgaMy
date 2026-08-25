import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { eventTypeService, EventTypeInput } from '@/services/eventType.service';
import { getErrorMessage } from '@/lib/errors';

export function useEventTypes(filter?: { isActive?: boolean; search?: string }) {
  return useQuery({
    queryKey: ['eventTypes', filter],
    queryFn: () => eventTypeService.list(filter),
  });
}

export function useCreateEventType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EventTypeInput) => eventTypeService.create(input),
    onSuccess: () => {
      toast.success('Tạo loại show diễn thành công');
      queryClient.invalidateQueries({ queryKey: ['eventTypes'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateEventType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<EventTypeInput> }) =>
      eventTypeService.update(id, input),
    onSuccess: () => {
      toast.success('Cập nhật loại show diễn thành công');
      queryClient.invalidateQueries({ queryKey: ['eventTypes'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveEventType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventTypeService.remove(id),
    onSuccess: () => {
      toast.success('Xóa loại show diễn thành công');
      queryClient.invalidateQueries({ queryKey: ['eventTypes'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

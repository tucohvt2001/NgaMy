import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { eventService, eventMemberService, EventInput, EventListParams, AssignMemberInput } from '@/services/event.service';
import { getErrorMessage } from '@/lib/errors';

export function useEvents(params: EventListParams) {
  return useQuery({ queryKey: ['events', params], queryFn: () => eventService.list(params) });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => eventService.getById(id as string),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EventInput) => eventService.create(input),
    onSuccess: () => {
      toast.success('Tạo sự kiện thành công');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<EventInput> }) => eventService.update(id, input),
    onSuccess: () => {
      toast.success('Cập nhật sự kiện thành công');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useCancelEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eventService.cancel(id),
    onSuccess: () => {
      toast.success('Hủy sự kiện thành công');
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useEventMembers(eventId: string | undefined) {
  return useQuery({
    queryKey: ['events', eventId, 'members'],
    queryFn: () => eventMemberService.list(eventId as string),
    enabled: !!eventId,
  });
}

export function useAssignMember(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignMemberInput) => eventMemberService.assign(eventId, input),
    onSuccess: (data) => {
      toast.success('Phân công thành viên thành công');
      if (data.warnings.length > 0) {
        data.warnings.forEach((warning) => toast.warning(warning));
      }
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'members'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useRemoveAssignment(eventId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => eventMemberService.remove(eventId, memberId),
    onSuccess: () => {
      toast.success('Hủy phân công thành công');
      queryClient.invalidateQueries({ queryKey: ['events', eventId, 'members'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

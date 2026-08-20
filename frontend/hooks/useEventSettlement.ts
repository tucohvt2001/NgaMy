import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { eventService } from '@/services/event.service';
import { EventSettlementInput } from '@/types/models';

export function useEventSettlement(eventId?: string) {
  return useQuery({
    queryKey: ['event-settlement', eventId],
    queryFn: () => eventService.getSettlement(eventId!),
    enabled: Boolean(eventId),
  });
}

export function useSettleEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EventSettlementInput }) =>
      eventService.settle(id, input),
    onSuccess: (data, variables) => {
      toast.success(data.message || 'Quyết toán show và lập phiếu thu chi thành công');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['event-settlement', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Quyết toán thất bại');
    },
  });
}

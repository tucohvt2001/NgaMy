import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { bookingService, CreatePublicBookingInput } from '@/services/booking.service';
import { getErrorMessage } from '@/lib/errors';

export function useSubmitPublicBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePublicBookingInput) => bookingService.submitBooking(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-schedules'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Gửi yêu cầu đặt lịch thất bại. Vui lòng kiểm tra lại thông tin.'));
    },
  });
}

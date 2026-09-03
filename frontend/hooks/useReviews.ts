import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { reviewService, CreateReviewInput } from '@/services/review.service';
import { getErrorMessage } from '@/lib/errors';

export function usePublicReviewInfo(eventId?: string) {
  return useQuery({
    queryKey: ['public-review-info', eventId],
    queryFn: () => reviewService.getPublicInfo(eventId!),
    enabled: Boolean(eventId),
    retry: 1,
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: CreateReviewInput }) =>
      reviewService.submitReview(eventId, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['public-review-info', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Gửi đánh giá thất bại'));
    },
  });
}

export function useReviews(params?: { page?: number; limit?: number; eventId?: string; rating?: number; search?: string }) {
  return useQuery({
    queryKey: ['reviews', params],
    queryFn: () => reviewService.list(params),
  });
}

export function useEventReviews(eventId?: string) {
  return useQuery({
    queryKey: ['event-reviews', eventId],
    queryFn: () => reviewService.getByEvent(eventId!),
    enabled: Boolean(eventId),
  });
}

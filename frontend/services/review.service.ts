import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import { PaginatedResult } from '@/types/models';

export interface PublicEventInfo {
  id: string;
  eventCode: string;
  name: string;
  eventType: string | null;
  eventDate: string;
  location: string;
  customerName?: string | null;
  customerPhone?: string | null;
}

export interface PublicReviewInfoResponse {
  event: PublicEventInfo;
  stats: {
    totalReviews: number;
    avgRating: number;
  };
  recentReviews: Array<{
    id: string;
    customerName: string;
    rating: number;
    performanceQuality?: number | null;
    punctuality?: number | null;
    attitude?: number | null;
    comment?: string | null;
    createdAt: string;
  }>;
}

export interface CreateReviewInput {
  customerName: string;
  customerPhone?: string | null;
  rating: number;
  performanceQuality?: number | null;
  punctuality?: number | null;
  attitude?: number | null;
  comment?: string | null;
  isPublic?: boolean;
}

export interface EventReviewItem {
  id: string;
  eventId: string;
  customerName: string;
  customerPhone?: string | null;
  rating: number;
  performanceQuality?: number | null;
  punctuality?: number | null;
  attitude?: number | null;
  comment?: string | null;
  isPublic: boolean;
  createdAt: string;
  event?: {
    id: string;
    eventCode: string;
    name: string;
    eventType: string | null;
    eventDate: string;
  };
}

export interface ReviewListResponse extends PaginatedResult<EventReviewItem> {
  summary: {
    totalReviews: number;
    avgRating: number;
    ratingDistribution: Array<{ star: number; count: number; percentage: number }>;
  };
}

export const reviewService = {
  // Public: Lấy thông tin show để khách đánh giá
  async getPublicInfo(eventId: string) {
    const res = await apiClient.get<ApiSuccessResponse<PublicReviewInfoResponse>>(
      `/public/events/${eventId}/review-info`,
    );
    return res.data.data;
  },

  // Public: Khách hàng gửi đánh giá
  async submitReview(eventId: string, data: CreateReviewInput) {
    const res = await apiClient.post<ApiSuccessResponse<{ review: EventReviewItem; message: string }>>(
      `/public/events/${eventId}/reviews`,
      data,
    );
    return res.data.data;
  },

  // Protected: Danh sách đánh giá
  async list(params?: { page?: number; limit?: number; eventId?: string; rating?: number; search?: string }) {
    const res = await apiClient.get<ApiSuccessResponse<ReviewListResponse>>('/reviews', { params });
    return res.data.data;
  },

  // Protected: Đánh giá theo show
  async getByEvent(eventId: string) {
    const res = await apiClient.get<ApiSuccessResponse<EventReviewItem[]>>(`/events/${eventId}/reviews`);
    return res.data.data;
  },
};

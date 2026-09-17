import { publicApiClient, ApiSuccessResponse } from '@/lib/axios';

export interface CreatePublicBookingInput {
  customerName: string;
  customerPhone: string;
  customerZalo?: string;
  customerEmail?: string;
  serviceType?: string;
  serviceName?: string;
  eventDate: string;
  startTime?: string;
  endTime?: string;
  address: string;
  mapUrl?: string;
  latitude?: number;
  longitude?: number;
  performances?: string[];
  estimatedBudget?: number;
  notes?: string;
}

export interface PublicBookingResult {
  booking: {
    id: string;
    eventCode: string;
    name: string;
    eventDate: string;
    startTime?: string | null;
    endTime?: string | null;
    location: string;
    customerName: string;
    customerPhone: string;
    status: string;
    createdAt: string;
  };
  message: string;
}

export const bookingService = {
  async submitBooking(data: CreatePublicBookingInput): Promise<PublicBookingResult> {
    const res = await publicApiClient.post<ApiSuccessResponse<PublicBookingResult>>('/public/booking', data);
    return res.data.data;
  },
};

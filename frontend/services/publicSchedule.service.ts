import { apiClient, ApiSuccessResponse } from '@/lib/axios';

export interface PublicEventMember {
  id: string;
  status: string;
  note?: string | null;
  position: {
    id: string;
    name: string;
  };
  member: {
    id: string;
    fullName: string;
    avatar?: string | null;
  };
}

export interface PublicEventItem {
  id: string;
  eventCode: string;
  name: string;
  eventType?: string | null;
  eventDate: string;
  startTime?: string | null;
  endTime?: string | null;
  location: string;
  description?: string | null;
  status: string;
  eventMembers: PublicEventMember[];
}

export interface PublicScheduleStats {
  totalUpcoming: number;
  todayEventsCount: number;
  thisWeekEventsCount: number;
}

export interface PublicScheduleResponse {
  events: PublicEventItem[];
  stats: PublicScheduleStats;
  updatedAt: string;
}

export interface PublicScheduleParams {
  search?: string;
  filter?: 'all' | 'today' | 'week' | 'month';
}

export const publicScheduleService = {
  async getUpcomingSchedules(params?: PublicScheduleParams) {
    const res = await apiClient.get<ApiSuccessResponse<PublicScheduleResponse>>('/public/schedules', {
      params,
    });
    return res.data.data;
  },
};

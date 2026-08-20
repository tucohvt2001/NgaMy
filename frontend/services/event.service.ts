import { apiClient, ApiSuccessResponse } from '@/lib/axios';
import { EventItem, EventMember, EventMemberStatus, EventStatus, PaginatedResult } from '@/types/models';

export interface EventListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: EventStatus;
  fromDate?: string;
  toDate?: string;
}

export interface EventInput {
  eventCode?: string;
  name: string;
  eventDate: string;
  startTime?: string | null;
  endTime?: string | null;
  location: string;
  customerName?: string | null;
  customerPhone?: string | null;
  contractValue?: number | null;
  status?: EventStatus;
  description?: string | null;
}

export const eventService = {
  async list(params: EventListParams) {
    const res = await apiClient.get<ApiSuccessResponse<PaginatedResult<EventItem>>>('/events', { params });
    return res.data.data;
  },

  async getById(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<EventItem & { eventMembers: EventMember[] }>>(
      `/events/${id}`,
    );
    return res.data.data;
  },

  async create(input: EventInput) {
    const res = await apiClient.post<ApiSuccessResponse<EventItem>>('/events', input);
    return res.data.data;
  },

  async update(id: string, input: Partial<EventInput>) {
    const res = await apiClient.put<ApiSuccessResponse<EventItem>>(`/events/${id}`, input);
    return res.data.data;
  },

  async cancel(id: string) {
    await apiClient.delete(`/events/${id}`);
  },

  async getSettlement(id: string) {
    const res = await apiClient.get<ApiSuccessResponse<import('@/types/models').EventSettlementOverview>>(
      `/events/${id}/settlement`,
    );
    return res.data.data;
  },

  async settle(id: string, input: import('@/types/models').EventSettlementInput) {
    const res = await apiClient.post<ApiSuccessResponse<import('@/types/models').EventSettlementResult>>(
      `/events/${id}/settlement`,
      input,
    );
    return res.data.data;
  },
};

export interface AssignMemberInput {
  memberId: string;
  positionId: string;
  status?: EventMemberStatus;
  note?: string | null;
}

export const eventMemberService = {
  async list(eventId: string) {
    const res = await apiClient.get<ApiSuccessResponse<EventMember[]>>(`/events/${eventId}/members`);
    return res.data.data;
  },

  async assign(eventId: string, input: AssignMemberInput) {
    const res = await apiClient.post<ApiSuccessResponse<{ eventMember: EventMember; warnings: string[] }>>(
      `/events/${eventId}/members`,
      input,
    );
    return res.data.data;
  },

  async batchAssign(eventId: string, assignments: AssignMemberInput[]) {
    const res = await apiClient.post<
      ApiSuccessResponse<{
        count: number;
        items: EventMember[];
        warnings: { memberName?: string; warnings: string[] }[];
      }>
    >(`/events/${eventId}/members/batch`, { assignments });
    return res.data.data;
  },

  async update(eventId: string, memberId: string, input: Partial<AssignMemberInput>) {
    const res = await apiClient.put<ApiSuccessResponse<EventMember>>(
      `/events/${eventId}/members/${memberId}`,
      input,
    );
    return res.data.data;
  },

  async remove(eventId: string, memberId: string) {
    await apiClient.delete(`/events/${eventId}/members/${memberId}`);
  },
};

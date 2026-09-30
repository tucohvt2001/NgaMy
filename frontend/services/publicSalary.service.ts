import { publicApiClient, ApiSuccessResponse } from '@/lib/axios';

export interface PublicSalaryEvent {
  eventId: string;
  eventCode: string;
  eventName: string;
  eventType: string | null;
  eventDate: string;
  startTime?: string | null;
  endTime?: string | null;
  location: string;
  roles: string[];
  amount: number;
  status: string;
}

export interface PublicSalaryRecord {
  id: string;
  month: number;
  year: number;
  totalAmount: number;
  status: string;
  confirmedAt?: string | null;
}

export interface PublicSalaryMemberItem {
  memberId: string;
  memberCode: string;
  fullName: string;
  avatar?: string | null;
  phone?: string | null;
  status: string;
  bankAccount?: string | null;
  bankName?: string | null;
  bankCode?: string | null;
  bankBin?: string | null;
  teams: string[];
  positions: string[];
  totalEvents: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  events: PublicSalaryEvent[];
  salaryRecords: PublicSalaryRecord[];
}

export interface PublicSalarySummary {
  totalMembers: number;
  activeMembersWithEarnings: number;
  grandTotalAmount: number;
  grandPaidAmount: number;
  grandRemainingAmount: number;
  grandTotalEvents: number;
}

export interface PublicMemberOption {
  id: string;
  memberCode: string;
  fullName: string;
  avatar?: string | null;
  phone?: string | null;
  teams: string[];
  positions: string[];
}

export interface PublicSalaryResponse {
  summary: PublicSalarySummary;
  members: PublicSalaryMemberItem[];
  membersList?: PublicMemberOption[];
}

export interface PublicSalaryParams {
  fromDate?: string;
  toDate?: string;
  teamId?: string;
  search?: string;
  memberId?: string;
}

export const publicSalaryService = {
  async getPublicSalaries(params?: PublicSalaryParams) {
    const res = await publicApiClient.get<ApiSuccessResponse<PublicSalaryResponse>>('/public/salaries', {
      params,
    });
    return res.data.data;
  },
};

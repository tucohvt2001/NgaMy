import { EventMemberStatus, EventStatus, MemberStatus, RoleName } from './enums';

export type { EventMemberStatus, EventStatus, MemberStatus, RoleName };

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

export interface Position {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export interface Team {
  id: string;
  name: string;
  description?: string | null;
  leaderId?: string | null;
  leader?: Member | null;
  isActive: boolean;
  _count?: { members: number };
}

export interface Member {
  id: string;
  memberCode: string;
  fullName: string;
  avatar?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  phone?: string | null;
  address?: string | null;
  joinDate?: string | null;
  teams?: Team[];
  positions?: Position[];
  status: MemberStatus;
  bankAccount?: string | null;
  bankName?: string | null;
  note?: string | null;
  createdAt: string;
}

export interface Role {
  id: string;
  name: RoleName;
  description?: string | null;
}

export interface Account {
  id: string;
  username: string;
  email: string;
  roleId: string;
  role?: Role;
  memberId?: string | null;
  member?: Member | null;
  isActive: boolean;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  roleId: string;
  roleName: RoleName;
  memberId: string | null;
  isActive: boolean;
  permissions: string[];
}

export interface EventItem {
  id: string;
  eventCode: string;
  name: string;
  eventDate: string;
  startTime?: string | null;
  endTime?: string | null;
  location: string;
  customerName?: string | null;
  customerPhone?: string | null;
  contractValue?: number | null;
  status: EventStatus;
  description?: string | null;
  createdBy: string;
  creator?: { id: string; username: string };
  _count?: { eventMembers: number };
}

export interface EventMember {
  id: string;
  eventId: string;
  memberId: string;
  member: Member;
  positionId: string;
  position: Position;
  status: EventMemberStatus;
  note?: string | null;
}

export interface Attendance {
  id: string;
  eventId: string;
  event?: EventItem;
  memberId: string;
  member?: Member;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  status: string;
  note?: string | null;
  confirmedBy?: string | null;
  confirmedAt?: string | null;
}

export interface LeaveRequest {
  id: string;
  memberId: string;
  member?: Member;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

export interface SalaryConfig {
  id: string;
  positionId?: string | null;
  position?: Position | null;
  memberId?: string | null;
  member?: Member | null;
  eventId?: string | null;
  event?: EventItem | null;
  amount: number;
  note?: string | null;
  isActive: boolean;
}

export interface SalaryDetail {
  id: string;
  eventId?: string | null;
  event?: EventItem | null;
  positionId?: string | null;
  position?: Position | null;
  amount: number;
  note?: string | null;
}

export interface SalaryRecord {
  id: string;
  memberId: string;
  member?: Member;
  month: number;
  year: number;
  totalSessions: number;
  baseAmount: number;
  allowance: number;
  bonus: number;
  deduction: number;
  totalAmount: number;
  status: string;
  details?: SalaryDetail[];
}

export interface DashboardSummary {
  totalMembers: number;
  activeMembers: number;
  totalTeams: number;
  eventsThisMonth: number;
  participantsThisMonth: number;
  totalSalaryThisMonth: number;
}

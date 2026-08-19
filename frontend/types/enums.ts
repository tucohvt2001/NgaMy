export const ROLE_NAMES = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'MEMBER'] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

export const MEMBER_STATUSES = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const EVENT_STATUSES = ['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_MEMBER_STATUSES = ['ASSIGNED', 'CONFIRMED', 'DECLINED', 'REPLACED'] as const;
export type EventMemberStatus = (typeof EVENT_MEMBER_STATUSES)[number];

export const ATTENDANCE_STATUSES = [
  'PRESENT',
  'LATE',
  'ABSENT_WITH_PERMISSION',
  'ABSENT_WITHOUT_PERMISSION',
  'REPLACED',
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const LEAVE_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export const SALARY_RECORD_STATUSES = ['DRAFT', 'CONFIRMED'] as const;
export type SalaryRecordStatus = (typeof SALARY_RECORD_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Ngừng hoạt động',
  ON_LEAVE: 'Đang nghỉ',
  DRAFT: 'Nháp',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang diễn ra',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
  ASSIGNED: 'Đã phân công',
  DECLINED: 'Từ chối',
  REPLACED: 'Đã thay thế',
  PRESENT: 'Có mặt',
  LATE: 'Đi trễ',
  ABSENT_WITH_PERMISSION: 'Vắng có phép',
  ABSENT_WITHOUT_PERMISSION: 'Vắng không phép',
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
};

export const ROLE_LABELS: Record<RoleName, string> = {
  SUPER_ADMIN: 'Chủ nhiệm (Super Admin)',
  ADMIN: 'Quản trị viên',
  TEAM_LEADER: 'Đội trưởng',
  MEMBER: 'Thành viên',
};

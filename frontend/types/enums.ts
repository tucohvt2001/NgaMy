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

export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE'] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_CATEGORIES = [
  'EVENT_REVENUE',
  'SPONSORSHIP',
  'MEMBERSHIP_FEE',
  'EQUIPMENT_RENTAL',
  'OTHER_INCOME',
  'SALARY_PAYOUT',
  'EQUIPMENT_PURCHASE',
  'EQUIPMENT_MAINTENANCE',
  'TRAVEL_FOOD',
  'EVENT_OPERATIONS',
  'UNIFORM',
  'OTHER_EXPENSE',
] as const;
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const INCOME_CATEGORIES: TransactionCategory[] = [
  'EVENT_REVENUE',
  'SPONSORSHIP',
  'MEMBERSHIP_FEE',
  'EQUIPMENT_RENTAL',
  'OTHER_INCOME',
];

export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  'SALARY_PAYOUT',
  'EQUIPMENT_PURCHASE',
  'EQUIPMENT_MAINTENANCE',
  'TRAVEL_FOOD',
  'EVENT_OPERATIONS',
  'UNIFORM',
  'OTHER_EXPENSE',
];

export const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const TRANSACTION_STATUSES = ['COMPLETED', 'PENDING', 'CANCELLED'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
  EVENT_REVENUE: 'Thu biểu diễn show/sự kiện',
  SPONSORSHIP: 'Tài trợ / Ủng hộ',
  MEMBERSHIP_FEE: 'Quỹ hội viên / Đoàn phí',
  EQUIPMENT_RENTAL: 'Cho thuê đạo cụ / Đầu lân',
  OTHER_INCOME: 'Thu khác',
  SALARY_PAYOUT: 'Chi trả tiền công / Thù lao',
  EQUIPMENT_PURCHASE: 'Mua sắm đầu lân / Đạo cụ / Trống',
  EQUIPMENT_MAINTENANCE: 'Bảo dưỡng / Sửa chữa đạo cụ',
  TRAVEL_FOOD: 'Ăn uống / Đi lại lưu diễn',
  EVENT_OPERATIONS: 'Chi phí tổ chức sự kiện',
  UNIFORM: 'Đồng phục CLB',
  OTHER_EXPENSE: 'Chi khác',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản ngân hàng',
};

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


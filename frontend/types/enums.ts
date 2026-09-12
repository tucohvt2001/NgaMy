export const ROLE_NAMES = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'MEMBER'] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

export const MEMBER_STATUSES = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const EVENT_STATUSES = ['DRAFT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_TYPES = [
  'KHAI_TRUONG', // Khai trương / Khánh thành
  'TRUNG_THU', // Trung thu
  'TET', // Tết / Tân niên
  'DAM_CUOI', // Đám cưới / Hỷ sự
  'LE_HOI', // Lễ hội / Sự kiện lớn
  'BIEU_DIEN', // Biểu diễn thường
  'OTHER', // Khác
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<string, string> = {
  KHAI_TRUONG: 'Khai trương',
  TRUNG_THU: 'Trung thu',
  TET: 'Tết - Tân niên',
  DAM_CUOI: 'Hỷ sự - Cưới hỏi',
  LE_HOI: 'Lễ hội',
  BIEU_DIEN: 'Biểu diễn',
  OTHER: 'Khác',
};

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
  'BONUS_REWARD',
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
  'BONUS_REWARD',
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
  EVENT_REVENUE: 'Thu biểu diễn',
  SPONSORSHIP: 'Tài trợ - Ủng hộ',
  MEMBERSHIP_FEE: 'Đoàn phí - Hội phí',
  EQUIPMENT_RENTAL: 'Cho thuê đạo cụ',
  OTHER_INCOME: 'Thu khác',
  SALARY_PAYOUT: 'Chi tiền công',
  BONUS_REWARD: 'Chi khen thưởng',
  EQUIPMENT_PURCHASE: 'Mua sắm đạo cụ',
  EQUIPMENT_MAINTENANCE: 'Sửa chữa đạo cụ',
  TRAVEL_FOOD: 'Ăn uống - Xăng xe',
  EVENT_OPERATIONS: 'Chi phí sự kiện',
  UNIFORM: 'Đồng phục',
  OTHER_EXPENSE: 'Chi khác',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
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
  SUPER_ADMIN: 'Chủ nhiệm',
  ADMIN: 'Quản trị viên',
  TEAM_LEADER: 'Đội trưởng',
  MEMBER: 'Thành viên',
};

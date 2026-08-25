// Các hằng số enum dùng chung toàn hệ thống (SQLite không hỗ trợ enum của Prisma nên khai báo ở đây)

export const ROLE_NAMES = ['SUPER_ADMIN', 'ADMIN', 'TEAM_LEADER', 'MEMBER'] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

export const MEMBER_STATUSES = ['ACTIVE', 'INACTIVE', 'ON_LEAVE'] as const;
export type MemberStatus = (typeof MEMBER_STATUSES)[number];

export const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;
export type Gender = (typeof GENDERS)[number];

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
  KHAI_TRUONG: 'Khai trương / Khánh thành',
  TRUNG_THU: 'Trung thu',
  TET: 'Tết / Tân niên',
  DAM_CUOI: 'Đám cưới / Hỷ sự',
  LE_HOI: 'Lễ hội / Sự kiện lớn',
  BIEU_DIEN: 'Biểu diễn thường',
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
  // Thu (INCOME)
  'EVENT_REVENUE', // Thu tiền biểu diễn show/sự kiện
  'SPONSORSHIP', // Tài trợ / ủng hộ
  'MEMBERSHIP_FEE', // Quỹ hội viên / đoàn phí
  'EQUIPMENT_RENTAL', // Cho thuê đạo cụ / đầu lân / trang phục
  'OTHER_INCOME', // Thu khác

  // Chi (EXPENSE)
  'SALARY_PAYOUT', // Chi trả tiền công biểu diễn
  'BONUS_REWARD', // Chi khen thưởng, lì xì, thưởng nóng
  'EQUIPMENT_PURCHASE', // Mua sắm đầu lân, rồng, trống, lò, cờ
  'EQUIPMENT_MAINTENANCE', // Sửa chữa, may vá, bảo dưỡng đạo cụ
  'TRAVEL_FOOD', // Chi phí ăn uống, xăng xe khi lưu diễn
  'EVENT_OPERATIONS', // Chi phí tổ chức sự kiện / lễ hội
  'UNIFORM', // May / mua đồng phục CLB
  'OTHER_EXPENSE', // Chi khác
] as const;
export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const TRANSACTION_STATUSES = ['COMPLETED', 'PENDING', 'CANCELLED'] as const;
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number];

// Danh sách permission code theo module, dùng cho middleware authorize()
export const PERMISSIONS = {
  MEMBER_READ: 'member:read',
  MEMBER_CREATE: 'member:create',
  MEMBER_UPDATE: 'member:update',
  MEMBER_DELETE: 'member:delete',

  TEAM_READ: 'team:read',
  TEAM_CREATE: 'team:create',
  TEAM_UPDATE: 'team:update',
  TEAM_DELETE: 'team:delete',

  POSITION_READ: 'position:read',
  POSITION_CREATE: 'position:create',
  POSITION_UPDATE: 'position:update',
  POSITION_DELETE: 'position:delete',

  ACCOUNT_READ: 'account:read',
  ACCOUNT_CREATE: 'account:create',
  ACCOUNT_UPDATE: 'account:update',
  ACCOUNT_DELETE: 'account:delete',

  EVENT_READ: 'event:read',
  EVENT_CREATE: 'event:create',
  EVENT_UPDATE: 'event:update',
  EVENT_DELETE: 'event:delete',

  ASSIGNMENT_READ: 'assignment:read',
  ASSIGNMENT_MANAGE: 'assignment:manage',

  ATTENDANCE_READ: 'attendance:read',
  ATTENDANCE_CHECK: 'attendance:check',
  ATTENDANCE_CONFIRM: 'attendance:confirm',

  LEAVE_READ: 'leave:read',
  LEAVE_CREATE: 'leave:create',
  LEAVE_APPROVE: 'leave:approve',

  SALARY_READ: 'salary:read',
  SALARY_MANAGE: 'salary:manage',

  FINANCE_READ: 'finance:read',
  FINANCE_MANAGE: 'finance:manage',

  REPORT_READ: 'report:read',
  DASHBOARD_READ: 'dashboard:read',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Ma trận role -> permission, dùng để seed RolePermission
export const ROLE_PERMISSIONS: Record<RoleName, PermissionCode[]> = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ADMIN: Object.values(PERMISSIONS),
  TEAM_LEADER: [
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.TEAM_READ,
    PERMISSIONS.POSITION_READ,
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.ASSIGNMENT_READ,
    PERMISSIONS.ASSIGNMENT_MANAGE,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_CONFIRM,
    PERMISSIONS.LEAVE_READ,
    PERMISSIONS.LEAVE_APPROVE,
    PERMISSIONS.SALARY_READ,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.DASHBOARD_READ,
  ],
  MEMBER: [
    PERMISSIONS.MEMBER_READ,
    PERMISSIONS.EVENT_READ,
    PERMISSIONS.ASSIGNMENT_READ,
    PERMISSIONS.ATTENDANCE_READ,
    PERMISSIONS.ATTENDANCE_CHECK,
    PERMISSIONS.LEAVE_READ,
    PERMISSIONS.LEAVE_CREATE,
    PERMISSIONS.SALARY_READ,
  ],
};


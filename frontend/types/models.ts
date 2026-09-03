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

export interface Bank {
  id: string;
  code: string;
  name: string;
  shortName: string;
  bin: string;
  logo?: string | null;
  transferSupported: boolean;
  lookupSupported: boolean;
  swiftCode?: string | null;
  isActive: boolean;
  displayOrder: number;
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
  bankCode?: string | null;
  bankBin?: string | null;
  bankId?: string | null;
  bank?: Bank | null;
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

export interface EventTypeModel {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  color?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventItem {
  id: string;
  eventCode: string;
  name: string;
  eventType?: string | null;
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
  _count?: { eventMembers?: number; transactions?: number; salaryConfigs?: number };
}

export interface EventMonthlyStat {
  month: number;
  monthLabel: string;
  eventsCount: number;
  completedCount: number;
  contractValue: number;
  participantsCount: number;
}

export interface EventStats {
  year: number;
  totalEvents: number;
  completedEvents: number;
  upcomingEvents: number;
  cancelledEvents: number;
  settledEvents: number;
  unsettledEvents: number;
  totalContractValue: number;
  monthlyStats: EventMonthlyStat[];
  statusDistribution: Array<{ name: string; status: string; value: number; color: string }>;
  settlementDistribution: Array<{ name: string; value: number; color: string }>;
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
  createdAt?: string;
  updatedAt?: string;
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
  eventType?: string | null;
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
  upcomingEvents?: EventItem[];
}

export interface TransactionDetail {
  id: string;
  transactionId: string;
  memberId?: string | null;
  amount: number;
  description?: string | null;
  note?: string | null;
  createdAt: string;
  member?: Member | null;
}

export interface Transaction {
  id: string;
  code: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  tipAmount: number;
  transactionDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  payerOrReceiver: string;
  description?: string | null;
  eventId?: string | null;
  event?: {
    id: string;
    eventCode: string;
    name: string;
    location?: string;
    contractValue?: number | null;
    customerName?: string | null;
  } | null;
  memberId?: string | null;
  member?: { id: string; memberCode: string; fullName: string; phone?: string } | null;
  createdBy: string;
  creator?: { id: string; username: string } | null;
  approvedBy?: string | null;
  approver?: { id: string; username: string } | null;
  receiptImage?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  details?: TransactionDetail[];
}

export interface TransactionCategorySummary {
  category: string;
  categoryName: string;
  type: string;
  count: number;
  total: number;
}

export interface MonthlyFinanceStat {
  month: number;
  monthLabel: string;
  income: number;
  expense: number;
  balance: number;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  totalTips: number;
  netBalance: number;
  transactionCount: number;
  byCategory: TransactionCategorySummary[];
  byPaymentMethod: {
    CASH: { income: number; expense: number };
    BANK_TRANSFER: { income: number; expense: number };
  };
  monthlyStats: MonthlyFinanceStat[];
}

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  type?: 'INCOME' | 'EXPENSE';
  category?: string;
  paymentMethod?: 'CASH' | 'BANK_TRANSFER';
  status?: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  eventId?: string;
  memberId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
}

export interface TransactionInput {
  type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  tipAmount?: number;
  transactionDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  status?: 'COMPLETED' | 'PENDING' | 'CANCELLED';
  payerOrReceiver: string;
  description?: string;
  eventId?: string | null;
  memberId?: string | null;
  receiptImage?: string | null;
  notes?: string | null;
}

export interface BulkRewardItemInput {
  memberId: string;
  amount: number;
  note?: string;
}

export interface BulkRewardInput {
  title: string;
  transactionDate: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  notes?: string | null;
  items: BulkRewardItemInput[];
}

export interface BulkRewardPaymentItem {
  transactionId: string;
  code: string;
  memberId: string;
  memberName: string;
  memberCode: string;
  amount: number;
  bankAccount?: string | null;
  bankName?: string | null;
  bankCode?: string | null;
  bankBin?: string | null;
  bankLogo?: string | null;
  description: string;
}

export interface BulkRewardResult {
  createdCount: number;
  memberCount: number;
  totalAmount: number;
  transaction?: Transaction;
  transactions?: Transaction[];
  paymentItems: BulkRewardPaymentItem[];
}

// ============ DỰ TOÁN SHOW DIỄN ============

export interface EventSettlementMember {
  id: string;
  memberId: string;
  memberCode: string;
  fullName: string;
  phone?: string | null;
  bankAccount?: string | null;
  bankName?: string | null;
  positionId: string;
  positionName: string;
  status: string;
  note?: string | null;
  payoutAmount?: number;
  payoutNote?: string;
  isPaid?: boolean;
}

export interface EventSettlementOverview {
  event: EventItem;
  members: EventSettlementMember[];
  existingTransactions: Transaction[];
  settledIncome: number;
  settledExpense: number;
  isSettled: boolean;
}

export interface MemberPayoutItem {
  memberId: string;
  amount: number;
  positionName?: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  note?: string;
}

export interface EventExpenseItem {
  category: string;
  amount: number;
  description?: string;
  receiver?: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
}

export interface EventSettlementInput {
  contractAmount: number;
  tipAmount: number;
  payer: string;
  paymentMethod: 'CASH' | 'BANK_TRANSFER';
  settlementDate?: string;
  memberPayouts: MemberPayoutItem[];
  expenses: EventExpenseItem[];
  createIncomeVoucher?: boolean;
  createExpenseVouchers?: boolean;
  markEventCompleted?: boolean;
  isDraft?: boolean;
  notes?: string;
}

export interface EventSettlementResult {
  success: boolean;
  message: string;
  createdTransactionsCount: number;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  transactions: Transaction[];
}




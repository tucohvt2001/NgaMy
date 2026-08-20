import ExcelJS from 'exceljs';
import { prisma } from '../config/prisma';
import {
  CreateTransactionInput,
  QueryTransactionInput,
  UpdateTransactionInput,
} from '../validators/transaction.validator';
import { AppError } from '../utils/AppError';

const CATEGORY_NAMES: Record<string, string> = {
  EVENT_REVENUE: 'Thu biểu diễn sự kiện/show',
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

const PAYMENT_METHOD_NAMES: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
};

const STATUS_NAMES: Record<string, string> = {
  COMPLETED: 'Hoàn thành',
  PENDING: 'Chờ duyệt',
  CANCELLED: 'Đã hủy',
};

export const transactionService = {
  async generateCode(type: 'INCOME' | 'EXPENSE', date: Date): Promise<string> {
    const prefix = type === 'INCOME' ? 'PT' : 'PC';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const pattern = `${prefix}-${year}${month}-`;

    const lastTransaction = await prisma.transaction.findFirst({
      where: {
        code: {
          startsWith: pattern,
        },
      },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    let nextNumber = 1;
    if (lastTransaction?.code) {
      const parts = lastTransaction.code.split('-');
      if (parts.length === 3) {
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed)) {
          nextNumber = parsed + 1;
        }
      }
    }

    return `${pattern}${String(nextNumber).padStart(4, '0')}`;
  },

  async list(query: QueryTransactionInput) {
    const {
      page,
      limit,
      type,
      category,
      paymentMethod,
      status,
      eventId,
      memberId,
      fromDate,
      toDate,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (type) where.type = type;
    if (category) where.category = category;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (status) where.status = status;
    if (eventId) where.eventId = eventId;
    if (memberId) where.memberId = memberId;

    if (fromDate || toDate) {
      where.transactionDate = {};
      if (fromDate) where.transactionDate.gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        where.transactionDate.lte = end;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { payerOrReceiver: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { transactionDate: 'desc' },
        include: {
          event: {
            select: {
              id: true,
              eventCode: true,
              name: true,
              location: true,
              contractValue: true,
              customerName: true,
            },
          },
          member: { select: { id: true, memberCode: true, fullName: true, phone: true } },
          creator: { select: { id: true, username: true } },
          approver: { select: { id: true, username: true } },
        },
      }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getSummary(params: { fromDate?: string; toDate?: string; year?: number }) {
    const where: any = {
      status: 'COMPLETED',
    };

    if (params.fromDate || params.toDate) {
      where.transactionDate = {};
      if (params.fromDate) where.transactionDate.gte = new Date(params.fromDate);
      if (params.toDate) {
        const end = new Date(params.toDate);
        end.setHours(23, 59, 59, 999);
        where.transactionDate.lte = end;
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        type: true,
        category: true,
        amount: true,
        tipAmount: true,
        paymentMethod: true,
        transactionDate: true,
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let totalTips = 0;
    const byCategory: Record<string, { count: number; total: number; type: string }> = {};
    const byPaymentMethod: Record<string, { income: number; expense: number }> = {
      CASH: { income: 0, expense: 0 },
      BANK_TRANSFER: { income: 0, expense: 0 },
    };

    transactions.forEach((tx) => {
      if (tx.type === 'INCOME') {
        totalIncome += tx.amount;
        totalTips += tx.tipAmount || 0;
        if (byPaymentMethod[tx.paymentMethod]) {
          byPaymentMethod[tx.paymentMethod].income += tx.amount;
        }
      } else {
        totalExpense += tx.amount;
        if (byPaymentMethod[tx.paymentMethod]) {
          byPaymentMethod[tx.paymentMethod].expense += tx.amount;
        }
      }

      if (!byCategory[tx.category]) {
        byCategory[tx.category] = { count: 0, total: 0, type: tx.type };
      }
      byCategory[tx.category].count += 1;
      byCategory[tx.category].total += tx.amount;
    });

    const netBalance = totalIncome - totalExpense;

    // Biểu đồ theo tháng của năm hiện tại
    const targetYear = params.year || new Date().getFullYear();
    const monthlyStats: Array<{
      month: number;
      monthLabel: string;
      income: number;
      expense: number;
      balance: number;
    }> = [];

    for (let m = 1; m <= 12; m++) {
      monthlyStats.push({
        month: m,
        monthLabel: `Tháng ${m}`,
        income: 0,
        expense: 0,
        balance: 0,
      });
    }

    const yearTransactions = await prisma.transaction.findMany({
      where: {
        status: 'COMPLETED',
        transactionDate: {
          gte: new Date(targetYear, 0, 1),
          lte: new Date(targetYear, 11, 31, 23, 59, 59, 999),
        },
      },
      select: {
        type: true,
        amount: true,
        transactionDate: true,
      },
    });

    yearTransactions.forEach((tx) => {
      const monthIdx = tx.transactionDate.getMonth();
      if (tx.type === 'INCOME') {
        monthlyStats[monthIdx].income += tx.amount;
      } else {
        monthlyStats[monthIdx].expense += tx.amount;
      }
      monthlyStats[monthIdx].balance =
        monthlyStats[monthIdx].income - monthlyStats[monthIdx].expense;
    });

    return {
      totalIncome,
      totalExpense,
      totalTips,
      netBalance,
      transactionCount: transactions.length,
      byCategory: Object.entries(byCategory).map(([category, data]) => ({
        category,
        categoryName: CATEGORY_NAMES[category] || category,
        type: data.type,
        count: data.count,
        total: data.total,
      })),
      byPaymentMethod,
      monthlyStats,
    };
  },

  async getById(id: string) {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        event: {
          select: {
            id: true,
            eventCode: true,
            name: true,
            location: true,
            eventDate: true,
            contractValue: true,
            customerName: true,
            customerPhone: true,
          },
        },
        member: { select: { id: true, memberCode: true, fullName: true, phone: true } },
        creator: { select: { id: true, username: true } },
        approver: { select: { id: true, username: true } },
      },
    });

    if (!transaction) {
      throw AppError.notFound('Không tìm thấy phiếu giao dịch thu chi');
    }

    return transaction;
  },

  async create(input: CreateTransactionInput, userId: string) {
    const txDate = new Date(input.transactionDate);
    const code = await this.generateCode(input.type, txDate);

    const transaction = await prisma.transaction.create({
      data: {
        code,
        type: input.type,
        category: input.category,
        amount: input.amount,
        tipAmount: input.tipAmount || 0,
        transactionDate: txDate,
        paymentMethod: input.paymentMethod,
        status: input.status,
        payerOrReceiver: input.payerOrReceiver,
        description: input.description,
        eventId: input.eventId || null,
        memberId: input.memberId || null,
        receiptImage: input.receiptImage || null,
        notes: input.notes || null,
        createdBy: userId,
      },
      include: {
        event: { select: { id: true, eventCode: true, name: true, contractValue: true } },
        member: { select: { id: true, memberCode: true, fullName: true } },
        creator: { select: { id: true, username: true } },
      },
    });

    return transaction;
  },

  async update(id: string, input: UpdateTransactionInput) {
    await this.getById(id);

    const data: any = { ...input };
    if (input.transactionDate) {
      data.transactionDate = new Date(input.transactionDate);
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data,
      include: {
        event: { select: { id: true, eventCode: true, name: true, contractValue: true } },
        member: { select: { id: true, memberCode: true, fullName: true } },
        creator: { select: { id: true, username: true } },
        approver: { select: { id: true, username: true } },
      },
    });

    return updated;
  },

  async remove(id: string) {
    await this.getById(id);
    await prisma.transaction.delete({ where: { id } });
    return { success: true, message: 'Đã xóa phiếu giao dịch thành công' };
  },

  async exportExcel(query: QueryTransactionInput) {
    const { items } = await this.list({ ...query, limit: 10000, page: 1 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CLB Lân Sư Rồng Nga My Thượng';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Sổ Quỹ Thu Chi');

    sheet.columns = [
      { header: 'STT', key: 'stt', width: 8 },
      { header: 'Mã phiếu', key: 'code', width: 18 },
      { header: 'Ngày giao dịch', key: 'date', width: 16 },
      { header: 'Loại', key: 'type', width: 12 },
      { header: 'Danh mục', key: 'category', width: 32 },
      { header: 'Số tiền (VNĐ)', key: 'amount', width: 20 },
      { header: 'Người nộp/nhận', key: 'payerOrReceiver', width: 26 },
      { header: 'Phương thức', key: 'paymentMethod', width: 16 },
      { header: 'Sự kiện liên quan', key: 'event', width: 28 },
      { header: 'Thành viên liên quan', key: 'member', width: 24 },
      { header: 'Nội dung / Diễn giải', key: 'description', width: 35 },
      { header: 'Trạng thái', key: 'status', width: 15 },
    ];

    // Header styling
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC00000' }, // Đỏ truyền thống Lân Sư Rồng
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    let totalIncome = 0;
    let totalExpense = 0;

    items.forEach((item, index) => {
      const isIncome = item.type === 'INCOME';
      if (item.status === 'COMPLETED') {
        if (isIncome) totalIncome += item.amount;
        else totalExpense += item.amount;
      }

      const row = sheet.addRow({
        stt: index + 1,
        code: item.code,
        date: new Date(item.transactionDate).toLocaleDateString('vi-VN'),
        type: isIncome ? 'Thu' : 'Chi',
        category: CATEGORY_NAMES[item.category] || item.category,
        amount: item.amount,
        payerOrReceiver: item.payerOrReceiver,
        paymentMethod: PAYMENT_METHOD_NAMES[item.paymentMethod] || item.paymentMethod,
        event: item.event ? `${item.event.eventCode} - ${item.event.name}` : '-',
        member: item.member ? `${item.member.memberCode} - ${item.member.fullName}` : '-',
        description: item.description || '-',
        status: STATUS_NAMES[item.status] || item.status,
      });

      row.alignment = { vertical: 'middle' };
      row.getCell('amount').numFmt = '#,##0 "đ"';
      row.getCell('stt').alignment = { horizontal: 'center' };
      row.getCell('code').alignment = { horizontal: 'center' };
      row.getCell('date').alignment = { horizontal: 'center' };
      row.getCell('type').alignment = { horizontal: 'center' };
      row.getCell('paymentMethod').alignment = { horizontal: 'center' };
      row.getCell('status').alignment = { horizontal: 'center' };

      // Màu sắc theo loại Thu / Chi
      if (isIncome) {
        row.getCell('type').font = { color: { argb: 'FF16A34A' }, bold: true };
      } else {
        row.getCell('type').font = { color: { argb: 'FFDC2626' }, bold: true };
      }
    });

    // Dòng tổng kết
    sheet.addRow({});
    const summaryRow1 = sheet.addRow({
      category: 'TỔNG THU:',
      amount: totalIncome,
    });
    summaryRow1.font = { bold: true, color: { argb: 'FF16A34A' } };
    summaryRow1.getCell('amount').numFmt = '#,##0 "đ"';

    const summaryRow2 = sheet.addRow({
      category: 'TỔNG CHI:',
      amount: totalExpense,
    });
    summaryRow2.font = { bold: true, color: { argb: 'FFDC2626' } };
    summaryRow2.getCell('amount').numFmt = '#,##0 "đ"';

    const summaryRow3 = sheet.addRow({
      category: 'TỒN QUỸ THỰC TẾ:',
      amount: totalIncome - totalExpense,
    });
    summaryRow3.font = { bold: true, color: { argb: 'FF2563EB' } };
    summaryRow3.getCell('amount').numFmt = '#,##0 "đ"';

    return workbook;
  },
};

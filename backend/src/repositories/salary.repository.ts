import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface FindManySalaryParams {
  skip: number;
  take: number;
  memberId?: string;
  month?: number;
  year?: number;
  status?: string;
}

function buildWhere(params: Omit<FindManySalaryParams, 'skip' | 'take'>): Prisma.SalaryRecordWhereInput {
  return {
    ...(params.memberId ? { memberId: params.memberId } : {}),
    ...(params.month ? { month: params.month } : {}),
    ...(params.year ? { year: params.year } : {}),
    ...(params.status ? { status: params.status } : {}),
  };
}

export const salaryRepository = {
  findMany(params: FindManySalaryParams) {
    return prisma.salaryRecord.findMany({
      where: buildWhere(params),
      skip: params.skip,
      take: params.take,
      include: { member: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  },

  count(params: Omit<FindManySalaryParams, 'skip' | 'take'>) {
    return prisma.salaryRecord.count({ where: buildWhere(params) });
  },

  findById(id: string) {
    return prisma.salaryRecord.findUnique({
      where: { id },
      include: { member: true, details: { include: { event: true, position: true } } },
    });
  },

  findByMemberMonthYear(memberId: string, month: number, year: number) {
    return prisma.salaryRecord.findUnique({ where: { memberId_month_year: { memberId, month, year } } });
  },

  async upsertWithDetails(params: {
    memberId: string;
    month: number;
    year: number;
    totalSessions: number;
    baseAmount: number;
    allowance: number;
    bonus: number;
    deduction: number;
    totalAmount: number;
    details: { eventId: string; positionId: string | null; amount: number; note?: string }[];
  }) {
    const existing = await salaryRepository.findByMemberMonthYear(params.memberId, params.month, params.year);

    if (existing) {
      await prisma.salaryDetail.deleteMany({ where: { salaryRecordId: existing.id } });
      return prisma.salaryRecord.update({
        where: { id: existing.id },
        data: {
          totalSessions: params.totalSessions,
          baseAmount: params.baseAmount,
          allowance: params.allowance,
          bonus: params.bonus,
          deduction: params.deduction,
          totalAmount: params.totalAmount,
          status: 'DRAFT',
          details: { create: params.details },
        },
        include: { details: true, member: true },
      });
    }

    return prisma.salaryRecord.create({
      data: {
        memberId: params.memberId,
        month: params.month,
        year: params.year,
        totalSessions: params.totalSessions,
        baseAmount: params.baseAmount,
        allowance: params.allowance,
        bonus: params.bonus,
        deduction: params.deduction,
        totalAmount: params.totalAmount,
        details: { create: params.details },
      },
      include: { details: true, member: true },
    });
  },

  confirm(id: string, confirmedBy: string) {
    return prisma.salaryRecord.update({
      where: { id },
      data: { status: 'CONFIRMED', confirmedBy, confirmedAt: new Date() },
    });
  },
};

export const salaryConfigRepository = {
  findMany() {
    return prisma.salaryConfig.findMany({
      include: { position: true, member: true, event: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  // Tìm mức lương ưu tiên theo Member > Event > Position (từ cụ thể đến chung)
  async findApplicableAmount(memberId: string, eventId: string, positionId: string | null): Promise<number> {
    const memberConfig = await prisma.salaryConfig.findFirst({ where: { memberId, isActive: true } });
    if (memberConfig) return memberConfig.amount;

    const eventConfig = await prisma.salaryConfig.findFirst({ where: { eventId, isActive: true } });
    if (eventConfig) return eventConfig.amount;

    if (positionId) {
      const positionConfig = await prisma.salaryConfig.findFirst({ where: { positionId, isActive: true } });
      if (positionConfig) return positionConfig.amount;
    }

    return 0;
  },

  create(data: {
    positionId?: string | null;
    memberId?: string | null;
    eventId?: string | null;
    amount: number;
    note?: string | null;
    isActive?: boolean;
  }) {
    return prisma.salaryConfig.create({ data });
  },

  update(id: string, data: Partial<{ amount: number; note: string | null; isActive: boolean }>) {
    return prisma.salaryConfig.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.salaryConfig.delete({ where: { id } });
  },

  findById(id: string) {
    return prisma.salaryConfig.findUnique({ where: { id } });
  },
};

import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface FindManyLeavesParams {
  skip: number;
  take: number;
  memberId?: string;
  status?: string;
}

function buildWhere(params: Omit<FindManyLeavesParams, 'skip' | 'take'>): Prisma.LeaveRequestWhereInput {
  return {
    ...(params.memberId ? { memberId: params.memberId } : {}),
    ...(params.status ? { status: params.status } : {}),
  };
}

export const leaveRepository = {
  findMany(params: FindManyLeavesParams) {
    return prisma.leaveRequest.findMany({
      where: buildWhere(params),
      skip: params.skip,
      take: params.take,
      include: { member: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  count(params: Omit<FindManyLeavesParams, 'skip' | 'take'>) {
    return prisma.leaveRequest.count({ where: buildWhere(params) });
  },

  findById(id: string) {
    return prisma.leaveRequest.findUnique({ where: { id }, include: { member: true } });
  },

  create(data: { memberId: string; fromDate: Date; toDate: Date; reason: string }) {
    return prisma.leaveRequest.create({ data, include: { member: true } });
  },

  update(id: string, data: Partial<{ status: string; approvedBy: string; approvedAt: Date }>) {
    return prisma.leaveRequest.update({ where: { id }, data, include: { member: true } });
  },

  findOverlappingAssignments(memberId: string, fromDate: Date, toDate: Date) {
    return prisma.eventMember.findMany({
      where: {
        memberId,
        event: { eventDate: { gte: fromDate, lte: toDate } },
      },
      include: { event: true },
    });
  },
};

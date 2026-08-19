import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface FindManyAttendanceParams {
  skip: number;
  take: number;
  eventId?: string;
  memberId?: string;
  status?: string;
}

function buildWhere(params: Omit<FindManyAttendanceParams, 'skip' | 'take'>): Prisma.AttendanceWhereInput {
  return {
    ...(params.eventId ? { eventId: params.eventId } : {}),
    ...(params.memberId ? { memberId: params.memberId } : {}),
    ...(params.status ? { status: params.status } : {}),
  };
}

export const attendanceRepository = {
  findMany(params: FindManyAttendanceParams) {
    return prisma.attendance.findMany({
      where: buildWhere(params),
      skip: params.skip,
      take: params.take,
      include: { event: true, member: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  count(params: Omit<FindManyAttendanceParams, 'skip' | 'take'>) {
    return prisma.attendance.count({ where: buildWhere(params) });
  },

  findByEventAndMember(eventId: string, memberId: string) {
    return prisma.attendance.findUnique({ where: { eventId_memberId: { eventId, memberId } } });
  },

  findById(id: string) {
    return prisma.attendance.findUnique({ where: { id }, include: { event: true, member: true } });
  },

  create(data: {
    eventId: string;
    memberId: string;
    checkInTime?: Date;
    checkOutTime?: Date;
    status?: string;
    note?: string | null;
  }) {
    return prisma.attendance.create({ data, include: { event: true, member: true } });
  },

  update(
    id: string,
    data: Partial<{
      checkInTime: Date;
      checkOutTime: Date;
      status: string;
      note: string | null;
      confirmedBy: string;
      confirmedAt: Date;
    }>,
  ) {
    return prisma.attendance.update({ where: { id }, data, include: { event: true, member: true } });
  },
};

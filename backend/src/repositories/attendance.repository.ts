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
      include: {
        event: true,
        member: true,
        confirmedByUser: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  count(params: Omit<FindManyAttendanceParams, 'skip' | 'take'>) {
    return prisma.attendance.count({ where: buildWhere(params) });
  },

  findByEvent(eventId: string) {
    return prisma.attendance.findMany({
      where: { eventId },
      include: {
        event: true,
        member: true,
        confirmedByUser: { select: { id: true, username: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  },

  findByEventAndMember(eventId: string, memberId: string) {
    return prisma.attendance.findUnique({
      where: { eventId_memberId: { eventId, memberId } },
      include: {
        event: true,
        member: true,
        confirmedByUser: { select: { id: true, username: true } },
      },
    });
  },

  findById(id: string) {
    return prisma.attendance.findUnique({
      where: { id },
      include: {
        event: true,
        member: true,
        confirmedByUser: { select: { id: true, username: true } },
      },
    });
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
      checkInTime: Date | null;
      checkOutTime: Date | null;
      status: string;
      note: string | null;
      confirmedBy: string | null;
      confirmedAt: Date | null;
    }>,
  ) {
    return prisma.attendance.update({
      where: { id },
      data,
      include: {
        event: true,
        member: true,
        confirmedByUser: { select: { id: true, username: true } },
      },
    });
  },

  upsert(data: {
    eventId: string;
    memberId: string;
    status: string;
    checkInTime?: Date | null;
    checkOutTime?: Date | null;
    note?: string | null;
    confirmedBy?: string | null;
    confirmedAt?: Date | null;
  }) {
    return prisma.attendance.upsert({
      where: {
        eventId_memberId: {
          eventId: data.eventId,
          memberId: data.memberId,
        },
      },
      create: {
        eventId: data.eventId,
        memberId: data.memberId,
        status: data.status,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        note: data.note,
        confirmedBy: data.confirmedBy,
        confirmedAt: data.confirmedAt,
      },
      update: {
        status: data.status,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        note: data.note,
        confirmedBy: data.confirmedBy,
        confirmedAt: data.confirmedAt,
      },
      include: {
        event: true,
        member: true,
        confirmedByUser: { select: { id: true, username: true } },
      },
    });
  },

  delete(id: string) {
    return prisma.attendance.delete({
      where: { id },
    });
  },
};

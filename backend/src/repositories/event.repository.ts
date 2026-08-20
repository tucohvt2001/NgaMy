import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

export interface FindManyEventsParams {
  skip: number;
  take: number;
  status?: string;
  search?: string;
}

function buildWhere(params: Omit<FindManyEventsParams, 'skip' | 'take'>): Prisma.EventWhereInput {
  return {
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search } },
            { eventCode: { contains: params.search } },
            { location: { contains: params.search } },
          ],
        }
      : {}),
  };
}

export const eventRepository = {
  findMany(params: FindManyEventsParams) {
    return prisma.event.findMany({
      where: buildWhere(params),
      skip: params.skip,
      take: params.take,
      include: {
        creator: { select: { id: true, username: true } },
        _count: { select: { eventMembers: true, transactions: true } },
      },
      orderBy: { eventDate: 'desc' },
    });
  },

  count(params: Omit<FindManyEventsParams, 'skip' | 'take'>) {
    return prisma.event.count({ where: buildWhere(params) });
  },

  findById(id: string) {
    return prisma.event.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, username: true } },
        eventMembers: { include: { member: true, position: true } },
        _count: { select: { eventMembers: true, transactions: true } },
      },
    });
  },

  findByCode(eventCode: string) {
    return prisma.event.findUnique({ where: { eventCode } });
  },

  create(data: Prisma.EventCreateInput) {
    return prisma.event.create({ data });
  },

  update(id: string, data: Prisma.EventUpdateInput) {
    return prisma.event.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.event.delete({ where: { id } });
  },

  findOverlapping(memberId: string, eventDate: Date, excludeEventId?: string) {
    const startOfDay = new Date(eventDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(eventDate);
    endOfDay.setHours(23, 59, 59, 999);

    return prisma.eventMember.findMany({
      where: {
        memberId,
        eventId: excludeEventId ? { not: excludeEventId } : undefined,
        event: { eventDate: { gte: startOfDay, lte: endOfDay } },
      },
      include: { event: true },
    });
  },
};

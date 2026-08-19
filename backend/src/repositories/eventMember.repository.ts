import { prisma } from '../config/prisma';

export const eventMemberRepository = {
  findByEvent(eventId: string) {
    return prisma.eventMember.findMany({
      where: { eventId },
      include: { member: true, position: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  findOne(eventId: string, memberId: string) {
    return prisma.eventMember.findUnique({
      where: { eventId_memberId: { eventId, memberId } },
    });
  },

  create(data: { eventId: string; memberId: string; positionId: string; status?: string; note?: string | null }) {
    return prisma.eventMember.create({ data, include: { member: true, position: true } });
  },

  update(eventId: string, memberId: string, data: Partial<{ positionId: string; status: string; note: string | null }>) {
    return prisma.eventMember.update({
      where: { eventId_memberId: { eventId, memberId } },
      data,
      include: { member: true, position: true },
    });
  },

  delete(eventId: string, memberId: string) {
    return prisma.eventMember.delete({ where: { eventId_memberId: { eventId, memberId } } });
  },
};

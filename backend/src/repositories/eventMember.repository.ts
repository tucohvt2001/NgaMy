import { prisma } from '../config/prisma';

export const eventMemberRepository = {
  findByEvent(eventId: string) {
    return prisma.eventMember.findMany({
      where: { eventId },
      include: { member: true, position: true },
      orderBy: { createdAt: 'asc' },
    });
  },

  findOne(eventId: string, memberId: string, positionId?: string) {
    if (positionId) {
      return prisma.eventMember.findUnique({
        where: {
          eventId_memberId_positionId: { eventId, memberId, positionId },
        },
        include: { member: true, position: true },
      });
    }
    return prisma.eventMember.findFirst({
      where: { eventId, memberId },
      include: { member: true, position: true },
    });
  },

  create(data: { eventId: string; memberId: string; positionId: string; status?: string; note?: string | null }) {
    return prisma.eventMember.create({ data, include: { member: true, position: true } });
  },

  update(eventId: string, memberId: string, positionId: string, data: Partial<{ status: string; note: string | null }>) {
    return prisma.eventMember.update({
      where: { eventId_memberId_positionId: { eventId, memberId, positionId } },
      data,
      include: { member: true, position: true },
    });
  },

  delete(eventId: string, memberId: string, positionId?: string) {
    if (positionId) {
      return prisma.eventMember.delete({
        where: { eventId_memberId_positionId: { eventId, memberId, positionId } },
      });
    }
    return prisma.eventMember.deleteMany({
      where: { eventId, memberId },
    });
  },

  deleteById(id: string) {
    return prisma.eventMember.delete({ where: { id } });
  },
};

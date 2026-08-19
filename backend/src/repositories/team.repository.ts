import { prisma } from '../config/prisma';

export const teamRepository = {
  findMany() {
    return prisma.team.findMany({
      include: { leader: true, _count: { select: { members: true } } },
      orderBy: { name: 'asc' },
    });
  },

  findById(id: string) {
    return prisma.team.findUnique({
      where: { id },
      include: { leader: true, members: true },
    });
  },

  findByName(name: string) {
    return prisma.team.findUnique({ where: { name } });
  },

  create(data: { name: string; description?: string | null; leaderId?: string | null; isActive?: boolean }) {
    return prisma.team.create({ data, include: { leader: true } });
  },

  update(
    id: string,
    data: Partial<{ name: string; description: string | null; leaderId: string | null; isActive: boolean }>,
  ) {
    return prisma.team.update({ where: { id }, data, include: { leader: true } });
  },

  delete(id: string) {
    return prisma.team.delete({ where: { id } });
  },

  countMembers(id: string) {
    return prisma.member.count({ where: { teams: { some: { id } } } });
  },
};

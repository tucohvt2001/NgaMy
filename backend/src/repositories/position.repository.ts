import { prisma } from '../config/prisma';

export const positionRepository = {
  findMany() {
    return prisma.position.findMany({ orderBy: { name: 'asc' } });
  },

  findById(id: string) {
    return prisma.position.findUnique({ where: { id } });
  },

  findByName(name: string) {
    return prisma.position.findUnique({ where: { name } });
  },

  create(data: { name: string; description?: string | null; isActive?: boolean }) {
    return prisma.position.create({ data });
  },

  update(id: string, data: Partial<{ name: string; description: string | null; isActive: boolean }>) {
    return prisma.position.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.position.delete({ where: { id } });
  },

  countMembers(id: string) {
    return prisma.member.count({ where: { positions: { some: { id } } } });
  },
};

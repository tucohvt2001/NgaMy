import { prisma } from '../config/prisma';

export const eventTypeRepository = {
  findMany(filter?: { isActive?: boolean; search?: string }) {
    const where: any = {};
    if (filter?.isActive !== undefined) {
      where.isActive = filter.isActive;
    }
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    return prisma.eventType.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  },

  findById(id: string) {
    return prisma.eventType.findUnique({ where: { id } });
  },

  findByCode(code: string) {
    return prisma.eventType.findUnique({ where: { code } });
  },

  create(data: { code: string; name: string; description?: string | null; color?: string | null; isActive?: boolean }) {
    return prisma.eventType.create({ data });
  },

  update(
    id: string,
    data: Partial<{ code: string; name: string; description: string | null; color: string | null; isActive: boolean }>,
  ) {
    return prisma.eventType.update({ where: { id }, data });
  },

  delete(id: string) {
    return prisma.eventType.delete({ where: { id } });
  },
};

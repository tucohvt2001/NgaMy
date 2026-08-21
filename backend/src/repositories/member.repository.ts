import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

const memberInclude = {
  teams: {
    select: {
      id: true,
      name: true,
    },
  },
  positions: {
    select: {
      id: true,
      name: true,
    },
  },
  bank: {
    select: {
      id: true,
      code: true,
      shortName: true,
      name: true,
      bin: true,
      logo: true,
    },
  },
} as const;

export interface FindManyMembersParams {
  skip: number;
  take: number;
  search?: string;
  teamId?: string;
  status?: string;
}

function buildWhere(params: Omit<FindManyMembersParams, 'skip' | 'take'>): Prisma.MemberWhereInput {
  const where: Prisma.MemberWhereInput = {};

  if (params.teamId) {
    where.teams = { some: { id: params.teamId } };
  }

  if (params.status) {
    where.status = params.status;
  }

  if (params.search) {
    const q = params.search.trim();
    where.OR = [
      { fullName: { contains: q, mode: 'insensitive' } },
      { memberCode: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { bankAccount: { contains: q, mode: 'insensitive' } },
    ];
  }

  return where;
}

export const memberRepository = {
  findMany(params: FindManyMembersParams) {
    return prisma.member.findMany({
      where: buildWhere(params),
      skip: params.skip,
      take: params.take,
      include: memberInclude,
      orderBy: { memberCode: 'asc' },
    });
  },

  count(params: Omit<FindManyMembersParams, 'skip' | 'take'>) {
    return prisma.member.count({ where: buildWhere(params) });
  },

  async getStats() {
    const [total, active, onLeave, inactive, withBank] = await Promise.all([
      prisma.member.count(),
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.member.count({ where: { status: 'ON_LEAVE' } }),
      prisma.member.count({ where: { status: 'INACTIVE' } }),
      prisma.member.count({
        where: {
          AND: [
            { bankAccount: { not: null } },
            { bankAccount: { not: '' } },
          ],
        },
      }),
    ]);

    return {
      total,
      active,
      onLeave,
      inactive,
      withBank,
    };
  },

  findById(id: string) {
    return prisma.member.findUnique({ where: { id }, include: memberInclude });
  },

  findByCode(memberCode: string) {
    return prisma.member.findUnique({ where: { memberCode } });
  },

  create(data: Prisma.MemberCreateInput) {
    return prisma.member.create({ data, include: memberInclude });
  },

  update(id: string, data: Prisma.MemberUpdateInput) {
    return prisma.member.update({ where: { id }, data, include: memberInclude });
  },

  delete(id: string) {
    return prisma.member.delete({ where: { id } });
  },

  hasLinkedUser(id: string) {
    return prisma.user.findUnique({ where: { memberId: id } });
  },
};

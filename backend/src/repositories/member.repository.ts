import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';

const memberInclude = { teams: true, positions: true, bank: true } as const;

export interface FindManyMembersParams {
  skip: number;
  take: number;
  search?: string;
  teamId?: string;
  status?: string;
}

function buildWhere(params: Omit<FindManyMembersParams, 'skip' | 'take'>): Prisma.MemberWhereInput {
  return {
    ...(params.teamId ? { teams: { some: { id: params.teamId } } } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.search
      ? {
          OR: [
            { fullName: { contains: params.search } },
            { memberCode: { contains: params.search } },
            { phone: { contains: params.search } },
          ],
        }
      : {}),
  };
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

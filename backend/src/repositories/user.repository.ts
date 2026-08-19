import { prisma } from '../config/prisma';

// Include chuẩn để lấy đủ thông tin role + permission cho một user
const userWithRoleInclude = {
  role: {
    include: {
      rolePermissions: { include: { permission: true } },
    },
  },
} as const;

export type UserWithRole = Awaited<ReturnType<typeof userRepository.findByUsernameOrEmail>>;

export const userRepository = {
  findByUsernameOrEmail(identifier: string) {
    return prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
      include: userWithRoleInclude,
    });
  },

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: userWithRoleInclude,
    });
  },

  findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  },

  findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  findMany(params: { skip: number; take: number }) {
    return prisma.user.findMany({
      skip: params.skip,
      take: params.take,
      include: { role: true, member: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  count() {
    return prisma.user.count();
  },

  create(data: {
    username: string;
    email: string;
    passwordHash: string;
    roleId: string;
    memberId?: string | null;
  }) {
    return prisma.user.create({ data, include: { role: true, member: true } });
  },

  update(
    id: string,
    data: Partial<{
      username: string;
      email: string;
      passwordHash: string;
      roleId: string;
      memberId: string | null;
      isActive: boolean;
      refreshToken: string | null;
    }>,
  ) {
    return prisma.user.update({ where: { id }, data, include: { role: true, member: true } });
  },

  delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};

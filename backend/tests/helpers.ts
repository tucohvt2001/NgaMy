import bcrypt from 'bcrypt';
import { prisma } from '../src/config/prisma';
import { signAccessToken } from '../src/utils/jwt';
import { PERMISSIONS, ROLE_NAMES, ROLE_PERMISSIONS, RoleName } from '../src/types/enums';

// Đảm bảo đầy đủ Role/Permission tồn tại trong DB test (idempotent, dùng chung cho mọi test file)
export async function ensureRolesAndPermissions(): Promise<Record<RoleName, string>> {
  for (const code of Object.values(PERMISSIONS)) {
    await prisma.permission.upsert({ where: { code }, update: {}, create: { code } });
  }

  const roleIds = {} as Record<RoleName, string>;
  for (const roleName of ROLE_NAMES) {
    const role = await prisma.role.upsert({ where: { name: roleName }, update: {}, create: { name: roleName } });
    roleIds[roleName] = role.id;

    const permissions = await prisma.permission.findMany({ where: { code: { in: ROLE_PERMISSIONS[roleName] } } });
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
  return roleIds;
}

export async function createTestUser(params: {
  username: string;
  roleName: RoleName;
  memberId?: string | null;
  password?: string;
}) {
  const roleIds = await ensureRolesAndPermissions();
  const passwordHash = await bcrypt.hash(params.password ?? 'Password@123', 10);

  const user = await prisma.user.create({
    data: {
      username: params.username,
      email: `${params.username}@test.local`,
      passwordHash,
      roleId: roleIds[params.roleName],
      memberId: params.memberId ?? null,
    },
  });

  const permissions = ROLE_PERMISSIONS[params.roleName];
  const token = signAccessToken({
    sub: user.id,
    username: user.username,
    email: user.email,
    roleId: user.roleId,
    roleName: params.roleName,
    memberId: user.memberId,
    permissions,
  });

  return { user, token };
}

let memberCounter = 0;
export async function createTestMember(overrides: Partial<{ fullName: string; status: string }> = {}) {
  memberCounter += 1;
  return prisma.member.create({
    data: {
      memberCode: `TEST-${Date.now()}-${memberCounter}`,
      fullName: overrides.fullName ?? 'Thành viên test',
      status: overrides.status ?? 'ACTIVE',
    },
  });
}

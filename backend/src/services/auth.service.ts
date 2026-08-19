import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { comparePassword } from '../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { userRepository } from '../repositories/user.repository';

function extractPermissions(role: { rolePermissions: { permission: { code: string } }[] }): string[] {
  return role.rolePermissions.map((rp) => rp.permission.code);
}

export const authService = {
  async login(identifier: string, password: string) {
    const user = await userRepository.findByUsernameOrEmail(identifier);

    if (!user || !user.isActive) {
      throw AppError.unauthorized('Tài khoản hoặc mật khẩu không đúng');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Tài khoản hoặc mật khẩu không đúng');
    }

    const permissions = extractPermissions(user.role);

    const accessToken = signAccessToken({
      sub: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      memberId: user.memberId,
      permissions,
    });
    const refreshToken = signRefreshToken({ sub: user.id });

    await userRepository.update(user.id, { refreshToken });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roleId: user.roleId,
        roleName: user.role.name,
        memberId: user.memberId,
        isActive: user.isActive,
        permissions,
      },
    };
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw AppError.unauthorized('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive || user.refreshToken !== refreshToken) {
      throw AppError.unauthorized('Refresh token không hợp lệ');
    }

    const permissions = extractPermissions(user.role);
    const accessToken = signAccessToken({
      sub: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      memberId: user.memberId,
      permissions,
    });
    const newRefreshToken = signRefreshToken({ sub: user.id });
    await userRepository.update(user.id, { refreshToken: newRefreshToken });

    return { accessToken, refreshToken: newRefreshToken };
  },

  async logout(userId: string) {
    await userRepository.update(userId, { refreshToken: null });
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: { include: { rolePermissions: { include: { permission: true } } } },
        member: true,
      },
    });

    if (!user) {
      throw AppError.notFound('Không tìm thấy người dùng');
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      memberId: user.memberId,
      isActive: user.isActive,
      permissions: extractPermissions(user.role),
      member: user.member,
    };
  },
};

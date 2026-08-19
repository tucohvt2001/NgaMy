import { AppError } from '../utils/AppError';
import { hashPassword } from '../utils/password';
import { userRepository } from '../repositories/user.repository';
import { CreateAccountInput, UpdateAccountInput } from '../validators/account.validator';

function sanitize<T extends { passwordHash?: string; refreshToken?: string | null }>(user: T) {
  const { passwordHash, refreshToken, ...rest } = user;
  return rest;
}

export const accountService = {
  async list(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      userRepository.findMany({ skip, take: limit }),
      userRepository.count(),
    ]);
    return {
      items: items.map(sanitize),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async create(input: CreateAccountInput) {
    const [existingUsername, existingEmail] = await Promise.all([
      userRepository.findByUsername(input.username),
      userRepository.findByEmail(input.email),
    ]);

    if (existingUsername) {
      throw AppError.conflict('Tên đăng nhập đã tồn tại');
    }
    if (existingEmail) {
      throw AppError.conflict('Email đã tồn tại');
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      username: input.username,
      email: input.email,
      passwordHash,
      roleId: input.roleId,
      memberId: input.memberId ?? null,
    });

    return sanitize(user);
  },

  async update(id: string, input: UpdateAccountInput) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Không tìm thấy tài khoản');
    }

    const data: Record<string, unknown> = { ...input };
    delete data.password;

    if (input.password) {
      data.passwordHash = await hashPassword(input.password);
    }

    const user = await userRepository.update(id, data);
    return sanitize(user);
  },

  async remove(id: string) {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Không tìm thấy tài khoản');
    }
    await userRepository.update(id, { isActive: false });
  },
};

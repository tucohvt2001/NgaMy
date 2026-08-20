import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { memberRepository } from '../repositories/member.repository';
import { CreateMemberInput, ListMemberQuery, UpdateMemberInput } from '../validators/member.validator';

export const memberService = {
  async generateMemberCode(): Promise<string> {
    const latest = await prisma.member.findFirst({
      orderBy: { memberCode: 'desc' },
      select: { memberCode: true },
    });

    let maxNum = 0;
    if (latest?.memberCode) {
      const match = latest.memberCode.match(/(\d+)$/);
      if (match) {
        maxNum = parseInt(match[1], 10) || 0;
      }
    }

    const nextNum = maxNum + 1;
    return `M${String(nextNum).padStart(3, '0')}`;
  },

  async list(query: ListMemberQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const filters = { search: query.search, teamId: query.teamId, status: query.status };

    const [items, total] = await Promise.all([
      memberRepository.findMany({ skip, take: limit, ...filters }),
      memberRepository.count(filters),
    ]);

    return {
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async getById(id: string) {
    const member = await memberRepository.findById(id);
    if (!member) {
      throw AppError.notFound('Không tìm thấy thành viên');
    }
    return member;
  },

  async create(input: CreateMemberInput) {
    let memberCode = input.memberCode?.trim();
    if (!memberCode) {
      memberCode = await this.generateMemberCode();
    } else {
      const existing = await memberRepository.findByCode(memberCode);
      if (existing) {
        throw AppError.conflict('Mã thành viên đã tồn tại');
      }
    }

    const { teamIds, positionIds, ...rest } = input;
    return memberRepository.create({
      ...rest,
      memberCode,
      ...(teamIds?.length ? { teams: { connect: teamIds.map((id) => ({ id })) } } : {}),
      ...(positionIds?.length ? { positions: { connect: positionIds.map((id) => ({ id })) } } : {}),
    });
  },

  async update(id: string, input: UpdateMemberInput) {
    if (input.memberCode?.trim()) {
      const existing = await memberRepository.findByCode(input.memberCode.trim());
      if (existing && existing.id !== id) {
        throw AppError.conflict('Mã thành viên đã tồn tại');
      }
    }

    const { teamIds, positionIds, ...rest } = input;
    try {
      return await memberRepository.update(id, {
        ...rest,
        ...(teamIds !== undefined ? { teams: { set: teamIds.map((id) => ({ id })) } } : {}),
        ...(positionIds !== undefined ? { positions: { set: positionIds.map((id) => ({ id })) } } : {}),
      });
    } catch (err: any) {
      if (err?.code === 'P2025') {
        throw AppError.notFound('Không tìm thấy thành viên');
      }
      throw err;
    }
  },

  // Vô hiệu hóa thành viên (soft-delete) thay vì xóa cứng để bảo toàn dữ liệu lịch sử liên quan
  async remove(id: string) {
    await this.getById(id);
    await memberRepository.update(id, { status: 'INACTIVE' });
  },
};

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

  async getStats() {
    return memberRepository.getStats();
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
    const cleanData: any = { ...rest };

    if (cleanData.bankId !== undefined) {
      cleanData.bankId = cleanData.bankId?.trim() ? cleanData.bankId.trim() : null;
    }
    if (cleanData.bankCode !== undefined) {
      cleanData.bankCode = cleanData.bankCode?.trim() ? cleanData.bankCode.trim() : null;
    }
    if (cleanData.bankBin !== undefined) {
      cleanData.bankBin = cleanData.bankBin?.trim() ? cleanData.bankBin.trim() : null;
    }
    if (cleanData.bankName !== undefined) {
      cleanData.bankName = cleanData.bankName?.trim() ? cleanData.bankName.trim() : null;
    }
    if (cleanData.bankAccount !== undefined) {
      cleanData.bankAccount = cleanData.bankAccount?.trim() ? cleanData.bankAccount.trim() : null;
    }
    if (cleanData.phone !== undefined) {
      cleanData.phone = cleanData.phone?.trim() ? cleanData.phone.trim() : null;
    }
    if (cleanData.address !== undefined) {
      cleanData.address = cleanData.address?.trim() ? cleanData.address.trim() : null;
    }
    if (cleanData.note !== undefined) {
      cleanData.note = cleanData.note?.trim() ? cleanData.note.trim() : null;
    }

    return memberRepository.create({
      ...cleanData,
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
    const cleanData: any = { ...rest };

    if (cleanData.bankId !== undefined) {
      cleanData.bankId = cleanData.bankId?.trim() ? cleanData.bankId.trim() : null;
    }
    if (cleanData.bankCode !== undefined) {
      cleanData.bankCode = cleanData.bankCode?.trim() ? cleanData.bankCode.trim() : null;
    }
    if (cleanData.bankBin !== undefined) {
      cleanData.bankBin = cleanData.bankBin?.trim() ? cleanData.bankBin.trim() : null;
    }
    if (cleanData.bankName !== undefined) {
      cleanData.bankName = cleanData.bankName?.trim() ? cleanData.bankName.trim() : null;
    }
    if (cleanData.bankAccount !== undefined) {
      cleanData.bankAccount = cleanData.bankAccount?.trim() ? cleanData.bankAccount.trim() : null;
    }
    if (cleanData.phone !== undefined) {
      cleanData.phone = cleanData.phone?.trim() ? cleanData.phone.trim() : null;
    }
    if (cleanData.address !== undefined) {
      cleanData.address = cleanData.address?.trim() ? cleanData.address.trim() : null;
    }
    if (cleanData.note !== undefined) {
      cleanData.note = cleanData.note?.trim() ? cleanData.note.trim() : null;
    }

    try {
      return await memberRepository.update(id, {
        ...cleanData,
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

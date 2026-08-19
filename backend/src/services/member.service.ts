import { AppError } from '../utils/AppError';
import { memberRepository } from '../repositories/member.repository';
import { CreateMemberInput, ListMemberQuery, UpdateMemberInput } from '../validators/member.validator';

export const memberService = {
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
    const existing = await memberRepository.findByCode(input.memberCode);
    if (existing) {
      throw AppError.conflict('Mã thành viên đã tồn tại');
    }

    const { teamIds, positionIds, ...rest } = input;
    return memberRepository.create({
      ...rest,
      ...(teamIds?.length ? { teams: { connect: teamIds.map((id) => ({ id })) } } : {}),
      ...(positionIds?.length ? { positions: { connect: positionIds.map((id) => ({ id })) } } : {}),
    });
  },

  async update(id: string, input: UpdateMemberInput) {
    await this.getById(id);

    if (input.memberCode) {
      const existing = await memberRepository.findByCode(input.memberCode);
      if (existing && existing.id !== id) {
        throw AppError.conflict('Mã thành viên đã tồn tại');
      }
    }

    const { teamIds, positionIds, ...rest } = input;
    return memberRepository.update(id, {
      ...rest,
      // set thay thế toàn bộ danh sách đội/chức vụ hiện tại bằng danh sách mới được gửi lên
      ...(teamIds !== undefined ? { teams: { set: teamIds.map((id) => ({ id })) } } : {}),
      ...(positionIds !== undefined ? { positions: { set: positionIds.map((id) => ({ id })) } } : {}),
    });
  },

  // Vô hiệu hóa thành viên (soft-delete) thay vì xóa cứng để bảo toàn dữ liệu lịch sử liên quan
  async remove(id: string) {
    await this.getById(id);
    await memberRepository.update(id, { status: 'INACTIVE' });
  },
};

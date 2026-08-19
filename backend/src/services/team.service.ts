import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { teamRepository } from '../repositories/team.repository';
import { CreateTeamInput, UpdateTeamInput } from '../validators/team.validator';

export const teamService = {
  list() {
    return teamRepository.findMany();
  },

  async getById(id: string) {
    const team = await teamRepository.findById(id);
    if (!team) {
      throw AppError.notFound('Không tìm thấy đội/nhóm');
    }
    return team;
  },

  async getMembers(id: string) {
    await this.getById(id);
    return prisma.member.findMany({ where: { teams: { some: { id } } }, include: { positions: true } });
  },

  async create(input: CreateTeamInput) {
    const existing = await teamRepository.findByName(input.name);
    if (existing) {
      throw AppError.conflict('Tên đội/nhóm đã tồn tại');
    }
    return teamRepository.create(input);
  },

  async update(id: string, input: UpdateTeamInput) {
    await this.getById(id);
    if (input.name) {
      const existing = await teamRepository.findByName(input.name);
      if (existing && existing.id !== id) {
        throw AppError.conflict('Tên đội/nhóm đã tồn tại');
      }
    }
    return teamRepository.update(id, input);
  },

  async remove(id: string) {
    await this.getById(id);
    const memberCount = await teamRepository.countMembers(id);
    if (memberCount > 0) {
      throw AppError.conflict('Không thể xóa đội/nhóm còn thành viên');
    }
    await teamRepository.delete(id);
  },
};

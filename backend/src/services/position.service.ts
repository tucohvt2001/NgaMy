import { AppError } from '../utils/AppError';
import { positionRepository } from '../repositories/position.repository';
import { CreatePositionInput, UpdatePositionInput } from '../validators/position.validator';

export const positionService = {
  list() {
    return positionRepository.findMany();
  },

  async getById(id: string) {
    const position = await positionRepository.findById(id);
    if (!position) {
      throw AppError.notFound('Không tìm thấy chức vụ');
    }
    return position;
  },

  async create(input: CreatePositionInput) {
    const existing = await positionRepository.findByName(input.name);
    if (existing) {
      throw AppError.conflict('Chức vụ đã tồn tại');
    }
    return positionRepository.create(input);
  },

  async update(id: string, input: UpdatePositionInput) {
    await this.getById(id);
    if (input.name) {
      const existing = await positionRepository.findByName(input.name);
      if (existing && existing.id !== id) {
        throw AppError.conflict('Tên chức vụ đã tồn tại');
      }
    }
    return positionRepository.update(id, input);
  },

  async remove(id: string) {
    await this.getById(id);
    const memberCount = await positionRepository.countMembers(id);
    if (memberCount > 0) {
      throw AppError.conflict('Không thể xóa chức vụ đang được gán cho thành viên');
    }
    await positionRepository.delete(id);
  },
};

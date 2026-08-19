import { AppError } from '../utils/AppError';
import { leaveRepository } from '../repositories/leave.repository';
import { CreateLeaveInput, ListLeaveQuery } from '../validators/leave.validator';

export const leaveService = {
  async list(query: ListLeaveQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const filters = { memberId: query.memberId, status: query.status };

    const [items, total] = await Promise.all([
      leaveRepository.findMany({ skip, take: limit, ...filters }),
      leaveRepository.count(filters),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async create(memberId: string, input: CreateLeaveInput) {
    if (input.toDate < input.fromDate) {
      throw AppError.badRequest('Ngày kết thúc phải sau ngày bắt đầu');
    }

    const leave = await leaveRepository.create({ memberId, ...input });

    // Cảnh báo nếu thành viên đã được phân công sự kiện trong thời gian nghỉ
    const conflicts = await leaveRepository.findOverlappingAssignments(memberId, input.fromDate, input.toDate);
    const warnings =
      conflicts.length > 0 ? ['Thành viên đã được phân công sự kiện trong thời gian xin nghỉ'] : [];

    return { leave, warnings };
  },

  async approve(id: string, approvedBy: string) {
    const leave = await leaveRepository.findById(id);
    if (!leave) {
      throw AppError.notFound('Không tìm thấy đơn nghỉ');
    }
    if (leave.status !== 'PENDING') {
      throw AppError.conflict('Đơn nghỉ đã được xử lý');
    }
    return leaveRepository.update(id, { status: 'APPROVED', approvedBy, approvedAt: new Date() });
  },

  async reject(id: string, approvedBy: string) {
    const leave = await leaveRepository.findById(id);
    if (!leave) {
      throw AppError.notFound('Không tìm thấy đơn nghỉ');
    }
    if (leave.status !== 'PENDING') {
      throw AppError.conflict('Đơn nghỉ đã được xử lý');
    }
    return leaveRepository.update(id, { status: 'REJECTED', approvedBy, approvedAt: new Date() });
  },
};

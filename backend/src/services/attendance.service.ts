import { AppError } from '../utils/AppError';
import { attendanceRepository } from '../repositories/attendance.repository';
import { eventMemberRepository } from '../repositories/eventMember.repository';
import { ConfirmAttendanceInput, ListAttendanceQuery } from '../validators/attendance.validator';

export const attendanceService = {
  async checkIn(memberId: string, eventId: string) {
    const assignment = await eventMemberRepository.findOne(eventId, memberId);
    if (!assignment) {
      throw AppError.forbidden('Bạn chỉ có thể check-in cho sự kiện mà mình được phân công');
    }

    const existing = await attendanceRepository.findByEventAndMember(eventId, memberId);
    if (existing?.checkInTime) {
      throw AppError.conflict('Bạn đã check-in cho sự kiện này rồi');
    }

    if (existing) {
      return attendanceRepository.update(existing.id, { checkInTime: new Date(), status: 'PRESENT' });
    }

    return attendanceRepository.create({ eventId, memberId, checkInTime: new Date(), status: 'PRESENT' });
  },

  async checkOut(memberId: string, eventId: string) {
    const existing = await attendanceRepository.findByEventAndMember(eventId, memberId);
    if (!existing || !existing.checkInTime) {
      throw AppError.badRequest('Bạn cần check-in trước khi check-out');
    }
    if (existing.checkOutTime) {
      throw AppError.conflict('Bạn đã check-out cho sự kiện này rồi');
    }

    return attendanceRepository.update(existing.id, { checkOutTime: new Date() });
  },

  async list(query: ListAttendanceQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const filters = { eventId: query.eventId, memberId: query.memberId, status: query.status };

    const [items, total] = await Promise.all([
      attendanceRepository.findMany({ skip, take: limit, ...filters }),
      attendanceRepository.count(filters),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async confirm(id: string, confirmedBy: string, input: ConfirmAttendanceInput) {
    const existing = await attendanceRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Không tìm thấy bản ghi chấm công');
    }

    return attendanceRepository.update(id, {
      status: input.status,
      note: input.note ?? undefined,
      confirmedBy,
      confirmedAt: new Date(),
    });
  },
};

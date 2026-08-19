import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { eventMemberRepository } from '../repositories/eventMember.repository';
import { eventRepository } from '../repositories/event.repository';
import { CreateEventMemberInput, UpdateEventMemberInput } from '../validators/eventMember.validator';

// Tính các cảnh báo nghiệp vụ khi phân công thành viên vào sự kiện (không chặn thao tác, chỉ cảnh báo)
async function buildWarnings(memberId: string, positionId: string, eventId: string, eventDate: Date) {
  const warnings: string[] = [];

  const member = await prisma.member.findUnique({ where: { id: memberId }, include: { positions: true } });
  if (!member) {
    throw AppError.notFound('Không tìm thấy thành viên');
  }

  if (member.status === 'ON_LEAVE') {
    warnings.push('Thành viên đang trong trạng thái nghỉ');
  }
  if (member.status === 'INACTIVE') {
    warnings.push('Thành viên đang không hoạt động');
  }

  const startOfDay = new Date(eventDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(eventDate);
  endOfDay.setHours(23, 59, 59, 999);

  const overlappingLeave = await prisma.leaveRequest.findFirst({
    where: {
      memberId,
      status: 'APPROVED',
      fromDate: { lte: endOfDay },
      toDate: { gte: startOfDay },
    },
  });
  if (overlappingLeave) {
    warnings.push('Thành viên đã được duyệt nghỉ trong khoảng thời gian diễn ra sự kiện');
  }

  const conflictingAssignments = await eventRepository.findOverlapping(memberId, eventDate, eventId);
  if (conflictingAssignments.length > 0) {
    warnings.push('Thành viên đã có lịch diễn khác trùng ngày');
  }

  if (member.positions.length > 0 && !member.positions.some((position) => position.id === positionId)) {
    warnings.push('Vị trí phân công không nằm trong các chức vụ chuyên môn của thành viên');
  }

  return warnings;
}

export const eventMemberService = {
  async list(eventId: string) {
    return eventMemberRepository.findByEvent(eventId);
  },

  async assign(eventId: string, input: CreateEventMemberInput) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện');
    }

    const duplicate = await eventMemberRepository.findOne(eventId, input.memberId);
    if (duplicate) {
      throw AppError.conflict('Thành viên đã được phân công trong sự kiện này');
    }

    const warnings = await buildWarnings(input.memberId, input.positionId, eventId, event.eventDate);

    const eventMember = await eventMemberRepository.create({
      eventId,
      memberId: input.memberId,
      positionId: input.positionId,
      status: input.status,
      note: input.note,
    });

    return { eventMember, warnings };
  },

  async update(eventId: string, memberId: string, input: UpdateEventMemberInput) {
    const existing = await eventMemberRepository.findOne(eventId, memberId);
    if (!existing) {
      throw AppError.notFound('Không tìm thấy phân công');
    }
    return eventMemberRepository.update(eventId, memberId, input);
  },

  async remove(eventId: string, memberId: string) {
    const existing = await eventMemberRepository.findOne(eventId, memberId);
    if (!existing) {
      throw AppError.notFound('Không tìm thấy phân công');
    }
    await eventMemberRepository.delete(eventId, memberId);
  },
};

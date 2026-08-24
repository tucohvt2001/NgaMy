import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { eventMemberRepository } from '../repositories/eventMember.repository';
import { eventRepository } from '../repositories/event.repository';
import { CreateEventMemberInput, UpdateEventMemberInput, BatchAssignMemberInput } from '../validators/eventMember.validator';

export const eventMemberService = {
  async list(eventId: string) {
    return eventMemberRepository.findByEvent(eventId);
  },

  async assign(eventId: string, input: CreateEventMemberInput) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện');
    }

    const duplicate = await eventMemberRepository.findOne(eventId, input.memberId, input.positionId);
    if (duplicate) {
      throw AppError.conflict('Thành viên đã được phân công vai trò này trong sự kiện');
    }

    const eventMember = await eventMemberRepository.create({
      eventId,
      memberId: input.memberId,
      positionId: input.positionId,
      status: input.status,
      note: input.note,
    });

    return { eventMember, warnings: [] };
  },

  // Phân công hàng loạt (hỗ trợ 1 thành viên có thể nhận nhiều vai trò khác nhau trong cùng 1 show)
  async batchAssign(eventId: string, input: BatchAssignMemberInput) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện');
    }

    // Thực thi toàn bộ phân công trong 1 transaction duy nhất
    const items = await prisma.$transaction(
      input.assignments.map((item) =>
        prisma.eventMember.upsert({
          where: {
            eventId_memberId_positionId: {
              eventId,
              memberId: item.memberId,
              positionId: item.positionId,
            },
          },
          create: {
            eventId,
            memberId: item.memberId,
            positionId: item.positionId,
            status: item.status ?? 'ASSIGNED',
            note: item.note,
          },
          update: {
            status: item.status ?? 'ASSIGNED',
            note: item.note,
          },
          include: { member: true, position: true },
        }),
      ),
    );

    return {
      count: items.length,
      items,
      warnings: [],
    };
  },

  async update(eventId: string, memberId: string, input: UpdateEventMemberInput, positionId?: string) {
    const existing = await eventMemberRepository.findOne(eventId, memberId, positionId);
    if (!existing) {
      throw AppError.notFound('Không tìm thấy phân công');
    }
    return eventMemberRepository.update(eventId, memberId, existing.positionId, input);
  },

  async remove(eventId: string, memberId: string, positionId?: string) {
    return eventMemberRepository.delete(eventId, memberId, positionId);
  },

  async removeById(id: string) {
    return eventMemberRepository.deleteById(id);
  },
};

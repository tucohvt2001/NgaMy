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

  // Phân công hàng loạt (tối ưu hóa tốc độ, hỗ trợ 1 thành viên nhận nhiều vai trò, hỗ trợ thay thế đội hình)
  async batchAssign(eventId: string, input: BatchAssignMemberInput) {
    const event = await eventRepository.findById(eventId);
    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện');
    }

    if (!input.assignments || input.assignments.length === 0) {
      return {
        count: 0,
        items: [],
        warnings: [],
      };
    }

    // Nếu chọn chế độ thay thế toàn bộ đội hình cũ
    if (input.replaceExisting) {
      await prisma.eventMember.deleteMany({ where: { eventId } });

      const createData = input.assignments.map((item) => ({
        eventId,
        memberId: item.memberId,
        positionId: item.positionId,
        status: item.status ?? 'ASSIGNED',
        note: item.note ?? null,
      }));

      const created = await prisma.eventMember.createMany({
        data: createData,
        skipDuplicates: true,
      });

      return {
        count: created.count,
        items: [],
        warnings: [],
      };
    }

    // Tối ưu gộp: Lấy toàn bộ phân công hiện có trong 1 query duy nhất
    const memberIds = Array.from(new Set(input.assignments.map((a) => a.memberId)));
    const existingAssignments = await prisma.eventMember.findMany({
      where: {
        eventId,
        memberId: { in: memberIds },
      },
      select: {
        id: true,
        memberId: true,
        positionId: true,
      },
    });

    const existingMap = new Map(
      existingAssignments.map((a) => [`${a.memberId}_${a.positionId}`, a.id]),
    );

    const toCreate: Array<{
      eventId: string;
      memberId: string;
      positionId: string;
      status: string;
      note: string | null;
    }> = [];

    const updateOps: any[] = [];

    for (const item of input.assignments) {
      const key = `${item.memberId}_${item.positionId}`;
      const existingId = existingMap.get(key);

      if (existingId) {
        updateOps.push(
          prisma.eventMember.update({
            where: { id: existingId },
            data: {
              status: item.status ?? 'ASSIGNED',
              note: item.note ?? null,
            },
            select: { id: true },
          }),
        );
      } else {
        toCreate.push({
          eventId,
          memberId: item.memberId,
          positionId: item.positionId,
          status: item.status ?? 'ASSIGNED',
          note: item.note ?? null,
        });
      }
    }

    const txOps: any[] = [];
    if (toCreate.length > 0) {
      txOps.push(prisma.eventMember.createMany({ data: toCreate, skipDuplicates: true }));
    }
    if (updateOps.length > 0) {
      txOps.push(...updateOps);
    }

    if (txOps.length > 0) {
      await prisma.$transaction(txOps);
    }

    return {
      count: input.assignments.length,
      items: [],
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

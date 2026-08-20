import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { attendanceRepository } from '../repositories/attendance.repository';
import { eventMemberRepository } from '../repositories/eventMember.repository';
import {
  AdminBatchAttendanceInput,
  AdminRecordAttendanceInput,
  ConfirmAttendanceInput,
  ListAttendanceQuery,
} from '../validators/attendance.validator';

export const attendanceService = {
  async getEventAttendanceSheet(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: { select: { id: true, username: true } },
      },
    });

    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện');
    }

    const assignedMembers = await prisma.eventMember.findMany({
      where: { eventId },
      include: {
        member: true,
        position: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const attendances = await attendanceRepository.findByEvent(eventId);
    const attendanceMap = new Map(attendances.map((att) => [att.memberId, att]));

    const assignedMemberIdSet = new Set<string>();

    const mergedList: Array<{
      member: (typeof assignedMembers)[number]['member'];
      position: (typeof assignedMembers)[number]['position'] | null;
      attendance: (typeof attendances)[number] | null;
      isAssigned: boolean;
    }> = assignedMembers.map((em) => {
      assignedMemberIdSet.add(em.memberId);
      const att = attendanceMap.get(em.memberId) || null;
      return {
        member: em.member,
        position: em.position,
        attendance: att,
        isAssigned: true,
      };
    });

    // Bổ sung các thành viên vãng lai / ngoài danh sách phân công nhưng có bản ghi điểm danh
    for (const att of attendances) {
      if (!assignedMemberIdSet.has(att.memberId)) {
        mergedList.push({
          member: att.member,
          position: null,
          attendance: att,
          isAssigned: false,
        });
      }
    }

    const totalAssigned = assignedMembers.length;
    const totalRecords = attendances.length;
    const present = attendances.filter((a) => a.status === 'PRESENT').length;
    const late = attendances.filter((a) => a.status === 'LATE').length;
    const absentWithPermission = attendances.filter((a) => a.status === 'ABSENT_WITH_PERMISSION').length;
    const absentWithoutPermission = attendances.filter((a) => a.status === 'ABSENT_WITHOUT_PERMISSION').length;
    const replaced = attendances.filter((a) => a.status === 'REPLACED').length;
    const unmarked = Math.max(0, totalAssigned - totalRecords);

    return {
      event,
      members: mergedList,
      stats: {
        totalAssigned,
        totalRecords,
        present,
        late,
        absentWithPermission,
        absentWithoutPermission,
        replaced,
        unmarked,
      },
    };
  },

  async recordByAdmin(userId: string, input: AdminRecordAttendanceInput) {
    const event = await prisma.event.findUnique({ where: { id: input.eventId } });
    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện');
    }

    const member = await prisma.member.findUnique({ where: { id: input.memberId } });
    if (!member) {
      throw AppError.notFound('Không tìm thấy thành viên');
    }

    return attendanceRepository.upsert({
      eventId: input.eventId,
      memberId: input.memberId,
      status: input.status,
      checkInTime: input.checkInTime ? new Date(input.checkInTime) : null,
      checkOutTime: input.checkOutTime ? new Date(input.checkOutTime) : null,
      note: input.note,
      confirmedBy: userId,
      confirmedAt: new Date(),
    });
  },

  async batchRecordByAdmin(userId: string, input: AdminBatchAttendanceInput) {
    const event = await prisma.event.findUnique({ where: { id: input.eventId } });
    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện');
    }

    const now = new Date();

    const results = await prisma.$transaction(
      input.items.map((item) =>
        prisma.attendance.upsert({
          where: {
            eventId_memberId: {
              eventId: input.eventId,
              memberId: item.memberId,
            },
          },
          create: {
            eventId: input.eventId,
            memberId: item.memberId,
            status: item.status,
            checkInTime: item.checkInTime ? new Date(item.checkInTime) : null,
            checkOutTime: item.checkOutTime ? new Date(item.checkOutTime) : null,
            note: item.note,
            confirmedBy: userId,
            confirmedAt: now,
          },
          update: {
            status: item.status,
            checkInTime: item.checkInTime ? new Date(item.checkInTime) : null,
            checkOutTime: item.checkOutTime ? new Date(item.checkOutTime) : null,
            note: item.note,
            confirmedBy: userId,
            confirmedAt: now,
          },
          include: {
            event: true,
            member: true,
            confirmedByUser: { select: { id: true, username: true } },
          },
        }),
      ),
    );

    return results;
  },

  async delete(id: string) {
    const existing = await attendanceRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Không tìm thấy bản ghi chấm công');
    }

    return attendanceRepository.delete(id);
  },

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

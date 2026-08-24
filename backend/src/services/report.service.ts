import { prisma } from '../config/prisma';

export const reportService = {
  async memberReport() {
    const [total, active, onLeave, inactive, byTeam] = await Promise.all([
      prisma.member.count(),
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.member.count({ where: { status: 'ON_LEAVE' } }),
      prisma.member.count({ where: { status: 'INACTIVE' } }),
      prisma.team.findMany({ include: { _count: { select: { members: true } } } }),
    ]);

    return {
      total,
      active,
      onLeave,
      inactive,
      byTeam: byTeam.map((team) => ({ teamId: team.id, teamName: team.name, memberCount: team._count.members })),
    };
  },

  async eventReport() {
    const [total, completed, cancelled, byStatus] = await Promise.all([
      prisma.event.count(),
      prisma.event.count({ where: { status: 'COMPLETED' } }),
      prisma.event.count({ where: { status: 'CANCELLED' } }),
      prisma.event.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    return {
      total,
      completed,
      cancelled,
      byStatus: byStatus.map((item) => ({ status: item.status, count: item._count._all })),
    };
  },

  async attendanceReport() {
    const [totalSessions, present, absentWithPermission, absentWithoutPermission] = await Promise.all([
      prisma.attendance.count(),
      prisma.attendance.count({ where: { status: { in: ['PRESENT', 'LATE'] } } }),
      prisma.attendance.count({ where: { status: 'ABSENT_WITH_PERMISSION' } }),
      prisma.attendance.count({ where: { status: 'ABSENT_WITHOUT_PERMISSION' } }),
    ]);

    const attendanceRate = totalSessions > 0 ? Math.round((present / totalSessions) * 1000) / 10 : 0;

    return { totalSessions, present, absentWithPermission, absentWithoutPermission, attendanceRate };
  },

  async salaryReport(month?: number, year?: number) {
    const where = {
      ...(month ? { month } : {}),
      ...(year ? { year } : {}),
    };

    const records = await prisma.salaryRecord.findMany({
      where,
      include: { member: true, details: { include: { event: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    const byMember = records.map((record) => ({
      memberId: record.memberId,
      memberName: record.member.fullName,
      month: record.month,
      year: record.year,
      totalAmount: record.totalAmount,
      status: record.status,
    }));

    const totalByMonth = new Map<string, number>();
    const totalByEvent = new Map<string, number>();

    records.forEach((record) => {
      const key = `${record.year}-${record.month}`;
      totalByMonth.set(key, (totalByMonth.get(key) ?? 0) + record.totalAmount);
      record.details.forEach((detail) => {
        if (detail.event) {
          totalByEvent.set(
            detail.event.name,
            (totalByEvent.get(detail.event.name) ?? 0) + detail.amount,
          );
        }
      });
    });

    return {
      byMember,
      totalByMonth: Array.from(totalByMonth.entries()).map(([key, total]) => ({ month: key, total })),
      totalByEvent: Array.from(totalByEvent.entries()).map(([eventName, total]) => ({ eventName, total })),
      grandTotal: records.reduce((sum, r) => sum + r.totalAmount, 0),
    };
  },

  async monthlyAttendanceMatrix(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const [events, members, attendances, eventMembers] = await Promise.all([
      prisma.event.findMany({
        where: { eventDate: { gte: startDate, lte: endDate } },
        orderBy: { eventDate: 'asc' },
        select: {
          id: true,
          eventCode: true,
          name: true,
          eventDate: true,
          location: true,
          status: true,
        },
      }),
      prisma.member.findMany({
        where: { status: { not: 'INACTIVE' } },
        orderBy: { memberCode: 'asc' },
        select: {
          id: true,
          memberCode: true,
          fullName: true,
          phone: true,
          status: true,
          teams: { select: { id: true, name: true } },
          positions: { select: { id: true, name: true } },
        },
      }),
      prisma.attendance.findMany({
        where: {
          event: { eventDate: { gte: startDate, lte: endDate } },
        },
        select: {
          eventId: true,
          memberId: true,
          status: true,
        },
      }),
      prisma.eventMember.findMany({
        where: {
          event: { eventDate: { gte: startDate, lte: endDate } },
        },
        select: {
          eventId: true,
          memberId: true,
          position: { select: { name: true } },
          status: true,
        },
      }),
    ]);

    // Map attendances: key = `${eventId}_${memberId}`
    const attendanceMap = new Map<string, string>();
    for (const att of attendances) {
      attendanceMap.set(`${att.eventId}_${att.memberId}`, att.status);
    }

    // Map eventMembers: key = `${eventId}_${memberId}`
    const assignmentMap = new Map<string, { positionName: string | null; status: string }>();
    for (const em of eventMembers) {
      assignmentMap.set(`${em.eventId}_${em.memberId}`, {
        positionName: em.position?.name || null,
        status: em.status,
      });
    }

    // Build matrix rows
    const memberRows = members.map((member) => {
      const showAttendances: Record<
        string,
        {
          isAttended: boolean;
          attendanceStatus: string | null;
          isAssigned: boolean;
          positionName: string | null;
        }
      > = {};

      let attendedCount = 0;

      for (const event of events) {
        const attStatus = attendanceMap.get(`${event.id}_${member.id}`) || null;
        const assignment = assignmentMap.get(`${event.id}_${member.id}`) || null;
        const isAttended = attStatus === 'PRESENT' || attStatus === 'LATE';

        if (isAttended) {
          attendedCount++;
        }

        showAttendances[event.id] = {
          isAttended,
          attendanceStatus: attStatus,
          isAssigned: !!assignment,
          positionName: assignment?.positionName || null,
        };
      }

      return {
        memberId: member.id,
        memberCode: member.memberCode,
        fullName: member.fullName,
        phone: member.phone,
        status: member.status,
        teamNames: member.teams.map((t) => t.name).join(', ') || '-',
        positionNames: member.positions.map((p) => p.name).join(', ') || '-',
        totalAttended: attendedCount,
        shows: showAttendances,
      };
    });

    // Calculate event summary (number of attendees per show)
    const eventSummaries = events.map((event) => {
      let attendeeCount = 0;
      for (const member of members) {
        const attStatus = attendanceMap.get(`${event.id}_${member.id}`);
        if (attStatus === 'PRESENT' || attStatus === 'LATE') {
          attendeeCount++;
        }
      }
      return {
        eventId: event.id,
        eventCode: event.eventCode,
        name: event.name,
        eventDate: event.eventDate,
        location: event.location,
        status: event.status,
        attendeeCount,
      };
    });

    return {
      month,
      year,
      events: eventSummaries,
      members: memberRows,
      totalEvents: events.length,
      totalMembers: members.length,
    };
  },
};

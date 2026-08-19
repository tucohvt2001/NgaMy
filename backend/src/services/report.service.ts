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
};

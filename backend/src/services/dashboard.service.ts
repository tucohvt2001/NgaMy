import { prisma } from '../config/prisma';

export const dashboardService = {
  async getSummary() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      totalMembers,
      activeMembers,
      totalTeams,
      eventsThisMonth,
      participantsThisMonth,
      salaryThisMonth,
    ] = await Promise.all([
      prisma.member.count(),
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.team.count({ where: { isActive: true } }),
      prisma.event.count({ where: { eventDate: { gte: startOfMonth, lte: endOfMonth } } }),
      prisma.eventMember.count({ where: { event: { eventDate: { gte: startOfMonth, lte: endOfMonth } } } }),
      prisma.salaryRecord.aggregate({
        where: { month: now.getMonth() + 1, year: now.getFullYear() },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalMembers,
      activeMembers,
      totalTeams,
      eventsThisMonth,
      participantsThisMonth,
      totalSalaryThisMonth: salaryThisMonth._sum.totalAmount ?? 0,
    };
  },

  async getEventsByMonth(year: number) {
    const events = await prisma.event.findMany({
      where: { eventDate: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31, 23, 59, 59, 999) } },
      select: { eventDate: true },
    });

    const counts = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0 }));
    events.forEach((event) => {
      const monthIndex = event.eventDate.getMonth();
      counts[monthIndex].count += 1;
    });
    return counts;
  },

  async getSalaryByMonth(year: number) {
    const records = await prisma.salaryRecord.groupBy({
      by: ['month'],
      where: { year },
      _sum: { totalAmount: true },
    });

    const totals = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0 }));
    records.forEach((record) => {
      totals[record.month - 1].total = record._sum.totalAmount ?? 0;
    });
    return totals;
  },

  async getAttendanceRate() {
    const [total, present] = await Promise.all([
      prisma.attendance.count(),
      prisma.attendance.count({ where: { status: { in: ['PRESENT', 'LATE'] } } }),
    ]);
    return { total, present, rate: total > 0 ? Math.round((present / total) * 1000) / 10 : 0 };
  },

  async getActiveMembersTrend() {
    const [active, inactive, onLeave] = await Promise.all([
      prisma.member.count({ where: { status: 'ACTIVE' } }),
      prisma.member.count({ where: { status: 'INACTIVE' } }),
      prisma.member.count({ where: { status: 'ON_LEAVE' } }),
    ]);
    return { active, inactive, onLeave };
  },
};

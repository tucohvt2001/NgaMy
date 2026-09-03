import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { eventRepository } from '../repositories/event.repository';
import { CreateEventInput, ListEventQuery, UpdateEventInput } from '../validators/event.validator';

export const eventService = {
  async generateEventCode(targetDate?: Date): Promise<string> {
    const d = targetDate ? new Date(targetDate) : new Date();
    const validDate = isNaN(d.getTime()) ? new Date() : d;
    const year = validDate.getFullYear();
    const month = String(validDate.getMonth() + 1).padStart(2, '0');
    const prefix = `SK-${year}${month}-`;

    const latest = await prisma.event.findFirst({
      where: {
        eventCode: {
          startsWith: prefix,
        },
      },
      orderBy: {
        eventCode: 'desc',
      },
      select: {
        eventCode: true,
      },
    });

    let maxNum = 0;
    if (latest?.eventCode) {
      const match = latest.eventCode.match(/(\d+)$/);
      if (match) {
        maxNum = parseInt(match[1], 10) || 0;
      }
    }

    const nextNumber = maxNum + 1;
    return `${prefix}${String(nextNumber).padStart(4, '0')}`;
  },

  async list(query: ListEventQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const filters = {
      status: query.status,
      search: query.search,
      fromDate: query.fromDate,
      toDate: query.toDate,
    };

    const [items, total] = await Promise.all([
      eventRepository.findMany({ skip, take: limit, ...filters }),
      eventRepository.count(filters),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getById(id: string) {
    const event = await eventRepository.findById(id);
    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện');
    }
    return event;
  },

  async create(input: CreateEventInput, createdBy: string) {
    let eventCode = input.eventCode?.trim();
    if (!eventCode) {
      eventCode = await this.generateEventCode(input.eventDate ? new Date(input.eventDate) : undefined);
    } else {
      const existing = await eventRepository.findByCode(eventCode);
      if (existing) {
        throw AppError.conflict('Mã sự kiện đã tồn tại');
      }
    }

    const { eventCode: _, ...rest } = input;
    return eventRepository.create({
      ...rest,
      eventCode,
      eventDate: new Date(input.eventDate),
      creator: { connect: { id: createdBy } },
    });
  },

  async update(id: string, input: UpdateEventInput) {
    await this.getById(id);
    if (input.eventCode?.trim()) {
      const existing = await eventRepository.findByCode(input.eventCode.trim());
      if (existing && existing.id !== id) {
        throw AppError.conflict('Mã sự kiện đã tồn tại');
      }
    }

    const dataToUpdate: any = { ...input };
    if (input.eventDate) {
      dataToUpdate.eventDate = new Date(input.eventDate);
    }
    if (!dataToUpdate.eventCode) {
      delete dataToUpdate.eventCode;
    }
    return eventRepository.update(id, dataToUpdate);
  },

  // Hủy sự kiện thay vì xóa cứng để giữ lại lịch sử phân công/chấm công/tiền công
  async cancel(id: string) {
    await this.getById(id);
    return eventRepository.update(id, { status: 'CANCELLED' });
  },

  async getStats(targetYear?: number) {
    const year = targetYear || new Date().getFullYear();
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    const events = await prisma.event.findMany({
      where: {
        eventDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        _count: {
          select: {
            eventMembers: true,
            transactions: true,
            salaryConfigs: true,
          },
        },
      },
      orderBy: { eventDate: 'asc' },
    });

    let totalContractValue = 0;
    let completedEvents = 0;
    let upcomingEvents = 0;
    let cancelledEvents = 0;
    let settledEvents = 0;
    let unsettledEvents = 0;

    const monthlyMap = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthLabel: `T${i + 1}`,
      eventsCount: 0,
      completedCount: 0,
      contractValue: 0,
      participantsCount: 0,
    }));

    const statusCounts: Record<string, number> = {
      COMPLETED: 0,
      CONFIRMED: 0,
      IN_PROGRESS: 0,
      DRAFT: 0,
      CANCELLED: 0,
    };

    events.forEach((ev) => {
      const monthIdx = new Date(ev.eventDate).getMonth();
      const val = ev.contractValue || 0;
      totalContractValue += val;

      const isSettled = ev.status === 'COMPLETED' || ev._count.transactions > 0;
      if (isSettled) settledEvents++;
      else unsettledEvents++;

      if (ev.status === 'COMPLETED') completedEvents++;
      else if (ev.status === 'CANCELLED') cancelledEvents++;
      else upcomingEvents++;

      statusCounts[ev.status] = (statusCounts[ev.status] || 0) + 1;

      if (monthlyMap[monthIdx]) {
        monthlyMap[monthIdx].eventsCount += 1;
        if (ev.status === 'COMPLETED') monthlyMap[monthIdx].completedCount += 1;
        monthlyMap[monthIdx].contractValue += val;
        monthlyMap[monthIdx].participantsCount += ev._count.eventMembers;
      }
    });

    return {
      year,
      totalEvents: events.length,
      completedEvents,
      upcomingEvents,
      cancelledEvents,
      settledEvents,
      unsettledEvents,
      totalContractValue,
      monthlyStats: monthlyMap,
      statusDistribution: [
        { name: 'Đã hoàn thành', status: 'COMPLETED', value: statusCounts.COMPLETED || 0, color: '#10b981' },
        { name: 'Đã xác nhận', status: 'CONFIRMED', value: statusCounts.CONFIRMED || 0, color: '#f59e0b' },
        { name: 'Đang diễn ra', status: 'IN_PROGRESS', value: statusCounts.IN_PROGRESS || 0, color: '#3b82f6' },
        { name: 'Dự thảo / Nháp', status: 'DRAFT', value: statusCounts.DRAFT || 0, color: '#8b5cf6' },
        { name: 'Đã hủy', status: 'CANCELLED', value: statusCounts.CANCELLED || 0, color: '#ef4444' },
      ].filter((s) => s.value > 0),
      settlementDistribution: [
        { name: 'Đã dự toán thu chi', value: settledEvents, color: '#10b981' },
        { name: 'Chưa dự toán', value: unsettledEvents, color: '#f59e0b' },
      ],
    };
  },
};

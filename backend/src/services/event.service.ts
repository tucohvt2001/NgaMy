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
};

import { AppError } from '../utils/AppError';
import { eventRepository } from '../repositories/event.repository';
import { CreateEventInput, ListEventQuery, UpdateEventInput } from '../validators/event.validator';

export const eventService = {
  async list(query: ListEventQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const filters = { status: query.status, search: query.search };

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
    const existing = await eventRepository.findByCode(input.eventCode);
    if (existing) {
      throw AppError.conflict('Mã sự kiện đã tồn tại');
    }
    return eventRepository.create({
      ...input,
      creator: { connect: { id: createdBy } },
    });
  },

  async update(id: string, input: UpdateEventInput) {
    await this.getById(id);
    if (input.eventCode) {
      const existing = await eventRepository.findByCode(input.eventCode);
      if (existing && existing.id !== id) {
        throw AppError.conflict('Mã sự kiện đã tồn tại');
      }
    }
    return eventRepository.update(id, input);
  },

  // Hủy sự kiện thay vì xóa cứng để giữ lại lịch sử phân công/chấm công/tiền công
  async cancel(id: string) {
    await this.getById(id);
    return eventRepository.update(id, { status: 'CANCELLED' });
  },
};

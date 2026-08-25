import { eventTypeRepository } from '../repositories/eventType.repository';
import { CreateEventTypeInput, UpdateEventTypeInput } from '../validators/eventType.validator';
import { AppError } from '../utils/AppError';

const DEFAULT_EVENT_TYPES = [
  { code: 'KHAI_TRUONG', name: 'Khai trương / Khánh thành', color: '#eab308', description: 'Show biểu diễn mừng khai trương cửa hàng, khánh thành công trình' },
  { code: 'TRUNG_THU', name: 'Trung thu', color: '#f97316', description: 'Show biểu diễn rước đèn phá cỗ tết Trung thu' },
  { code: 'TET', name: 'Tết / Tân niên', color: '#ef4444', description: 'Show biểu diễn chào xuân năm mới, khai xuân đầu năm' },
  { code: 'DAM_CUOI', name: 'Đám cưới / Hỷ sự', color: '#ec4899', description: 'Show biểu diễn chúc phúc đám cưới, hỷ sự gia đình' },
  { code: 'LE_HOI', name: 'Lễ hội / Sự kiện lớn', color: '#8b5cf6', description: 'Show biểu diễn các lễ hội truyền thống, festival, sự kiện doanh nghiệp' },
  { code: 'BIEU_DIEN', name: 'Biểu diễn thường', color: '#06b6d4', description: 'Show biểu diễn lưu diễn, giao lưu thể thao văn hóa nghệ thuật' },
  { code: 'OTHER', name: 'Khác', color: '#64748b', description: 'Các show và hoạt động biểu diễn đặc thù khác' },
];

export const eventTypeService = {
  async list(filter?: { isActive?: boolean; search?: string }) {
    const list = await eventTypeRepository.findMany(filter);
    // Nếu chưa có loại show nào trong DB, tự động seed danh sách mặc định
    if (list.length === 0 && !filter?.search) {
      for (const item of DEFAULT_EVENT_TYPES) {
        await eventTypeRepository.create(item);
      }
      return eventTypeRepository.findMany(filter);
    }
    return list;
  },

  async getById(id: string) {
    const item = await eventTypeRepository.findById(id);
    if (!item) {
      throw AppError.notFound('Không tìm thấy loại show diễn');
    }
    return item;
  },

  async create(input: CreateEventTypeInput) {
    const existing = await eventTypeRepository.findByCode(input.code.trim().toUpperCase());
    if (existing) {
      throw AppError.badRequest('Mã loại show đã tồn tại trong hệ thống');
    }
    return eventTypeRepository.create({
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      description: input.description?.trim() || null,
      color: input.color?.trim() || '#f59e0b',
      isActive: input.isActive ?? true,
    });
  },

  async update(id: string, input: UpdateEventTypeInput) {
    const existing = await eventTypeRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Không tìm thấy loại show diễn');
    }

    if (input.code && input.code.trim().toUpperCase() !== existing.code) {
      const duplicate = await eventTypeRepository.findByCode(input.code.trim().toUpperCase());
      if (duplicate) {
        throw AppError.badRequest('Mã loại show đã tồn tại trong hệ thống');
      }
    }

    return eventTypeRepository.update(id, {
      code: input.code ? input.code.trim().toUpperCase() : undefined,
      name: input.name ? input.name.trim() : undefined,
      description: input.description !== undefined ? input.description?.trim() || null : undefined,
      color: input.color !== undefined ? input.color?.trim() || '#f59e0b' : undefined,
      isActive: input.isActive !== undefined ? input.isActive : undefined,
    });
  },

  async remove(id: string) {
    const existing = await eventTypeRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Không tìm thấy loại show diễn');
    }
    await eventTypeRepository.delete(id);
  },
};

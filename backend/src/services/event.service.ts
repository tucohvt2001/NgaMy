import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { eventRepository } from '../repositories/event.repository';
import { CreateEventInput, ListEventQuery, UpdateEventInput, PublicBookingInput } from '../validators/event.validator';

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
      startTime: input.startTime ? new Date(input.startTime) : (input.eventDate ? new Date(input.eventDate) : undefined),
      endTime: input.endTime ? new Date(input.endTime) : undefined,
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
      if (!input.startTime) {
        dataToUpdate.startTime = new Date(input.eventDate);
      }
    }
    if (input.startTime !== undefined) {
      dataToUpdate.startTime = input.startTime ? new Date(input.startTime) : null;
    }
    if (input.endTime !== undefined) {
      dataToUpdate.endTime = input.endTime ? new Date(input.endTime) : null;
    }
    if (!dataToUpdate.eventCode) {
      delete dataToUpdate.eventCode;
    }
    return eventRepository.update(id, dataToUpdate);
  },

  // Hủy sự kiện: Chỉ cho phép thao tác với show CHƯA có phân công và CHƯA có dự toán/phiếu thu chi
  async cancel(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            eventMembers: true,
            salaryConfigs: true,
            salaryDetails: true,
            transactions: true,
          },
        },
      },
    });

    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện');
    }

    if (event.status === 'CANCELLED') {
      throw AppError.badRequest('Sự kiện này đã ở trạng thái Đã hủy');
    }

    // 1. Kiểm tra phân công nhân sự
    if (event._count.eventMembers > 0) {
      throw AppError.badRequest(
        `Không thể hủy sự kiện đã phân công nhân sự (${event._count.eventMembers} thành viên). Vui lòng hủy/xóa phân công trước khi hủy show.`
      );
    }

    // 2. Kiểm tra dự toán tiền công & giao dịch sổ quỹ
    if (
      event._count.salaryConfigs > 0 ||
      event._count.salaryDetails > 0 ||
      event._count.transactions > 0
    ) {
      throw AppError.badRequest(
        'Không thể hủy sự kiện đã được lập dự toán tiền công hoặc đã có phiếu thu chi.'
      );
    }

    return eventRepository.update(id, { status: 'CANCELLED' });
  },

  // Xóa sự kiện: Xóa hoàn toàn sự kiện khỏi cơ sở dữ liệu
  async delete(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            eventMembers: true,
            salaryConfigs: true,
            salaryDetails: true,
            transactions: true,
          },
        },
      },
    });

    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện');
    }

    // Kiểm tra ràng buộc tài chính trong sổ quỹ và bảng lương
    if (event._count.transactions > 0) {
      throw AppError.badRequest(
        `Không thể xóa sự kiện đã phát sinh ${event._count.transactions} phiếu thu chi trong sổ quỹ. Vui lòng kiểm tra và xử lý phiếu thu chi trước.`
      );
    }

    if (event._count.salaryDetails > 0) {
      throw AppError.badRequest(
        'Không thể xóa sự kiện đã được tính vào bảng lương thành viên.'
      );
    }

    // Thực hiện xóa an toàn các dữ liệu phụ thuộc
    return prisma.$transaction(async (tx) => {
      // Xóa cấu hình lương theo sự kiện (nếu có)
      await tx.salaryConfig.deleteMany({ where: { eventId: id } });
      // Xóa đánh giá sự kiện (nếu có)
      await tx.eventReview.deleteMany({ where: { eventId: id } });
      // Xóa điểm danh (nếu có)
      await tx.attendance.deleteMany({ where: { eventId: id } });
      // Xóa phân công thành viên (nếu có)
      await tx.eventMember.deleteMany({ where: { eventId: id } });
      // Xóa sự kiện
      return tx.event.delete({ where: { id } });
    });
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

  /**
   * Lấy danh sách lịch diễn sắp tới công khai cho toàn đội (không cần đăng nhập, bảo mật thông tin tài chính)
   */
  async getPublicUpcomingEvents(query?: { search?: string; date?: string; filter?: 'all' | 'today' | 'week' | 'month' }) {
    const now = new Date();
    // Lấy từ đầu ngày hôm nay (00:00:00) theo giờ địa phương
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Tính đầu tuần / cuối tuần này
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday, 0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

    // Đầu tháng / cuối tháng này
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    let dateFilter: any = { gte: startOfToday };
    if (query?.date) {
      const parts = query.date.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const start = new Date(year, month, day, 0, 0, 0, 0);
        const end = new Date(year, month, day, 23, 59, 59, 999);
        dateFilter = { gte: start, lte: end };
      }
    } else if (query?.filter === 'today') {
      dateFilter = { gte: startOfToday, lte: endOfToday };
    } else if (query?.filter === 'week') {
      dateFilter = { gte: startOfToday, lte: endOfWeek };
    } else if (query?.filter === 'month') {
      dateFilter = { gte: startOfToday, lte: endOfMonth };
    }

    const where: any = {
      eventDate: dateFilter,
      status: { notIn: ['CANCELLED'] },
    };

    if (query?.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { eventCode: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        {
          eventMembers: {
            some: {
              member: {
                fullName: { contains: q, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    const events = await prisma.event.findMany({
      where,
      select: {
        id: true,
        eventCode: true,
        name: true,
        eventType: true,
        eventDate: true,
        startTime: true,
        endTime: true,
        location: true,
        description: true,
        status: true,
        eventMembers: {
          select: {
            id: true,
            status: true,
            note: true,
            position: {
              select: {
                id: true,
                name: true,
              },
            },
            member: {
              select: {
                id: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { eventDate: 'asc' },
    });

    // Thống kê nhanh
    const totalUpcoming = events.length;
    const todayEventsCount = events.filter((e) => {
      const d = new Date(e.eventDate);
      return d >= startOfToday && d <= endOfToday;
    }).length;

    const thisWeekEventsCount = events.filter((e) => {
      const d = new Date(e.eventDate);
      return d >= startOfToday && d <= endOfWeek;
    }).length;

    return {
      events,
      stats: {
        totalUpcoming,
        todayEventsCount,
        thisWeekEventsCount,
      },
      updatedAt: new Date().toISOString(),
    };
  },

  // Public: Khách hàng điền form đăng ký đặt show / trang trí lân sư rồng
  async createPublicBooking(input: PublicBookingInput) {
    const adminUser =
      (await prisma.user.findFirst({
        where: { role: { name: { in: ['SUPER_ADMIN', 'ADMIN'] } } },
      })) || (await prisma.user.findFirst());

    if (!adminUser) {
      throw new AppError('Hệ thống chưa thiết lập tài khoản quản trị tiếp nhận lịch', 500);
    }

    const parsedDate = new Date(input.eventDate);
    if (isNaN(parsedDate.getTime())) {
      throw AppError.badRequest('Ngày tổ chức không hợp lệ');
    }

    let startDateTime: Date | null = null;
    let endDateTime: Date | null = null;

    if (input.startTime) {
      if (input.startTime.includes(':') && !input.startTime.includes('T')) {
        const [hours, minutes] = input.startTime.split(':').map(Number);
        startDateTime = new Date(parsedDate);
        startDateTime.setHours(hours || 0, minutes || 0, 0, 0);
      } else {
        const d = new Date(input.startTime);
        if (!isNaN(d.getTime())) startDateTime = d;
      }
    }

    if (input.endTime) {
      if (input.endTime.includes(':') && !input.endTime.includes('T')) {
        const [hours, minutes] = input.endTime.split(':').map(Number);
        endDateTime = new Date(parsedDate);
        endDateTime.setHours(hours || 0, minutes || 0, 0, 0);
      } else {
        const d = new Date(input.endTime);
        if (!isNaN(d.getTime())) endDateTime = d;
      }
    }

    let mapLink = input.mapUrl?.trim() || '';
    if (!mapLink && input.latitude && input.longitude) {
      mapLink = `https://www.google.com/maps?q=${input.latitude},${input.longitude}`;
    }

    const fullLocation = mapLink ? `${input.address.trim()} (Bản đồ: ${mapLink})` : input.address.trim();

    const eventCode = await this.generateEventCode(parsedDate);
    const serviceLabel = input.serviceName || input.serviceType || 'Biểu diễn & Trang trí Lân Sư Rồng';
    const eventName = `[ĐẶT SHOW] ${input.customerName.trim()} - ${serviceLabel}`;

    const validEventTypes = ['KHAI_TRUONG', 'TRUNG_THU', 'TET', 'DAM_CUOI', 'LE_HOI', 'BIEU_DIEN', 'OTHER'];
    const eventType = input.serviceType && validEventTypes.includes(input.serviceType) ? input.serviceType : 'OTHER';

    const performancesText =
      input.performances && input.performances.length > 0 ? input.performances.join(', ') : 'Chưa chỉ định';

    const descriptionParts = [
      `🏮 YÊU CẦU ĐẶT LỊCH BIỂU DIỄN & TRANG TRÍ (Đăng ký online)`,
      `👤 Khách hàng / Đơn vị: ${input.customerName.trim()}`,
      `📞 Số điện thoại: ${input.customerPhone.trim()}${input.customerZalo ? ` | Zalo: ${input.customerZalo.trim()}` : ''}`,
      input.customerEmail ? `✉️ Email: ${input.customerEmail.trim()}` : null,
      `🎪 Loại dịch vụ: ${serviceLabel}`,
      `🎭 Tiết mục & Hạng mục: ${performancesText}`,
      mapLink ? `📍 Vị trí bản đồ: ${mapLink}` : null,
      input.estimatedBudget ? `💰 Ngân sách dự kiến: ${Number(input.estimatedBudget).toLocaleString('vi-VN')} VNĐ` : null,
      input.notes ? `📝 Ghi chú từ khách hàng: ${input.notes.trim()}` : null,
      `🕒 Thời gian gửi yêu cầu: ${new Date().toLocaleString('vi-VN')}`,
    ].filter(Boolean);

    const event = await prisma.event.create({
      data: {
        eventCode,
        name: eventName,
        eventType,
        eventDate: parsedDate,
        startTime: startDateTime,
        endTime: endDateTime,
        location: fullLocation,
        customerName: input.customerName.trim(),
        customerPhone: input.customerPhone.trim(),
        contractValue: input.estimatedBudget ? Number(input.estimatedBudget) : null,
        status: 'DRAFT',
        description: descriptionParts.join('\n'),
        createdBy: adminUser.id,
      },
      select: {
        id: true,
        eventCode: true,
        name: true,
        eventDate: true,
        startTime: true,
        endTime: true,
        location: true,
        customerName: true,
        customerPhone: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      booking: event,
      message: `Đoàn Nghệ Thuật Lân Sư Rồng Nga My Thượng đã nhận được thông tin đặt lịch của quý khách ${input.customerName}! Chúng tôi sẽ liên hệ lại qua số điện thoại ${input.customerPhone} trong thời gian sớm nhất để tư vấn phương án biểu diễn & trang trí tối ưu.`,
    };
  },
};


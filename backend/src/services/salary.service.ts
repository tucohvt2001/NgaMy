import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { salaryRepository, salaryConfigRepository } from '../repositories/salary.repository';
import { transactionService } from './transaction.service';
import {
  CalculateSalaryInput,
  CalculateMonthInput,
  CreateSalaryConfigInput,
  ListSalaryQuery,
  UpdateSalaryConfigInput,
} from '../validators/salary.validator';

export const salaryService = {
  // Tối ưu hóa: Tự động tính toán & đồng bộ tiền công cho toàn bộ thành viên trong tháng siêu tốc (Batch query)
  async calculateMonth(month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 1. Lấy tất cả SalaryRecord hiện tại của tháng này trong 1 query duy nhất
    const existingRecords = await prisma.salaryRecord.findMany({
      where: { month, year },
      include: { details: true, member: true },
    });
    const existingMap = new Map(existingRecords.map((r) => [r.memberId, r]));

    // 2. Lấy tất cả điểm danh PRESENT/LATE của các SHOW ĐÃ DỰ TOÁN (status = COMPLETED) trong tháng
    const attendances = await prisma.attendance.findMany({
      where: {
        status: { in: ['PRESENT', 'LATE'] },
        event: {
          eventDate: { gte: startDate, lte: endDate },
          status: 'COMPLETED', // Show chưa dự toán sẽ KHÔNG được tính vào tiền công
        },
      },
      include: {
        event: { select: { id: true, name: true, status: true, eventType: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Gom attendances theo memberId
    const attendancesByMember = new Map<string, typeof attendances>();
    const eventIdsSet = new Set<string>();
    for (const att of attendances) {
      if (!attendancesByMember.has(att.memberId)) {
        attendancesByMember.set(att.memberId, []);
      }
      attendancesByMember.get(att.memberId)!.push(att);
      eventIdsSet.add(att.eventId);
    }

    // 3. Lấy tất cả EventMember của các show này trong 1 query duy nhất
    const eventMembers = await prisma.eventMember.findMany({
      where: { eventId: { in: Array.from(eventIdsSet) } },
      select: { eventId: true, memberId: true, positionId: true },
    });
    const eventMemberMap = new Map<string, string | null>();
    for (const em of eventMembers) {
      eventMemberMap.set(`${em.eventId}_${em.memberId}`, em.positionId);
    }

    // 4. Lấy tất cả SalaryConfig đang active trong 1 query duy nhất
    const configs = await prisma.salaryConfig.findMany({
      where: { isActive: true },
    });

    // Map config theo thứ tự ưu tiên: Member+Event > Event > (EventType+Position) > EventType > Member > Position
    const memberEventConfigMap = new Map<string, number>();
    const eventConfigMap = new Map<string, number>();
    const eventTypePositionConfigMap = new Map<string, number>();
    const eventTypeConfigMap = new Map<string, number>();
    const memberConfigMap = new Map<string, number>();
    const positionConfigMap = new Map<string, number>();

    for (const cfg of configs) {
      if (cfg.memberId && cfg.eventId) {
        memberEventConfigMap.set(`${cfg.memberId}_${cfg.eventId}`, cfg.amount);
      } else if (cfg.eventId && !cfg.memberId && !cfg.positionId) {
        eventConfigMap.set(cfg.eventId, cfg.amount);
      } else if (cfg.eventType && cfg.positionId && !cfg.memberId && !cfg.eventId) {
        eventTypePositionConfigMap.set(`${cfg.eventType}_${cfg.positionId}`, cfg.amount);
      } else if (cfg.eventType && !cfg.positionId && !cfg.memberId && !cfg.eventId) {
        eventTypeConfigMap.set(cfg.eventType, cfg.amount);
      } else if (cfg.memberId && !cfg.eventId && !cfg.positionId) {
        memberConfigMap.set(cfg.memberId, cfg.amount);
      } else if (cfg.positionId && !cfg.memberId && !cfg.eventId && !cfg.eventType) {
        positionConfigMap.set(cfg.positionId, cfg.amount);
      }
    }

    const findAmountInMemory = (
      memberId: string,
      eventId: string,
      eventType: string | null,
      positionId: string | null,
    ): number => {
      // 1. Mức phân bổ riêng cho show này (lưu từ Dự toán sự kiện)
      const me = memberEventConfigMap.get(`${memberId}_${eventId}`);
      if (me !== undefined) return me;
      // 2. Mức tiền công chung của sự kiện
      const ev = eventConfigMap.get(eventId);
      if (ev !== undefined) return ev;
      // 3. Mức tiền công theo (Loại Show + Vị trí)
      if (eventType && positionId) {
        const etp = eventTypePositionConfigMap.get(`${eventType}_${positionId}`);
        if (etp !== undefined) return etp;
      }
      // 4. Mức tiền công chung của Loại Show
      if (eventType) {
        const et = eventTypeConfigMap.get(eventType);
        if (et !== undefined) return et;
      }
      // 5. Mức tiền công cố định của thành viên
      const mem = memberConfigMap.get(memberId);
      if (mem !== undefined) return mem;
      // 6. Mức tiền công theo vị trí biểu diễn mặc định
      if (positionId) {
        const pos = positionConfigMap.get(positionId);
        if (pos !== undefined) return pos;
      }
      return 0;
    };

    // Tập hợp tất cả memberIds cần xử lý
    const allMemberIds = new Set<string>([
      ...Array.from(attendancesByMember.keys()),
      ...Array.from(existingMap.keys()),
    ]);

    const results = [];
    for (const memberId of allMemberIds) {
      const existing = existingMap.get(memberId);

      // Nếu đã CONFIRMED (Đã thanh toán) thì giữ nguyên tuyệt đối, không tính lại
      if (existing && existing.status === 'CONFIRMED') {
        results.push(existing);
        continue;
      }

      const memberAttendances = attendancesByMember.get(memberId) || [];

      if (memberAttendances.length === 0 && !existing) {
        continue;
      }

      const details: { eventId: string; positionId: string | null; amount: number; note?: string }[] = [];
      let baseAmount = 0;

      for (const att of memberAttendances) {
        const positionId = eventMemberMap.get(`${att.eventId}_${memberId}`) ?? null;
        const amount = findAmountInMemory(memberId, att.eventId, att.event.eventType, positionId);
        baseAmount += amount;
        details.push({
          eventId: att.eventId,
          positionId,
          amount,
          note: att.event.name,
        });
      }

      const allowance = existing?.allowance ?? 0;
      const bonus = existing?.bonus ?? 0;
      const deduction = existing?.deduction ?? 0;
      const totalAmount = baseAmount + allowance + bonus - deduction;

      // Nếu bản ghi DRAFT đã khớp hoàn toàn (không có thay đổi mới), không cần ghi lại DB
      const isUnchanged =
        existing &&
        existing.status === 'DRAFT' &&
        existing.totalSessions === memberAttendances.length &&
        existing.baseAmount === baseAmount &&
        existing.totalAmount === totalAmount &&
        existing.details.length === details.length;

      if (isUnchanged) {
        results.push(existing);
        continue;
      }

      const record = await salaryRepository.upsertWithDetails({
        memberId,
        month,
        year,
        totalSessions: memberAttendances.length,
        baseAmount,
        allowance,
        bonus,
        deduction,
        totalAmount,
        details,
      });

      results.push(record);
    }

    return results;
  },

  async list(query: ListSalaryQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const month = query.month ? Number(query.month) : undefined;
    const year = query.year ? Number(query.year) : undefined;

    // Tự động tính toán / đồng bộ tiền công cho toàn bộ thành viên khi có month & year
    if (month && year && query.autoCalculate !== 'false') {
      try {
        await salaryService.calculateMonth(month, year);
      } catch (err) {
        console.error('Lỗi khi tự động tính tiền công tháng:', err);
      }
    }

    const filters = {
      memberId: query.memberId,
      month,
      year,
      status: query.status,
    };

    const [items, total] = await Promise.all([
      salaryRepository.findMany({ skip, take: limit, ...filters }),
      salaryRepository.count(filters),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async getById(id: string) {
    const record = await salaryRepository.findById(id);
    if (!record) {
      throw AppError.notFound('Không tìm thấy bảng lương');
    }
    return record;
  },

  // Công thức: Tiền công = Số buổi tham gia × Mức tiền công + Phụ cấp + Thưởng - Khấu trừ
  async calculate(input: CalculateSalaryInput) {
    const startDate = new Date(input.year, input.month - 1, 1);
    const endDate = new Date(input.year, input.month, 0, 23, 59, 59, 999);

    const attendances = await prisma.attendance.findMany({
      where: {
        memberId: input.memberId,
        status: { in: ['PRESENT', 'LATE'] },
        event: {
          eventDate: { gte: startDate, lte: endDate },
          status: 'COMPLETED', // Chỉ tính show đã dự toán / hoàn thành
        },
      },
      include: { event: true },
    });

    const details: { eventId: string; positionId: string | null; amount: number; note?: string }[] = [];
    let baseAmount = 0;

    for (const attendance of attendances) {
      const eventMember = await prisma.eventMember.findFirst({
        where: { eventId: attendance.eventId, memberId: input.memberId },
      });
      const positionId = eventMember?.positionId ?? null;
      const amount = await salaryConfigRepository.findApplicableAmount(
        input.memberId,
        attendance.eventId,
        positionId,
      );
      baseAmount += amount;
      details.push({ eventId: attendance.eventId, positionId, amount, note: attendance.event.name });
    }

    const allowance = input.allowance ?? 0;
    const bonus = input.bonus ?? 0;
    const deduction = input.deduction ?? 0;
    const totalAmount = baseAmount + allowance + bonus - deduction;

    return salaryRepository.upsertWithDetails({
      memberId: input.memberId,
      month: input.month,
      year: input.year,
      totalSessions: attendances.length,
      baseAmount,
      allowance,
      bonus,
      deduction,
      totalAmount,
      details,
    });
  },

  async confirm(id: string, confirmedBy: string) {
    const record = await salaryRepository.findById(id);
    if (!record) {
      throw AppError.notFound('Không tìm thấy bảng lương');
    }
    if (record.status === 'CONFIRMED') {
      throw AppError.conflict('Bảng lương đã được xác nhận trước đó');
    }
    const updated = await salaryRepository.confirm(id, confirmedBy);

    // Tự động tạo Phiếu Chi Tiền Công vào Sổ Quỹ cho kỳ lương tháng này
    if (record.details && record.details.length > 0) {
      for (const detail of record.details) {
        if (detail.amount > 0) {
          const code = await transactionService.generateCode('EXPENSE', new Date());
          await prisma.transaction.create({
            data: {
              code,
              type: 'EXPENSE',
              category: 'SALARY_PAYOUT',
              amount: detail.amount,
              transactionDate: new Date(),
              paymentMethod: record.member?.bankAccount ? 'BANK_TRANSFER' : 'CASH',
              status: 'COMPLETED',
              payerOrReceiver: record.member?.fullName || 'Thành viên',
              memberId: record.memberId,
              eventId: detail.eventId || null,
              createdBy: confirmedBy,
              description: `Chi trả tiền công show "${detail.note || detail.event?.name || 'Sự kiện'}" cho ${record.member?.fullName || ''}`,
              notes: `Bảng lương Tháng ${record.month}/${record.year}. Vị trí: ${detail.position?.name || 'Diễn viên'}`,
            },
          });
        }
      }

      // Nếu có phụ cấp / thưởng - khấu trừ ngoài tiền show
      const extraAmount = (record.allowance || 0) + (record.bonus || 0) - (record.deduction || 0);
      if (extraAmount > 0) {
        const code = await transactionService.generateCode('EXPENSE', new Date());
        await prisma.transaction.create({
          data: {
            code,
            type: 'EXPENSE',
            category: 'SALARY_PAYOUT',
            amount: extraAmount,
            transactionDate: new Date(),
            paymentMethod: record.member?.bankAccount ? 'BANK_TRANSFER' : 'CASH',
            status: 'COMPLETED',
            payerOrReceiver: record.member?.fullName || 'Thành viên',
            memberId: record.memberId,
            createdBy: confirmedBy,
            description: `Phụ cấp & thưởng thêm Tháng ${record.month}/${record.year} cho ${record.member?.fullName || ''}`,
            notes: `Phụ cấp: ${record.allowance}đ, Thưởng: ${record.bonus}đ, Khấu trừ: ${record.deduction}đ`,
          },
        });
      }
    } else if (record.totalAmount > 0) {
      const code = await transactionService.generateCode('EXPENSE', new Date());
      await prisma.transaction.create({
        data: {
          code,
          type: 'EXPENSE',
          category: 'SALARY_PAYOUT',
          amount: record.totalAmount,
          transactionDate: new Date(),
          paymentMethod: record.member?.bankAccount ? 'BANK_TRANSFER' : 'CASH',
          status: 'COMPLETED',
          payerOrReceiver: record.member?.fullName || 'Thành viên',
          memberId: record.memberId,
          createdBy: confirmedBy,
          description: `Chi trả tiền công Tháng ${record.month}/${record.year} cho ${record.member?.fullName || ''}`,
          notes: `Lương cơ bản: ${record.baseAmount}đ, Phụ cấp: ${record.allowance}đ, Thưởng: ${record.bonus}đ, Khấu trừ: ${record.deduction}đ`,
        },
      });
    }

    return updated;
  },
};

export const salaryConfigService = {
  list() {
    return salaryConfigRepository.findMany();
  },

  create(input: CreateSalaryConfigInput) {
    return salaryConfigRepository.create(input);
  },

  async batchSavePositions(configs: Array<{ positionId: string; amount: number; note?: string | null }>) {
    const results = [];
    for (const cfg of configs) {
      const existing = await prisma.salaryConfig.findFirst({
        where: { positionId: cfg.positionId, memberId: null, eventId: null, eventType: null },
      });
      if (existing) {
        results.push(
          await prisma.salaryConfig.update({
            where: { id: existing.id },
            data: { amount: cfg.amount, note: cfg.note, isActive: true },
          }),
        );
      } else {
        results.push(
          await prisma.salaryConfig.create({
            data: { positionId: cfg.positionId, amount: cfg.amount, note: cfg.note, isActive: true },
          }),
        );
      }
    }
    return results;
  },

  async batchSaveMatrix(
    configs: Array<{ eventType: string; positionId: string; amount: number; note?: string | null }>,
  ) {
    const results = [];
    for (const cfg of configs) {
      const existing = await prisma.salaryConfig.findFirst({
        where: {
          eventType: cfg.eventType,
          positionId: cfg.positionId,
          memberId: null,
          eventId: null,
        },
      });
      if (existing) {
        results.push(
          await prisma.salaryConfig.update({
            where: { id: existing.id },
            data: { amount: cfg.amount, note: cfg.note, isActive: true },
          }),
        );
      } else {
        results.push(
          await prisma.salaryConfig.create({
            data: {
              eventType: cfg.eventType,
              positionId: cfg.positionId,
              amount: cfg.amount,
              note: cfg.note,
              isActive: true,
            },
          }),
        );
      }
    }
    return results;
  },

  async saveEventRate(eventId: string, amount: number, note?: string | null) {
    const existing = await prisma.salaryConfig.findFirst({
      where: { eventId, memberId: null },
    });
    if (existing) {
      return prisma.salaryConfig.update({
        where: { id: existing.id },
        data: { amount, note, isActive: true },
      });
    }
    return prisma.salaryConfig.create({
      data: { eventId, amount, note, isActive: true },
    });
  },

  async update(id: string, input: UpdateSalaryConfigInput) {
    const existing = await prisma.salaryConfig.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound('Không tìm thấy cấu hình tiền công');
    }
    return salaryConfigRepository.update(id, input);
  },

  async remove(id: string) {
    const existing = await prisma.salaryConfig.findUnique({ where: { id } });
    if (!existing) {
      throw AppError.notFound('Không tìm thấy cấu hình tiền công');
    }
    await salaryConfigRepository.delete(id);
  },
};

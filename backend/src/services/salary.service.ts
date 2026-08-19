import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { salaryRepository, salaryConfigRepository } from '../repositories/salary.repository';
import {
  CalculateSalaryInput,
  CreateSalaryConfigInput,
  ListSalaryQuery,
  UpdateSalaryConfigInput,
} from '../validators/salary.validator';

export const salaryService = {
  async list(query: ListSalaryQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const filters = {
      memberId: query.memberId,
      month: query.month ? Number(query.month) : undefined,
      year: query.year ? Number(query.year) : undefined,
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
        event: { eventDate: { gte: startDate, lte: endDate } },
      },
      include: { event: true },
    });

    const details: { eventId: string; positionId: string | null; amount: number; note?: string }[] = [];
    let baseAmount = 0;

    for (const attendance of attendances) {
      const eventMember = await prisma.eventMember.findUnique({
        where: { eventId_memberId: { eventId: attendance.eventId, memberId: input.memberId } },
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
    return salaryRepository.confirm(id, confirmedBy);
  },
};

export const salaryConfigService = {
  list() {
    return salaryConfigRepository.findMany();
  },

  create(input: CreateSalaryConfigInput) {
    return salaryConfigRepository.create(input);
  },

  async update(id: string, input: UpdateSalaryConfigInput) {
    const existing = await salaryConfigRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Không tìm thấy cấu hình tiền công');
    }
    return salaryConfigRepository.update(id, input);
  },

  async remove(id: string) {
    const existing = await salaryConfigRepository.findById(id);
    if (!existing) {
      throw AppError.notFound('Không tìm thấy cấu hình tiền công');
    }
    await salaryConfigRepository.delete(id);
  },
};

import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { EventSettlementInput } from '../validators/eventSettlement.validator';
import { transactionService } from './transaction.service';

export const eventSettlementService = {
  async getSettlementOverview(eventId: string) {
    const [
      event,
      eventMembers,
      existingSalaryConfigs,
      existingTransactions,
      confirmedSalaryDetails,
      positionConfigs,
    ] = await Promise.all([
      prisma.event.findUnique({
        where: { id: eventId },
        include: {
          creator: { select: { id: true, username: true } },
        },
      }),
      prisma.eventMember.findMany({
        where: { eventId },
        include: {
          member: {
            select: {
              id: true,
              memberCode: true,
              fullName: true,
              phone: true,
              bankAccount: true,
              bankName: true,
            },
          },
          position: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.salaryConfig.findMany({
        where: { eventId, isActive: true },
      }),
      prisma.transaction.findMany({
        where: { eventId },
        include: {
          member: { select: { id: true, memberCode: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      // Kiểm tra xem tiền công của show này đã được thanh toán (CONFIRMED) trong module Tiền công chưa
      prisma.salaryDetail.findMany({
        where: {
          eventId,
          salaryRecord: { status: 'CONFIRMED' },
        },
        select: {
          salaryRecord: { select: { memberId: true } },
        },
      }),
      // Lấy định mức lương mặc định theo vị trí
      prisma.salaryConfig.findMany({
        where: { positionId: { not: null }, memberId: null, eventId: null, isActive: true },
      }),
    ]);

    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện');
    }

    const paidMemberIdSet = new Set(confirmedSalaryDetails.map((sd) => sd.salaryRecord.memberId));

    const salaryConfigMap = new Map(
      existingSalaryConfigs.filter((sc) => sc.memberId).map((sc) => [sc.memberId!, sc]),
    );
    const eventGeneralConfig = existingSalaryConfigs.find((sc) => !sc.memberId);
    const positionConfigMap = new Map(
      positionConfigs.filter((pc) => pc.positionId && !pc.eventType).map((pc) => [pc.positionId!, pc.amount]),
    );
    const eventTypePositionConfigMap = new Map(
      positionConfigs
        .filter((pc) => pc.eventType === event.eventType && pc.positionId)
        .map((pc) => [pc.positionId!, pc.amount]),
    );
    const eventTypeGeneralConfig = positionConfigs.find(
      (pc) => pc.eventType === event.eventType && !pc.positionId,
    );

    let settledIncome = 0;
    let settledExpense = 0;
    existingTransactions.forEach((tx) => {
      if (tx.status === 'COMPLETED') {
        if (tx.type === 'INCOME') settledIncome += tx.amount;
        else settledExpense += tx.amount;
      }
    });

    // Gom danh sách phân công theo thành viên (1 người có thể nhiều vai trò)
    const assignedMemberMap = new Map<
      string,
      {
        member: (typeof eventMembers)[number]['member'];
        positions: Array<(typeof eventMembers)[number]['position']>;
        statuses: string[];
        notes: string[];
        id: string;
      }
    >();

    for (const em of eventMembers) {
      if (!assignedMemberMap.has(em.memberId)) {
        assignedMemberMap.set(em.memberId, {
          id: em.id,
          member: em.member,
          positions: [],
          statuses: [],
          notes: [],
        });
      }
      const item = assignedMemberMap.get(em.memberId)!;
      if (em.position) item.positions.push(em.position);
      if (em.status) item.statuses.push(em.status);
      if (em.note) item.notes.push(em.note);
    }

    const memberOverviewList = Array.from(assignedMemberMap.entries()).map(([memberId, data]) => {
      const savedConfig = salaryConfigMap.get(memberId);
      const isPaid = paidMemberIdSet.has(memberId);
      const positionName = data.positions.map((p) => p?.name).filter(Boolean).join(', ') || 'Thành viên';

      // Tính mức tiền công gợi ý ban đầu: đã lưu riêng > định mức show > định mức (loại show + vai trò) > loại show chung > vai trò mặc định > 0
      let defaultPayout = 0;
      if (savedConfig) {
        defaultPayout = savedConfig.amount;
      } else if (eventGeneralConfig) {
        defaultPayout = eventGeneralConfig.amount;
      } else if (
        event.eventType &&
        data.positions.length > 0 &&
        data.positions.some((p) => p?.id && eventTypePositionConfigMap.has(p.id))
      ) {
        defaultPayout = data.positions.reduce(
          (sum, p) => sum + (p?.id ? eventTypePositionConfigMap.get(p.id) || positionConfigMap.get(p.id) || 0 : 0),
          0,
        );
      } else if (event.eventType && eventTypeGeneralConfig) {
        defaultPayout = eventTypeGeneralConfig.amount;
      } else if (data.positions.length > 0) {
        defaultPayout = data.positions.reduce((sum, p) => sum + (p?.id ? positionConfigMap.get(p.id) || 0 : 0), 0);
      }

      return {
        id: data.id,
        memberId,
        memberCode: data.member.memberCode,
        fullName: data.member.fullName,
        phone: data.member.phone,
        bankAccount: data.member.bankAccount,
        bankName: data.member.bankName,
        positionId: data.positions[0]?.id || '',
        positionName,
        status: data.statuses[0] || 'ASSIGNED',
        note: data.notes.filter(Boolean).join('; ') || null,
        payoutAmount: defaultPayout,
        payoutNote: savedConfig?.note ?? '',
        isPaid,
      };
    });

    return {
      event,
      members: memberOverviewList,
      existingTransactions,
      settledIncome,
      settledExpense,
      isSettled: existingTransactions.length > 0 || existingSalaryConfigs.length > 0,
    };
  },

  async settleEvent(eventId: string, input: EventSettlementInput, userId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện');
    }

    // Kiểm tra danh sách thành viên đã được thanh toán tiền công cho sự kiện này
    const confirmedSalaryDetails = await prisma.salaryDetail.findMany({
      where: {
        eventId,
        salaryRecord: { status: 'CONFIRMED' },
      },
      select: {
        salaryRecord: { select: { memberId: true } },
      },
    });
    const paidMemberIdSet = new Set(confirmedSalaryDetails.map((sd) => sd.salaryRecord.memberId));

    const txDate = input.settlementDate ? new Date(input.settlementDate) : new Date();
    const createdTransactions: any[] = [];

    // 1. Cập nhật thông tin sự kiện nếu có yêu cầu
    const eventUpdateData: any = {};
    if (input.contractAmount !== undefined) {
      eventUpdateData.contractValue = input.contractAmount;
    }
    if (input.markEventCompleted && event.status !== 'COMPLETED') {
      eventUpdateData.status = 'COMPLETED';
    }

    if (Object.keys(eventUpdateData).length > 0) {
      await prisma.event.update({
        where: { id: eventId },
        data: eventUpdateData,
      });
    }

    // 2. Tạo Phiếu Thu (Doanh thu show + Tiền lộc)
    const totalIncome = input.contractAmount + (input.tipAmount || 0);
    if (input.createIncomeVoucher && totalIncome > 0) {
      const code = await transactionService.generateCode('INCOME', txDate);
      const incomeTx = await prisma.transaction.create({
        data: {
          code,
          type: 'INCOME',
          category: 'EVENT_REVENUE',
          amount: totalIncome,
          tipAmount: input.tipAmount || 0,
          transactionDate: txDate,
          paymentMethod: input.paymentMethod,
          status: 'COMPLETED',
          payerOrReceiver: input.payer || event.customerName || 'Khách hàng sự kiện',
          description: `Thu tiền biểu diễn sự kiện: ${event.name}`,
          eventId: event.id,
          createdBy: userId,
          notes: input.notes || null,
        },
      });
      createdTransactions.push(incomeTx);
    }

    // 3. Tạo các Phiếu Chi phát sinh (Xe cộ, Ăn uống, Hậu cần...) nếu có
    if (input.expenses && input.expenses.length > 0) {
      const CATEGORY_EXPENSE_LABELS: Record<string, string> = {
        EQUIPMENT_PURCHASE: 'Mua sắm đầu lân / Đạo cụ / Trống',
        EQUIPMENT_MAINTENANCE: 'Bảo dưỡng / Sửa chữa đạo cụ',
        TRAVEL_FOOD: 'Ăn uống / Đi lại lưu diễn',
        EVENT_OPERATIONS: 'Chi phí tổ chức sự kiện',
        UNIFORM: 'Đồng phục CLB',
        SALARY_PAYOUT: 'Chi trả tiền công',
        OTHER_EXPENSE: 'Chi khác',
      };

      for (const exp of input.expenses) {
        if (exp.amount > 0) {
          const code = await transactionService.generateCode('EXPENSE', txDate);
          const catLabel = CATEGORY_EXPENSE_LABELS[exp.category] || 'Chi phí show';
          const finalDesc = exp.description?.trim()
            ? `${exp.description.trim()} (Show: ${event.name})`
            : `${catLabel} (Show: ${event.name})`;
          const finalReceiver = exp.receiver?.trim() || catLabel;

          const expenseTx = await prisma.transaction.create({
            data: {
              code,
              type: 'EXPENSE',
              category: exp.category,
              amount: exp.amount,
              transactionDate: txDate,
              paymentMethod: exp.paymentMethod,
              status: 'COMPLETED',
              payerOrReceiver: finalReceiver,
              description: finalDesc,
              eventId: event.id,
              createdBy: userId,
            },
          });
          createdTransactions.push(expenseTx);
        }
      }
    }

    // 4. Lưu mức Tiền Công Dự Kiến cho từng thành viên tham gia show (không sửa các thành viên đã thanh toán)
    let totalEstimatedPayout = 0;
    if (input.memberPayouts && input.memberPayouts.length > 0) {
      for (const payout of input.memberPayouts) {
        const amount = Number(payout.amount) || 0;
        totalEstimatedPayout += amount;

        // Nếu thành viên đã được thanh toán tiền công trong bảng lương CONFIRMED thì bỏ qua không sửa
        if (payout.memberId && !paidMemberIdSet.has(payout.memberId)) {
          const existing = await prisma.salaryConfig.findFirst({
            where: { eventId, memberId: payout.memberId },
          });

          if (existing) {
            await prisma.salaryConfig.update({
              where: { id: existing.id },
              data: {
                amount,
                note: payout.note || `Tiền công dự kiến show ${event.name}`,
                isActive: true,
              },
            });
          } else if (amount > 0) {
            await prisma.salaryConfig.create({
              data: {
                eventId,
                memberId: payout.memberId,
                amount,
                note: payout.note || `Tiền công dự kiến show ${event.name}`,
                isActive: true,
              },
            });
          }
        }
      }
    }

    // Tính tổng kết sau khi tạo
    let createdIncomeTotal = 0;
    let createdExpenseTotal = 0;
    createdTransactions.forEach((tx) => {
      if (tx.type === 'INCOME') createdIncomeTotal += tx.amount;
      else createdExpenseTotal += tx.amount;
    });

    return {
      success: true,
      message: `Dự toán show "${event.name}" thành công! Đã lưu tiền công dự kiến cho ${input.memberPayouts?.length || 0} thành viên và chuyển về mục Tiền Công để thanh toán.`,
      createdTransactionsCount: createdTransactions.length,
      totalIncome: createdIncomeTotal,
      totalExpense: createdExpenseTotal,
      totalEstimatedPayout,
      netBalance: createdIncomeTotal - createdExpenseTotal,
      transactions: createdTransactions,
    };
  },
};

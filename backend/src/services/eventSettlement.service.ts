import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { EventSettlementInput } from '../validators/eventSettlement.validator';
import { transactionService } from './transaction.service';

export const eventSettlementService = {
  async getSettlementOverview(eventId: string) {
    const [event, eventMembers, existingSalaryConfigs, existingTransactions, confirmedSalaryDetails] =
      await Promise.all([
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
        // Kiểm tra xem thù lao của show này đã được thanh toán (CONFIRMED) trong module Tiền công chưa
        prisma.salaryDetail.findMany({
          where: {
            eventId,
            salaryRecord: { status: 'CONFIRMED' },
          },
          select: {
            salaryRecord: { select: { memberId: true } },
          },
        }),
      ]);

    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện');
    }

    const paidMemberIdSet = new Set(confirmedSalaryDetails.map((sd) => sd.salaryRecord.memberId));

    const salaryConfigMap = new Map(
      existingSalaryConfigs.filter((sc) => sc.memberId).map((sc) => [sc.memberId!, sc]),
    );

    let settledIncome = 0;
    let settledExpense = 0;
    existingTransactions.forEach((tx) => {
      if (tx.status === 'COMPLETED') {
        if (tx.type === 'INCOME') settledIncome += tx.amount;
        else settledExpense += tx.amount;
      }
    });

    return {
      event,
      members: eventMembers.map((em) => {
        const savedConfig = salaryConfigMap.get(em.memberId);
        const isPaid = paidMemberIdSet.has(em.memberId);
        return {
          id: em.id,
          memberId: em.memberId,
          memberCode: em.member.memberCode,
          fullName: em.member.fullName,
          phone: em.member.phone,
          bankAccount: em.member.bankAccount,
          bankName: em.member.bankName,
          positionId: em.positionId,
          positionName: em.position?.name || 'Thành viên',
          status: em.status,
          note: em.note,
          payoutAmount: savedConfig?.amount ?? 0,
          payoutNote: savedConfig?.note ?? '',
          isPaid,
        };
      }),
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

    // Kiểm tra danh sách thành viên đã được thanh toán thù lao cho sự kiện này
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
      for (const exp of input.expenses) {
        if (exp.amount > 0) {
          const code = await transactionService.generateCode('EXPENSE', txDate);
          const expenseTx = await prisma.transaction.create({
            data: {
              code,
              type: 'EXPENSE',
              category: exp.category,
              amount: exp.amount,
              transactionDate: txDate,
              paymentMethod: exp.paymentMethod,
              status: 'COMPLETED',
              payerOrReceiver: exp.receiver,
              description: `${exp.description} (Show: ${event.name})`,
              eventId: event.id,
              createdBy: userId,
            },
          });
          createdTransactions.push(expenseTx);
        }
      }
    }

    // 4. Lưu mức Thù Lao Dự Kiến cho từng thành viên tham gia show (không sửa các thành viên đã thanh toán)
    let totalEstimatedPayout = 0;
    if (input.memberPayouts && input.memberPayouts.length > 0) {
      for (const payout of input.memberPayouts) {
        const amount = Number(payout.amount) || 0;
        totalEstimatedPayout += amount;

        // Nếu thành viên đã được thanh toán thù lao trong bảng lương CONFIRMED thì bỏ qua không sửa
        if (payout.memberId && !paidMemberIdSet.has(payout.memberId)) {
          const existing = await prisma.salaryConfig.findFirst({
            where: { eventId, memberId: payout.memberId },
          });

          if (existing) {
            await prisma.salaryConfig.update({
              where: { id: existing.id },
              data: {
                amount,
                note: payout.note || `Thù lao dự kiến show ${event.name}`,
                isActive: true,
              },
            });
          } else if (amount > 0) {
            await prisma.salaryConfig.create({
              data: {
                eventId,
                memberId: payout.memberId,
                amount,
                note: payout.note || `Thù lao dự kiến show ${event.name}`,
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
      message: `Tất toán show "${event.name}" thành công! Đã lưu thù lao dự kiến cho ${input.memberPayouts?.length || 0} thành viên và chuyển về mục Tiền Công để thanh toán.`,
      createdTransactionsCount: createdTransactions.length,
      totalIncome: createdIncomeTotal,
      totalExpense: createdExpenseTotal,
      totalEstimatedPayout,
      netBalance: createdIncomeTotal - createdExpenseTotal,
      transactions: createdTransactions,
    };
  },
};

import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { EventSettlementInput } from '../validators/eventSettlement.validator';
import { transactionService } from './transaction.service';

export const eventSettlementService = {
  async getSettlementOverview(eventId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: { select: { id: true, username: true } },
      },
    });

    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện');
    }

    // Lấy danh sách thành viên được phân công vào sự kiện
    const eventMembers = await prisma.eventMember.findMany({
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
    });

    // Lấy danh sách phiếu thu chi đã được lập cho sự kiện này
    const existingTransactions = await prisma.transaction.findMany({
      where: { eventId },
      include: {
        member: { select: { id: true, memberCode: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

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
      members: eventMembers.map((em) => ({
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
      })),
      existingTransactions,
      settledIncome,
      settledExpense,
      isSettled: existingTransactions.length > 0,
    };
  },

  async settleEvent(eventId: string, input: EventSettlementInput, userId: string) {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw AppError.notFound('Không tìm thấy sự kiện');
    }

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

    // 3. Tạo các Phiếu Chi phát sinh (Xe cộ, Ăn uống, Hậu cần...)
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

    // 4. Tạo các Phiếu Chi Thù Lao cho từng thành viên đi show
    if (input.createExpenseVouchers && input.memberPayouts && input.memberPayouts.length > 0) {
      // Load member details to get full names
      const memberIds = input.memberPayouts.map((p) => p.memberId);
      const members = await prisma.member.findMany({
        where: { id: { in: memberIds } },
        select: { id: true, memberCode: true, fullName: true },
      });
      const memberMap = new Map(members.map((m) => [m.id, m]));

      for (const payout of input.memberPayouts) {
        if (payout.amount > 0) {
          const member = memberMap.get(payout.memberId);
          const memberName = member ? `${member.memberCode} - ${member.fullName}` : 'Thành viên';
          const code = await transactionService.generateCode('EXPENSE', txDate);

          const payoutTx = await prisma.transaction.create({
            data: {
              code,
              type: 'EXPENSE',
              category: 'SALARY_PAYOUT',
              amount: payout.amount,
              transactionDate: txDate,
              paymentMethod: payout.paymentMethod,
              status: 'COMPLETED',
              payerOrReceiver: member?.fullName || memberName,
              memberId: payout.memberId,
              eventId: event.id,
              createdBy: userId,
              description: `Thù lao biểu diễn show "${event.name}"${payout.positionName ? ' (' + payout.positionName + ')' : ''}`,
              notes: payout.note || null,
            },
          });
          createdTransactions.push(payoutTx);
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
      message: `Quyết toán show "${event.name}" thành công, đã tạo ${createdTransactions.length} phiếu thu chi!`,
      createdTransactionsCount: createdTransactions.length,
      totalIncome: createdIncomeTotal,
      totalExpense: createdExpenseTotal,
      netBalance: createdIncomeTotal - createdExpenseTotal,
      transactions: createdTransactions,
    };
  },
};

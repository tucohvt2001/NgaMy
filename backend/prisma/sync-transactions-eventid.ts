import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Bắt đầu đồng bộ thông tin show diễn và eventId cho tất cả phiếu chi tiền công (SALARY_PAYOUT)...');

  const salaryTransactions = await prisma.transaction.findMany({
    where: {
      category: 'SALARY_PAYOUT',
    },
    include: {
      member: true,
      event: true,
    },
  });

  console.log(`Tìm thấy ${salaryTransactions.length} phiếu chi tiền công trong hệ thống.`);

  let updatedCount = 0;

  for (const tx of salaryTransactions) {
    if (!tx.memberId) continue;

    // Tìm chi tiết lương (SalaryRecord + SalaryDetail) của thành viên này
    const salaryRecords = await prisma.salaryRecord.findMany({
      where: {
        memberId: tx.memberId,
      },
      include: {
        details: {
          include: {
            event: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const record of salaryRecords) {
      if (record.details && record.details.length > 0) {
        const showNames = record.details
          .map((d) => d.event?.name || d.note)
          .filter(Boolean)
          .join(', ');

        const firstEventId = record.details.find((d) => Boolean(d.eventId))?.eventId || null;
        const firstEventName = record.details.find((d) => Boolean(d.eventId))?.event?.name || showNames;

        const newDesc = record.details.length === 1
          ? `Chi trả tiền công show: ${firstEventName} cho ${tx.member?.fullName || 'thành viên'}`
          : `Chi trả tiền công Tháng ${record.month}/${record.year} cho ${tx.member?.fullName || 'thành viên'} (Show: ${showNames})`;

        await prisma.transaction.update({
          where: { id: tx.id },
          data: {
            eventId: tx.eventId || firstEventId,
            description: newDesc,
            notes: `Chi tiết show: ${showNames}. Tháng ${record.month}/${record.year}`,
          },
        });

        console.log(`✅ Đã cập nhật phiếu ${tx.code}: ${newDesc} -> EventId: ${firstEventId}`);
        updatedCount++;
        break;
      }
    }
  }

  console.log(`\n🎉 Hoàn tất! Đã đồng bộ thông tin show diễn cho ${updatedCount}/${salaryTransactions.length} phiếu chi tiền công.`);
}

main()
  .catch((err) => {
    console.error('❌ Lỗi:', err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

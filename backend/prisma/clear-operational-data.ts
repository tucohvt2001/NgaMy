import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Bắt đầu xóa dữ liệu hoạt động tạm (Operational Data)...');

  // Thứ tự xóa an toàn: Transaction -> SalaryDetail -> SalaryRecord -> SalaryConfig (eventId) -> Attendance -> EventMember -> Event -> LeaveRequest
  const [
    deletedTransactions,
    deletedSalaryDetails,
    deletedSalaryRecords,
    deletedSalaryConfigs,
    deletedAttendances,
    deletedEventMembers,
    deletedEvents,
    deletedLeaveRequests,
  ] = await prisma.$transaction([
    // 1. Sổ quỹ thu chi
    prisma.transaction.deleteMany({}),
    // 2. Chi tiết tiền công
    prisma.salaryDetail.deleteMany({}),
    // 3. Bảng lương tháng
    prisma.salaryRecord.deleteMany({}),
    // 4. Cấu hình tiền công gắn với sự kiện hoặc cấu hình thù lao show
    prisma.salaryConfig.deleteMany({
      where: { eventId: { not: null } },
    }),
    // 5. Chấm công
    prisma.attendance.deleteMany({}),
    // 6. Phân công nhân sự sự kiện
    prisma.eventMember.deleteMany({}),
    // 7. Lịch diễn / Sự kiện
    prisma.event.deleteMany({}),
    // 8. Đơn nghỉ phép
    prisma.leaveRequest.deleteMany({}),
  ]);

  console.log('✅ Đã xóa thành công:');
  console.log(` - Sổ quỹ thu chi: ${deletedTransactions.count} phiếu`);
  console.log(` - Chi tiết tiền công: ${deletedSalaryDetails.count} dòng`);
  console.log(` - Bảng lương tháng: ${deletedSalaryRecords.count} bản ghi`);
  console.log(` - Cấu hình thù lao show: ${deletedSalaryConfigs.count} mục`);
  console.log(` - Điểm danh / Chấm công: ${deletedAttendances.count} bản ghi`);
  console.log(` - Phân công sự kiện: ${deletedEventMembers.count} lượt`);
  console.log(` - Lịch diễn / Sự kiện: ${deletedEvents.count} show`);
  console.log(` - Đơn xin nghỉ phép: ${deletedLeaveRequests.count} đơn`);
  console.log('\n🔒 Dữ liệu Thành viên (Member), Đội nhóm (Team), Chức vụ (Position), Tài khoản & Phân quyền (User/Role) được giữ nguyên vẹn 100%!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi xóa dữ liệu:', e);
    // process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

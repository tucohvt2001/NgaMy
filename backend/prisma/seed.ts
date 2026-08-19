// Seed script - tạo dữ liệu demo: role/permission, chức vụ, đội nhóm, thành viên, tài khoản,
// sự kiện, phân công, chấm công, nghỉ phép và tiền công để Dashboard có dữ liệu hiển thị ngay.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { PERMISSIONS, ROLE_PERMISSIONS, ROLE_NAMES } from '../src/types/enums';

const prisma = new PrismaClient();
const DEFAULT_PASSWORD = 'Password@123';

async function seedPermissionsAndRoles() {
  const permissionCodes = Object.values(PERMISSIONS);
  for (const code of permissionCodes) {
    await prisma.permission.upsert({ where: { code }, update: {}, create: { code } });
  }

  const roleMap: Record<string, string> = {};
  for (const roleName of ROLE_NAMES) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName, description: `Vai trò ${roleName}` },
    });
    roleMap[roleName] = role.id;

    const permissions = await prisma.permission.findMany({
      where: { code: { in: ROLE_PERMISSIONS[roleName] } },
    });
    for (const permission of permissions) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }
  return roleMap;
}

async function seedPositions() {
  const names = [
    'Chủ nhiệm',
    'Phó chủ nhiệm',
    'Đội trưởng',
    'Thành viên',
    'Lân đầu',
    'Lân đuôi',
    'Trống',
    'Thanh la',
    'Chập chõa',
    'Hậu cần',
  ];
  const positions: Record<string, string> = {};
  for (const name of names) {
    const position = await prisma.position.upsert({ where: { name }, update: {}, create: { name } });
    positions[name] = position.id;
  }
  return positions;
}

async function seedTeams(leaderId: string | null) {
  const names = ['Đội Lân', 'Đội Sư', 'Đội Trống', 'Đội Nhạc', 'Hậu Cần'];
  const teams: Record<string, string> = {};
  for (const [index, name] of names.entries()) {
    const team = await prisma.team.upsert({
      where: { name },
      update: {},
      create: { name, leaderId: index === 0 ? leaderId : null },
    });
    teams[name] = team.id;
  }
  return teams;
}

async function main(): Promise<void> {
  console.log('Bắt đầu seed dữ liệu...');

  const roleMap = await seedPermissionsAndRoles();
  const positions = await seedPositions();

  // Thành viên làm đội trưởng
  const leaderMember = await prisma.member.upsert({
    where: { memberCode: 'M000' },
    update: {},
    create: {
      memberCode: 'M000',
      fullName: 'Trần Văn Trưởng',
      gender: 'MALE',
      phone: '0900000000',
      joinDate: new Date('2020-01-01'),
      positions: { connect: { id: positions['Đội trưởng'] } },
      status: 'ACTIVE',
    },
  });

  const teams = await seedTeams(leaderMember.id);
  await prisma.member.update({
    where: { id: leaderMember.id },
    data: { teams: { connect: { id: teams['Đội Lân'] } } },
  });

  // M001 minh họa thành viên thuộc nhiều đội và đảm nhiệm nhiều chức vụ cùng lúc
  const memberSeeds = [
    { code: 'M001', name: 'Nguyễn Văn A', positions: ['Lân đầu', 'Trống'], teams: ['Đội Lân', 'Đội Trống'] },
    { code: 'M002', name: 'Trần Văn B', positions: ['Lân đuôi'], teams: ['Đội Lân'] },
    { code: 'M003', name: 'Lê Văn C', positions: ['Trống'], teams: ['Đội Trống'] },
    { code: 'M004', name: 'Phạm Văn D', positions: ['Thanh la'], teams: ['Đội Nhạc'] },
    { code: 'M005', name: 'Nguyễn Văn E', positions: ['Hậu cần'], teams: ['Hậu Cần'] },
  ];

  const members: Record<string, string> = {};
  for (const seedMember of memberSeeds) {
    const member = await prisma.member.upsert({
      where: { memberCode: seedMember.code },
      update: {},
      create: {
        memberCode: seedMember.code,
        fullName: seedMember.name,
        gender: 'MALE',
        joinDate: new Date('2021-01-01'),
        positions: { connect: seedMember.positions.map((name) => ({ id: positions[name] })) },
        teams: { connect: seedMember.teams.map((name) => ({ id: teams[name] })) },
        status: 'ACTIVE',
      },
    });
    members[seedMember.code] = member.id;
  }

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  await prisma.user.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      email: 'superadmin@lansurong.vn',
      passwordHash,
      roleId: roleMap.SUPER_ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@lansurong.vn',
      passwordHash,
      roleId: roleMap.ADMIN,
    },
  });

  const leaderUser = await prisma.user.upsert({
    where: { username: 'doitruong' },
    update: {},
    create: {
      username: 'doitruong',
      email: 'doitruong@lansurong.vn',
      passwordHash,
      roleId: roleMap.TEAM_LEADER,
      memberId: leaderMember.id,
    },
  });

  for (const [index, seedMember] of memberSeeds.entries()) {
    await prisma.user.upsert({
      where: { username: `thanhvien${index + 1}` },
      update: {},
      create: {
        username: `thanhvien${index + 1}`,
        email: `thanhvien${index + 1}@lansurong.vn`,
        passwordHash,
        roleId: roleMap.MEMBER,
        memberId: members[seedMember.code],
      },
    });
  }

  // Cấu hình mức tiền công theo chức vụ
  const salaryByPosition: Record<string, number> = {
    'Lân đầu': 350000,
    'Lân đuôi': 300000,
    Trống: 300000,
    'Thanh la': 250000,
    'Hậu cần': 200000,
  };
  for (const [positionName, amount] of Object.entries(salaryByPosition)) {
    const existing = await prisma.salaryConfig.findFirst({ where: { positionId: positions[positionName] } });
    if (!existing) {
      await prisma.salaryConfig.create({ data: { positionId: positions[positionName], amount } });
    }
  }

  // Sự kiện demo: 3 đã hoàn thành trong tháng hiện tại, 1 đã xác nhận sắp tới, 1 nháp
  const now = new Date();
  const eventSeeds = [
    { code: 'EVT001', name: 'Khai trương ABC Mart', daysAgo: 10, status: 'COMPLETED' },
    { code: 'EVT002', name: 'Khai trương nhà hàng Phát Đạt', daysAgo: 5, status: 'COMPLETED' },
    { code: 'EVT003', name: 'Lễ hội Trung Thu phường 5', daysAgo: 2, status: 'COMPLETED' },
    { code: 'EVT004', name: 'Khai trương showroom xe hơi', daysAgo: -5, status: 'CONFIRMED' },
    { code: 'EVT005', name: 'Tiệc tất niên công ty XYZ', daysAgo: -20, status: 'DRAFT' },
  ];

  for (const seedEvent of eventSeeds) {
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() - seedEvent.daysAgo);

    const event = await prisma.event.upsert({
      where: { eventCode: seedEvent.code },
      update: {},
      create: {
        eventCode: seedEvent.code,
        name: seedEvent.name,
        eventDate,
        location: 'TP. Hồ Chí Minh',
        customerName: 'Khách hàng demo',
        customerPhone: '0909123456',
        contractValue: 5000000,
        status: seedEvent.status,
        description: 'Sự kiện demo phục vụ seed dữ liệu',
        createdBy: leaderUser.id,
      },
    });

    if (seedEvent.status === 'COMPLETED') {
      for (const seedMember of memberSeeds) {
        const eventMember = await prisma.eventMember.upsert({
          where: { eventId_memberId: { eventId: event.id, memberId: members[seedMember.code] } },
          update: {},
          create: {
            eventId: event.id,
            memberId: members[seedMember.code],
            positionId: positions[seedMember.positions[0]],
            status: 'CONFIRMED',
          },
        });

        const checkInTime = new Date(eventDate);
        checkInTime.setHours(7, 0, 0, 0);
        const checkOutTime = new Date(eventDate);
        checkOutTime.setHours(11, 0, 0, 0);

        await prisma.attendance.upsert({
          where: { eventId_memberId: { eventId: event.id, memberId: members[seedMember.code] } },
          update: {},
          create: {
            eventId: event.id,
            memberId: members[seedMember.code],
            checkInTime,
            checkOutTime,
            status: 'PRESENT',
            confirmedBy: leaderUser.id,
            confirmedAt: new Date(),
          },
        });

        void eventMember;
      }
    }
  }

  // Đơn nghỉ phép demo
  const leaveFrom = new Date(now);
  leaveFrom.setDate(leaveFrom.getDate() + 3);
  const leaveTo = new Date(now);
  leaveTo.setDate(leaveTo.getDate() + 5);

  await prisma.leaveRequest.upsert({
    where: { id: 'seed-leave-1' },
    update: {},
    create: {
      id: 'seed-leave-1',
      memberId: members.M001,
      fromDate: leaveFrom,
      toDate: leaveTo,
      reason: 'Về quê có việc gia đình',
      status: 'PENDING',
    },
  });

  const approvedLeaveFrom = new Date(now);
  approvedLeaveFrom.setDate(approvedLeaveFrom.getDate() - 15);
  const approvedLeaveTo = new Date(now);
  approvedLeaveTo.setDate(approvedLeaveTo.getDate() - 13);

  await prisma.leaveRequest.upsert({
    where: { id: 'seed-leave-2' },
    update: {},
    create: {
      id: 'seed-leave-2',
      memberId: members.M002,
      fromDate: approvedLeaveFrom,
      toDate: approvedLeaveTo,
      reason: 'Khám sức khỏe định kỳ',
      status: 'APPROVED',
      approvedBy: leaderUser.id,
      approvedAt: new Date(),
    },
  });

  // Tính bảng lương demo cho tháng hiện tại dựa trên dữ liệu chấm công vừa tạo
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  for (const seedMember of memberSeeds) {
    const memberId = members[seedMember.code];
    const attendances = await prisma.attendance.findMany({
      where: {
        memberId,
        status: { in: ['PRESENT', 'LATE'] },
        event: {
          eventDate: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0, 23, 59, 59, 999),
          },
        },
      },
      include: { event: true },
    });

    if (attendances.length === 0) continue;

    const rate = salaryByPosition[seedMember.positions[0]] ?? 0;
    const baseAmount = attendances.length * rate;
    const totalAmount = baseAmount;

    const existingRecord = await prisma.salaryRecord.findUnique({
      where: { memberId_month_year: { memberId, month, year } },
    });
    if (existingRecord) continue;

    await prisma.salaryRecord.create({
      data: {
        memberId,
        month,
        year,
        totalSessions: attendances.length,
        baseAmount,
        totalAmount,
        details: {
          create: attendances.map((attendance) => ({
            eventId: attendance.eventId,
            positionId: positions[seedMember.positions[0]],
            amount: rate,
            note: attendance.event.name,
          })),
        },
      },
    });
  }

  console.log('Seed dữ liệu hoàn tất.');
  console.log(`Tài khoản demo (mật khẩu: ${DEFAULT_PASSWORD}):`);
  console.log('  - superadmin / SUPER_ADMIN');
  console.log('  - admin / ADMIN');
  console.log('  - doitruong / TEAM_LEADER');
  console.log('  - thanhvien1..5 / MEMBER');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

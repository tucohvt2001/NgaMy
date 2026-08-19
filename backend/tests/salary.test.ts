import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { createTestUser, createTestMember } from './helpers';

const app = createApp();

describe('Salary calculation API', () => {
  let adminToken: string;
  let memberId: string;

  beforeAll(async () => {
    const admin = await createTestUser({ username: 'salary_admin', roleName: 'ADMIN' });
    adminToken = admin.token;

    const member = await createTestMember({ fullName: 'Thành viên tính lương' });
    memberId = member.id;

    const position = await prisma.position.create({ data: { name: 'Vị trí lương test' } });
    await prisma.salaryConfig.create({ data: { positionId: position.id, amount: 300000 } });

    const eventDate = new Date();
    const event = await prisma.event.create({
      data: {
        eventCode: 'EVT-SAL-01',
        name: 'Sự kiện tính lương',
        eventDate,
        location: 'Sân khấu',
        createdBy: admin.user.id,
      },
    });

    await prisma.eventMember.create({ data: { eventId: event.id, memberId, positionId: position.id } });
    await prisma.attendance.create({
      data: {
        eventId: event.id,
        memberId,
        checkInTime: eventDate,
        checkOutTime: eventDate,
        status: 'PRESENT',
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('tính tiền công theo công thức: số buổi × mức tiền công + phụ cấp + thưởng - khấu trừ', async () => {
    const now = new Date();
    const res = await request(app)
      .post('/api/salaries/calculate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        memberId,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        allowance: 50000,
        bonus: 20000,
        deduction: 10000,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.totalSessions).toBe(1);
    expect(res.body.data.baseAmount).toBe(300000);
    expect(res.body.data.totalAmount).toBe(300000 + 50000 + 20000 - 10000);
  });

  it('xác nhận bảng lương', async () => {
    const now = new Date();
    const list = await request(app)
      .get(`/api/salaries?memberId=${memberId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const recordId = list.body.data.items[0].id;

    const res = await request(app)
      .post(`/api/salaries/${recordId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
    void now;
  });
});

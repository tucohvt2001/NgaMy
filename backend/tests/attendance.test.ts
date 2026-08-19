import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { createTestUser, createTestMember } from './helpers';

const app = createApp();

describe('Attendance check-in/check-out API', () => {
  let adminToken: string;
  let memberToken: string;
  let memberId: string;
  let eventId: string;
  let otherEventId: string;

  beforeAll(async () => {
    const admin = await createTestUser({ username: 'attendance_admin', roleName: 'ADMIN' });
    adminToken = admin.token;

    const member = await createTestMember({ fullName: 'Thành viên chấm công' });
    memberId = member.id;

    const memberUser = await createTestUser({
      username: 'attendance_member',
      roleName: 'MEMBER',
      memberId: member.id,
    });
    memberToken = memberUser.token;

    const position = await prisma.position.create({ data: { name: 'Vị trí chấm công' } });

    const event = await prisma.event.create({
      data: {
        eventCode: 'EVT-ATT-01',
        name: 'Sự kiện chấm công',
        eventDate: new Date(),
        location: 'Sân khấu',
        createdBy: admin.user.id,
      },
    });
    eventId = event.id;

    const otherEvent = await prisma.event.create({
      data: {
        eventCode: 'EVT-ATT-02',
        name: 'Sự kiện khác',
        eventDate: new Date(),
        location: 'Sân khấu khác',
        createdBy: admin.user.id,
      },
    });
    otherEventId = otherEvent.id;

    await prisma.eventMember.create({
      data: { eventId, memberId, positionId: position.id },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('từ chối check-in cho sự kiện chưa được phân công', async () => {
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ eventId: otherEventId });

    expect(res.status).toBe(403);
  });

  it('check-in thành công cho sự kiện đã được phân công', async () => {
    const res = await request(app)
      .post('/api/attendance/check-in')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ eventId });

    expect(res.status).toBe(201);
    expect(res.body.data.checkInTime).toBeDefined();
  });

  it('từ chối check-out khi chưa check-in cho sự kiện khác', async () => {
    const res = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ eventId: otherEventId });

    expect(res.status).toBe(400);
  });

  it('check-out thành công sau khi đã check-in', async () => {
    const res = await request(app)
      .post('/api/attendance/check-out')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ eventId });

    expect(res.status).toBe(200);
    expect(res.body.data.checkOutTime).toBeDefined();
  });

  it('admin xác nhận trạng thái chấm công', async () => {
    const list = await request(app)
      .get(`/api/attendance?eventId=${eventId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const attendanceId = list.body.data.items[0].id;

    const res = await request(app)
      .put(`/api/attendance/${attendanceId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'PRESENT' });

    expect(res.status).toBe(200);
    expect(res.body.data.confirmedBy).toBeDefined();
  });
});

import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { createTestUser, createTestMember } from './helpers';

const app = createApp();
jest.setTimeout(60000);

describe('Attendance API', () => {
  let adminToken: string;
  let memberToken: string;
  let memberId: string;
  let otherMemberId: string;
  let eventId: string;
  let otherEventId: string;

  beforeAll(async () => {
    const admin = await createTestUser({ username: 'attendance_admin', roleName: 'ADMIN' });
    adminToken = admin.token;

    const member = await createTestMember({ fullName: 'Thành viên chấm công' });
    memberId = member.id;

    const otherMember = await createTestMember({ fullName: 'Thành viên bổ sung' });
    otherMemberId = otherMember.id;

    const memberUser = await createTestUser({
      username: 'attendance_member',
      roleName: 'MEMBER',
      memberId: member.id,
    });
    memberToken = memberUser.token;

    const position = await prisma.position.create({ data: { name: 'Vị trí chấm công' } });

    const suffix = Date.now();
    const event = await prisma.event.create({
      data: {
        eventCode: `EVT-ATT-${suffix}`,
        name: 'Sự kiện chấm công',
        eventDate: new Date(),
        location: 'Sân khấu',
        createdBy: admin.user.id,
      },
    });
    eventId = event.id;

    const otherEvent = await prisma.event.create({
      data: {
        eventCode: `EVT-ATT2-${suffix}`,
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
  }, 60000);

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

  it('admin lấy bảng chấm công theo sự kiện (getEventSheet)', async () => {
    const res = await request(app)
      .get(`/api/attendance/event/${eventId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.event).toBeDefined();
    expect(res.body.data.members).toBeInstanceOf(Array);
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.stats.totalAssigned).toBe(1);
  });

  it('admin chấm công trực tiếp cho 1 thành viên (recordByAdmin)', async () => {
    const res = await request(app)
      .post('/api/attendance/record')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        eventId,
        memberId: otherMemberId,
        status: 'LATE',
        note: 'Đến muộn 15 phút',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('LATE');
    expect(res.body.data.note).toBe('Đến muộn 15 phút');
  });

  it('admin chấm công hàng loạt (batchRecordByAdmin)', async () => {
    const res = await request(app)
      .post('/api/attendance/batch')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        eventId,
        items: [
          { memberId, status: 'PRESENT', note: 'Đúng giờ' },
          { memberId: otherMemberId, status: 'ABSENT_WITH_PERMISSION', note: 'Bận việc riêng' },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });

  it('admin xóa bản ghi chấm công', async () => {
    const list = await request(app)
      .get(`/api/attendance?eventId=${eventId}&memberId=${otherMemberId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    const recordId = list.body.data.items[0].id;

    const res = await request(app)
      .delete(`/api/attendance/${recordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});

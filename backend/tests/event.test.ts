import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { createTestUser, createTestMember } from './helpers';

const app = createApp();

describe('Event & Assignment API', () => {
  let adminToken: string;
  let positionId: string;
  let memberId: string;
  let eventId: string;

  beforeAll(async () => {
    const { token } = await createTestUser({ username: 'event_admin', roleName: 'ADMIN' });
    adminToken = token;

    const position = await prisma.position.create({ data: { name: 'Vị trí test event' } });
    positionId = position.id;

    const member = await createTestMember({ fullName: 'Thành viên sự kiện' });
    memberId = member.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('tạo sự kiện mới', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        eventCode: 'EVT-TEST-01',
        name: 'Sự kiện test',
        eventDate: new Date().toISOString(),
        location: 'Sân khấu test',
      });

    expect(res.status).toBe(201);
    eventId = res.body.data.id;
  });

  it('phân công thành viên vào sự kiện', async () => {
    const res = await request(app)
      .post(`/api/events/${eventId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberId, positionId });

    expect(res.status).toBe(201);
    expect(res.body.data.eventMember.memberId).toBe(memberId);
  });

  it('từ chối phân công trùng thành viên trong cùng sự kiện', async () => {
    const res = await request(app)
      .post(`/api/events/${eventId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberId, positionId });

    expect(res.status).toBe(409);
  });

  it('lấy danh sách phân công của sự kiện', async () => {
    const res = await request(app)
      .get(`/api/events/${eventId}/members`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('cập nhật sự kiện', async () => {
    const res = await request(app)
      .put(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('hủy sự kiện', async () => {
    const res = await request(app).delete(`/api/events/${eventId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const check = await request(app)
      .get(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(check.body.data.status).toBe('CANCELLED');
  });
});

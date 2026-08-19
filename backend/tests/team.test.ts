import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { createTestUser } from './helpers';

const app = createApp();

describe('Team CRUD API', () => {
  let adminToken: string;
  let teamId: string;

  beforeAll(async () => {
    const { token } = await createTestUser({ username: 'team_admin', roleName: 'ADMIN' });
    adminToken = token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('tạo đội/nhóm mới', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Đội Test' });

    expect(res.status).toBe(201);
    teamId = res.body.data.id;
  });

  it('từ chối tạo trùng tên đội', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Đội Test' });
    expect(res.status).toBe(409);
  });

  it('cập nhật đội/nhóm', async () => {
    const res = await request(app)
      .put(`/api/teams/${teamId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Mô tả cập nhật' });
    expect(res.status).toBe(200);
    expect(res.body.data.description).toBe('Mô tả cập nhật');
  });

  it('xóa đội/nhóm khi không còn thành viên', async () => {
    const res = await request(app).delete(`/api/teams/${teamId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
  });
});

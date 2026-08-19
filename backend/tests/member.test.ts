import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { createTestUser } from './helpers';

const app = createApp();

describe('Member CRUD API', () => {
  let adminToken: string;
  let createdId: string;

  beforeAll(async () => {
    const { token } = await createTestUser({ username: 'member_admin', roleName: 'ADMIN' });
    adminToken = token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('tạo thành viên mới', async () => {
    const res = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberCode: 'MTEST01', fullName: 'Nguyễn Văn Test' });

    expect(res.status).toBe(201);
    expect(res.body.data.memberCode).toBe('MTEST01');
    createdId = res.body.data.id;
  });

  it('từ chối tạo thành viên trùng mã', async () => {
    const res = await request(app)
      .post('/api/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ memberCode: 'MTEST01', fullName: 'Trùng mã' });

    expect(res.status).toBe(409);
  });

  it('lấy danh sách thành viên', async () => {
    const res = await request(app).get('/api/members').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('lấy chi tiết thành viên', async () => {
    const res = await request(app)
      .get(`/api/members/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(createdId);
  });

  it('cập nhật thành viên', async () => {
    const res = await request(app)
      .put(`/api/members/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ fullName: 'Nguyễn Văn Test Đã Sửa' });

    expect(res.status).toBe(200);
    expect(res.body.data.fullName).toBe('Nguyễn Văn Test Đã Sửa');
  });

  it('vô hiệu hóa thành viên', async () => {
    const res = await request(app)
      .delete(`/api/members/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);

    const check = await request(app)
      .get(`/api/members/${createdId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(check.body.data.status).toBe('INACTIVE');
  });
});

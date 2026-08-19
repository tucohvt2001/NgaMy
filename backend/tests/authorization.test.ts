import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { createTestUser } from './helpers';

const app = createApp();

describe('Authorization', () => {
  let memberToken: string;

  beforeAll(async () => {
    const memberUser = await createTestUser({ username: 'authz_member', roleName: 'MEMBER' });
    memberToken = memberUser.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('từ chối truy cập không có token', async () => {
    const res = await request(app).get('/api/members');
    expect(res.status).toBe(401);
  });

  it('từ chối MEMBER tạo đội/nhóm (yêu cầu quyền team:create)', async () => {
    const res = await request(app)
      .post('/api/teams')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Đội không được phép' });

    expect(res.status).toBe(403);
  });

  it('cho phép MEMBER xem danh sách sự kiện (có quyền event:read)', async () => {
    const res = await request(app).get('/api/events').set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(200);
  });

  it('từ chối token không hợp lệ', async () => {
    const res = await request(app).get('/api/members').set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});

import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { createTestUser } from './helpers';

const app = createApp();

describe('Auth API', () => {
  beforeAll(async () => {
    await createTestUser({ username: 'auth_admin', roleName: 'ADMIN', password: 'Password@123' });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('đăng nhập thành công với đúng mật khẩu', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'auth_admin', password: 'Password@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.username).toBe('auth_admin');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('từ chối đăng nhập với sai mật khẩu', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'auth_admin', password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('trả về thông tin người dùng hiện tại với token hợp lệ', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'auth_admin', password: 'Password@123' });
    const token = login.body.data.accessToken;

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('auth_admin');
  });

  it('từ chối truy cập /auth/me khi không có token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

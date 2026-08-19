import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { createTestUser, createTestMember } from './helpers';

const app = createApp();

describe('Leave request API', () => {
  let adminToken: string;
  let memberToken: string;
  let leaveId: string;

  beforeAll(async () => {
    const admin = await createTestUser({ username: 'leave_admin', roleName: 'ADMIN' });
    adminToken = admin.token;

    const member = await createTestMember({ fullName: 'Thành viên nghỉ phép' });
    const memberUser = await createTestUser({ username: 'leave_member', roleName: 'MEMBER', memberId: member.id });
    memberToken = memberUser.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('thành viên gửi đơn nghỉ phép', async () => {
    const res = await request(app)
      .post('/api/leaves')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        fromDate: new Date(Date.now() + 86400000).toISOString(),
        toDate: new Date(Date.now() + 2 * 86400000).toISOString(),
        reason: 'Việc gia đình',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.leave.status).toBe('PENDING');
    leaveId = res.body.data.leave.id;
  });

  it('admin duyệt đơn nghỉ phép', async () => {
    const res = await request(app)
      .put(`/api/leaves/${leaveId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');
  });

  it('từ chối duyệt lại đơn đã xử lý', async () => {
    const res = await request(app)
      .put(`/api/leaves/${leaveId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(409);
  });
});

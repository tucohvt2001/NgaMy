import request from 'supertest';
import { createApp } from '../src/app';

describe('GET /api/health', () => {
  it('trả về trạng thái ok', async () => {
    const app = createApp();
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
  });
});

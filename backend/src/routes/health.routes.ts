import { Router } from 'express';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Kiểm tra trạng thái hoạt động của API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API đang hoạt động bình thường
 */
router.get('/health', (req, res) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() }, 'API is healthy');
});

export default router;

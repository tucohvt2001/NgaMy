import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { PERMISSIONS } from '../types/enums';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /dashboard/summary:
 *   get:
 *     summary: Số liệu tổng quan dashboard
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Số liệu tổng quan }
 */
router.get('/dashboard/summary', authorize(PERMISSIONS.DASHBOARD_READ), dashboardController.summary);

/**
 * @openapi
 * /dashboard/charts:
 *   get:
 *     summary: Dữ liệu biểu đồ dashboard theo năm
 *     tags: [Dashboard]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dữ liệu biểu đồ }
 */
router.get('/dashboard/charts', authorize(PERMISSIONS.DASHBOARD_READ), dashboardController.charts);

export default router;

import { Router } from 'express';
import { reportController } from '../controllers/report.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { PERMISSIONS } from '../types/enums';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /reports/members:
 *   get:
 *     summary: Báo cáo nhân sự
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Báo cáo nhân sự }
 */
router.get('/reports/members', authorize(PERMISSIONS.REPORT_READ), reportController.members);

/**
 * @openapi
 * /reports/events:
 *   get:
 *     summary: Báo cáo lịch diễn
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Báo cáo lịch diễn }
 */
router.get('/reports/events', authorize(PERMISSIONS.REPORT_READ), reportController.events);

/**
 * @openapi
 * /reports/attendance:
 *   get:
 *     summary: Báo cáo chấm công
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Báo cáo chấm công }
 */
router.get('/reports/attendance', authorize(PERMISSIONS.REPORT_READ), reportController.attendance);

/**
 * @openapi
 * /reports/salary:
 *   get:
 *     summary: Báo cáo tiền công
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Báo cáo tiền công }
 */
router.get('/reports/salary', authorize(PERMISSIONS.REPORT_READ), reportController.salary);

/**
 * @openapi
 * /reports/salary/export:
 *   get:
 *     summary: Xuất báo cáo tiền công ra Excel
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: File Excel báo cáo tiền công }
 */
router.get('/reports/salary/export', authorize(PERMISSIONS.REPORT_READ), reportController.exportSalaryExcel);

/**
 * @openapi
 * /reports/monthly-matrix:
 *   get:
 *     summary: Báo cáo ma trận đi show theo tháng
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Dữ liệu ma trận đi show }
 */
router.get('/reports/monthly-matrix', authorize(PERMISSIONS.REPORT_READ), reportController.monthlyMatrix);

/**
 * @openapi
 * /reports/monthly-matrix/export:
 *   get:
 *     summary: Xuất báo cáo ma trận đi show ra Excel
 *     tags: [Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: File Excel ma trận đi show }
 */
router.get(
  '/reports/monthly-matrix/export',
  authorize(PERMISSIONS.REPORT_READ),
  reportController.exportMatrixExcel,
);

export default router;

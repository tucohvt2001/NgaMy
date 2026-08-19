import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  checkInSchema,
  checkOutSchema,
  confirmAttendanceSchema,
} from '../validators/attendance.validator';
import { PERMISSIONS } from '../types/enums';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /attendance/check-in:
 *   post:
 *     summary: Check-in tham gia sự kiện
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Check-in thành công }
 */
router.post(
  '/attendance/check-in',
  authorize(PERMISSIONS.ATTENDANCE_CHECK),
  validate({ body: checkInSchema }),
  attendanceController.checkIn,
);

/**
 * @openapi
 * /attendance/check-out:
 *   post:
 *     summary: Check-out kết thúc tham gia sự kiện
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Check-out thành công }
 */
router.post(
  '/attendance/check-out',
  authorize(PERMISSIONS.ATTENDANCE_CHECK),
  validate({ body: checkOutSchema }),
  attendanceController.checkOut,
);

/**
 * @openapi
 * /attendance:
 *   get:
 *     summary: Danh sách chấm công
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Danh sách chấm công }
 */
router.get('/attendance', authorize(PERMISSIONS.ATTENDANCE_READ), attendanceController.list);

/**
 * @openapi
 * /attendance/{id}/confirm:
 *   put:
 *     summary: Xác nhận trạng thái chấm công
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Xác nhận thành công }
 */
router.put(
  '/attendance/:id/confirm',
  authorize(PERMISSIONS.ATTENDANCE_CONFIRM),
  validate({ body: confirmAttendanceSchema }),
  attendanceController.confirm,
);

export default router;

import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  adminBatchAttendanceSchema,
  adminRecordAttendanceSchema,
  checkInSchema,
  checkOutSchema,
  confirmAttendanceSchema,
} from '../validators/attendance.validator';
import { PERMISSIONS } from '../types/enums';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /attendance/event/{eventId}:
 *   get:
 *     summary: Lấy bảng chấm công theo sự kiện cho Admin
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 */
router.get(
  '/attendance/event/:eventId',
  authorize(PERMISSIONS.ATTENDANCE_READ),
  attendanceController.getEventSheet,
);

/**
 * @openapi
 * /attendance/record:
 *   post:
 *     summary: Admin chấm công lẻ cho một thành viên
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/attendance/record',
  authorize(PERMISSIONS.ATTENDANCE_CONFIRM),
  validate({ body: adminRecordAttendanceSchema }),
  attendanceController.recordByAdmin,
);

/**
 * @openapi
 * /attendance/batch:
 *   post:
 *     summary: Admin chấm công hàng loạt cho sự kiện
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 */
router.post(
  '/attendance/batch',
  authorize(PERMISSIONS.ATTENDANCE_CONFIRM),
  validate({ body: adminBatchAttendanceSchema }),
  attendanceController.batchRecordByAdmin,
);

/**
 * @openapi
 * /attendance/{id}:
 *   delete:
 *     summary: Xóa bản ghi chấm công
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 */
router.delete(
  '/attendance/:id',
  authorize(PERMISSIONS.ATTENDANCE_CONFIRM),
  attendanceController.remove,
);

/**
 * @openapi
 * /attendance/check-in:
 *   post:
 *     summary: Check-in tham gia sự kiện
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
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
 */
router.get('/attendance', authorize(PERMISSIONS.ATTENDANCE_READ), attendanceController.list);

/**
 * @openapi
 * /attendance/{id}/confirm:
 *   put:
 *     summary: Xác nhận trạng thái chấm công
 *     tags: [Attendance]
 *     security: [{ bearerAuth: [] }]
 */
router.put(
  '/attendance/:id/confirm',
  authorize(PERMISSIONS.ATTENDANCE_CONFIRM),
  validate({ body: confirmAttendanceSchema }),
  attendanceController.confirm,
);

export default router;

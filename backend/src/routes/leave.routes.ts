import { Router } from 'express';
import { leaveController } from '../controllers/leave.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createLeaveSchema } from '../validators/leave.validator';
import { PERMISSIONS } from '../types/enums';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /leaves:
 *   get:
 *     summary: Danh sách đơn nghỉ phép
 *     tags: [Leaves]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Danh sách đơn nghỉ }
 *   post:
 *     summary: Gửi đơn nghỉ phép
 *     tags: [Leaves]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Gửi đơn thành công }
 */
router
  .route('/leaves')
  .get(authorize(PERMISSIONS.LEAVE_READ), leaveController.list)
  .post(authorize(PERMISSIONS.LEAVE_CREATE), validate({ body: createLeaveSchema }), leaveController.create);

/**
 * @openapi
 * /leaves/{id}/approve:
 *   put:
 *     summary: Duyệt đơn nghỉ phép
 *     tags: [Leaves]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Duyệt thành công }
 */
router.put('/leaves/:id/approve', authorize(PERMISSIONS.LEAVE_APPROVE), leaveController.approve);

/**
 * @openapi
 * /leaves/{id}/reject:
 *   put:
 *     summary: Từ chối đơn nghỉ phép
 *     tags: [Leaves]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Từ chối thành công }
 */
router.put('/leaves/:id/reject', authorize(PERMISSIONS.LEAVE_APPROVE), leaveController.reject);

export default router;

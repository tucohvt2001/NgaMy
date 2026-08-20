import { Router } from 'express';
import { eventController } from '../controllers/event.controller';
import { eventMemberController } from '../controllers/eventMember.controller';
import { eventSettlementController } from '../controllers/eventSettlement.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createEventSchema, updateEventSchema } from '../validators/event.validator';
import { eventSettlementSchema } from '../validators/eventSettlement.validator';
import {
  createEventMemberSchema,
  updateEventMemberSchema,
  batchAssignMemberSchema,
} from '../validators/eventMember.validator';
import { PERMISSIONS } from '../types/enums';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /events:
 *   get:
 *     summary: Danh sách sự kiện/lịch diễn
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Danh sách sự kiện }
 *   post:
 *     summary: Tạo sự kiện mới
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Tạo thành công }
 */
router
  .route('/events')
  .get(authorize(PERMISSIONS.EVENT_READ), eventController.list)
  .post(authorize(PERMISSIONS.EVENT_CREATE), validate({ body: createEventSchema }), eventController.create);

/**
 * @openapi
 * /events/{id}:
 *   get:
 *     summary: Chi tiết sự kiện
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Chi tiết sự kiện }
 *   put:
 *     summary: Cập nhật sự kiện
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cập nhật thành công }
 *   delete:
 *     summary: Hủy sự kiện
 *     tags: [Events]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Hủy thành công }
 */
router
  .route('/events/:id')
  .get(authorize(PERMISSIONS.EVENT_READ), eventController.getById)
  .put(authorize(PERMISSIONS.EVENT_UPDATE), validate({ body: updateEventSchema }), eventController.update)
  .delete(authorize(PERMISSIONS.EVENT_DELETE), eventController.remove);

/**
 * @openapi
 * /events/{eventId}/members:
 *   get:
 *     summary: Danh sách phân công nhân sự của sự kiện
 *     tags: [Assignments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Danh sách phân công }
 *   post:
 *     summary: Phân công thành viên vào sự kiện
 *     tags: [Assignments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Phân công thành công, có thể kèm cảnh báo }
 */
router
  .route('/events/:eventId/members')
  .get(authorize(PERMISSIONS.ASSIGNMENT_READ), eventMemberController.list)
  .post(
    authorize(PERMISSIONS.ASSIGNMENT_MANAGE),
    validate({ body: createEventMemberSchema }),
    eventMemberController.assign,
  );

/**
 * @openapi
 * /events/{eventId}/members/batch:
 *   post:
 *     summary: Phân công đồng thời nhiều thành viên và vai trò vào sự kiện
 *     tags: [Assignments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Phân công nhiều thành viên thành công }
 */
router
  .route('/events/:eventId/members/batch')
  .post(
    authorize(PERMISSIONS.ASSIGNMENT_MANAGE),
    validate({ body: batchAssignMemberSchema }),
    eventMemberController.batchAssign,
  );

/**
 * @openapi
 * /events/{eventId}/members/{memberId}:
 *   put:
 *     summary: Cập nhật phân công của một thành viên trong sự kiện
 *     tags: [Assignments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cập nhật thành công }
 *   delete:
 *     summary: Hủy phân công của một thành viên trong sự kiện
 *     tags: [Assignments]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Hủy thành công }
 */
router
  .route('/events/:eventId/members/:memberId')
  .put(
    authorize(PERMISSIONS.ASSIGNMENT_MANAGE),
    validate({ body: updateEventMemberSchema }),
    eventMemberController.update,
  )
  .delete(authorize(PERMISSIONS.ASSIGNMENT_MANAGE), eventMemberController.remove);

/**
 * @openapi
 * /events/{id}/settlement:
 *   get:
 *     summary: Thông tin quyết toán show diễn
 *     tags: [Events]
 *   post:
 *     summary: Quyết toán show và tự động lập phiếu thu chi
 *     tags: [Events]
 */
router
  .route('/events/:id/settlement')
  .get(authorize(PERMISSIONS.EVENT_READ), eventSettlementController.getOverview)
  .post(
    authorize(PERMISSIONS.EVENT_UPDATE),
    validate({ body: eventSettlementSchema }),
    eventSettlementController.settle,
  );

export default router;

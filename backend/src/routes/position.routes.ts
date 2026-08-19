import { Router } from 'express';
import { positionController } from '../controllers/position.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createPositionSchema, updatePositionSchema } from '../validators/position.validator';
import { PERMISSIONS } from '../types/enums';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /positions:
 *   get:
 *     summary: Danh sách chức vụ
 *     tags: [Positions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Danh sách chức vụ }
 *   post:
 *     summary: Tạo chức vụ mới
 *     tags: [Positions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Tạo thành công }
 */
router
  .route('/positions')
  .get(authorize(PERMISSIONS.POSITION_READ), positionController.list)
  .post(authorize(PERMISSIONS.POSITION_CREATE), validate({ body: createPositionSchema }), positionController.create);

/**
 * @openapi
 * /positions/{id}:
 *   get:
 *     summary: Chi tiết chức vụ
 *     tags: [Positions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Chi tiết chức vụ }
 *   put:
 *     summary: Cập nhật chức vụ
 *     tags: [Positions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cập nhật thành công }
 *   delete:
 *     summary: Xóa chức vụ
 *     tags: [Positions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Xóa thành công }
 */
router
  .route('/positions/:id')
  .get(authorize(PERMISSIONS.POSITION_READ), positionController.getById)
  .put(authorize(PERMISSIONS.POSITION_UPDATE), validate({ body: updatePositionSchema }), positionController.update)
  .delete(authorize(PERMISSIONS.POSITION_DELETE), positionController.remove);

export default router;

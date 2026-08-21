import { Router } from 'express';
import { memberController } from '../controllers/member.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createMemberSchema, updateMemberSchema } from '../validators/member.validator';
import { PERMISSIONS } from '../types/enums';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /members:
 *   get:
 *     summary: Danh sách thành viên (tìm kiếm, filter, phân trang)
 *     tags: [Members]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: teamId
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Danh sách thành viên }
 *   post:
 *     summary: Tạo thành viên mới
 *     tags: [Members]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Tạo thành công }
 */
router
  .route('/members')
  .get(authorize(PERMISSIONS.MEMBER_READ), memberController.list)
  .post(authorize(PERMISSIONS.MEMBER_CREATE), validate({ body: createMemberSchema }), memberController.create);

router.get('/members/stats', authorize(PERMISSIONS.MEMBER_READ), memberController.stats);

/**
 * @openapi
 * /members/{id}:
 *   get:
 *     summary: Chi tiết thành viên
 *     tags: [Members]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Chi tiết thành viên }
 *   put:
 *     summary: Cập nhật thành viên
 *     tags: [Members]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cập nhật thành công }
 *   delete:
 *     summary: Vô hiệu hóa thành viên
 *     tags: [Members]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Vô hiệu hóa thành công }
 */
router
  .route('/members/:id')
  .get(authorize(PERMISSIONS.MEMBER_READ), memberController.getById)
  .put(authorize(PERMISSIONS.MEMBER_UPDATE), validate({ body: updateMemberSchema }), memberController.update)
  .delete(authorize(PERMISSIONS.MEMBER_DELETE), memberController.remove);

export default router;

import { Router } from 'express';
import { teamController } from '../controllers/team.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createTeamSchema, updateTeamSchema } from '../validators/team.validator';
import { PERMISSIONS } from '../types/enums';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /teams:
 *   get:
 *     summary: Danh sách đội/nhóm
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Danh sách đội/nhóm }
 *   post:
 *     summary: Tạo đội/nhóm mới
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Tạo thành công }
 */
router
  .route('/teams')
  .get(authorize(PERMISSIONS.TEAM_READ), teamController.list)
  .post(authorize(PERMISSIONS.TEAM_CREATE), validate({ body: createTeamSchema }), teamController.create);

/**
 * @openapi
 * /teams/{id}:
 *   get:
 *     summary: Chi tiết đội/nhóm
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Chi tiết đội/nhóm }
 *   put:
 *     summary: Cập nhật đội/nhóm
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cập nhật thành công }
 *   delete:
 *     summary: Xóa đội/nhóm
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Xóa thành công }
 */
router
  .route('/teams/:id')
  .get(authorize(PERMISSIONS.TEAM_READ), teamController.getById)
  .put(authorize(PERMISSIONS.TEAM_UPDATE), validate({ body: updateTeamSchema }), teamController.update)
  .delete(authorize(PERMISSIONS.TEAM_DELETE), teamController.remove);

/**
 * @openapi
 * /teams/{id}/members:
 *   get:
 *     summary: Danh sách thành viên của đội/nhóm
 *     tags: [Teams]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Danh sách thành viên }
 */
router.get('/teams/:id/members', authorize(PERMISSIONS.TEAM_READ), teamController.getMembers);

export default router;

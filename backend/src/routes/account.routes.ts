import { Router } from 'express';
import { accountController } from '../controllers/account.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createAccountSchema, updateAccountSchema } from '../validators/account.validator';
import { PERMISSIONS } from '../types/enums';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /accounts:
 *   get:
 *     summary: Danh sách tài khoản
 *     tags: [Accounts]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Danh sách tài khoản }
 *   post:
 *     summary: Tạo tài khoản mới
 *     tags: [Accounts]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Tạo tài khoản thành công }
 */
router
  .route('/accounts')
  .get(authorize(PERMISSIONS.ACCOUNT_READ), accountController.list)
  .post(authorize(PERMISSIONS.ACCOUNT_CREATE), validate({ body: createAccountSchema }), accountController.create);

/**
 * @openapi
 * /accounts/{id}:
 *   put:
 *     summary: Cập nhật tài khoản
 *     tags: [Accounts]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cập nhật thành công }
 *   delete:
 *     summary: Vô hiệu hóa tài khoản
 *     tags: [Accounts]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Vô hiệu hóa thành công }
 */
router
  .route('/accounts/:id')
  .put(authorize(PERMISSIONS.ACCOUNT_UPDATE), validate({ body: updateAccountSchema }), accountController.update)
  .delete(authorize(PERMISSIONS.ACCOUNT_DELETE), accountController.remove);

/**
 * @openapi
 * /roles:
 *   get:
 *     summary: Danh sách vai trò (dùng cho dropdown)
 *     tags: [Accounts]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Danh sách vai trò }
 */
router.get(
  '/roles',
  authorize(PERMISSIONS.ACCOUNT_READ),
  asyncHandler(async (_req, res) => {
    const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
    sendSuccess(res, roles);
  }),
);

export default router;

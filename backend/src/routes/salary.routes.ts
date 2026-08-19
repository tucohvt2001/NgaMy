import { Router } from 'express';
import { salaryController, salaryConfigController } from '../controllers/salary.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  calculateSalarySchema,
  createSalaryConfigSchema,
  updateSalaryConfigSchema,
} from '../validators/salary.validator';
import { PERMISSIONS } from '../types/enums';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /salaries:
 *   get:
 *     summary: Danh sách bảng lương
 *     tags: [Salaries]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Danh sách bảng lương }
 */
router.get('/salaries', authorize(PERMISSIONS.SALARY_READ), salaryController.list);

/**
 * @openapi
 * /salaries/configs:
 *   get:
 *     summary: Danh sách cấu hình mức tiền công
 *     tags: [Salaries]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Danh sách cấu hình }
 *   post:
 *     summary: Tạo cấu hình mức tiền công theo Position/Member/Event
 *     tags: [Salaries]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Tạo thành công }
 */
router
  .route('/salaries/configs')
  .get(authorize(PERMISSIONS.SALARY_READ), salaryConfigController.list)
  .post(
    authorize(PERMISSIONS.SALARY_MANAGE),
    validate({ body: createSalaryConfigSchema }),
    salaryConfigController.create,
  );

router
  .route('/salaries/configs/:id')
  .put(
    authorize(PERMISSIONS.SALARY_MANAGE),
    validate({ body: updateSalaryConfigSchema }),
    salaryConfigController.update,
  )
  .delete(authorize(PERMISSIONS.SALARY_MANAGE), salaryConfigController.remove);

/**
 * @openapi
 * /salaries/{id}:
 *   get:
 *     summary: Chi tiết bảng lương
 *     tags: [Salaries]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Chi tiết bảng lương }
 */
router.get('/salaries/:id', authorize(PERMISSIONS.SALARY_READ), salaryController.getById);

/**
 * @openapi
 * /salaries/calculate:
 *   post:
 *     summary: Tính tiền công cho thành viên theo tháng
 *     tags: [Salaries]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Tính tiền công thành công }
 */
router.post(
  '/salaries/calculate',
  authorize(PERMISSIONS.SALARY_MANAGE),
  validate({ body: calculateSalarySchema }),
  salaryController.calculate,
);

/**
 * @openapi
 * /salaries/{id}/confirm:
 *   post:
 *     summary: Xác nhận bảng lương
 *     tags: [Salaries]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Xác nhận thành công }
 */
router.post('/salaries/:id/confirm', authorize(PERMISSIONS.SALARY_MANAGE), salaryController.confirm);

export default router;

import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import {
  createTransactionSchema,
  queryTransactionSchema,
  updateTransactionSchema,
} from '../validators/transaction.validator';
import { PERMISSIONS } from '../types/enums';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /transactions:
 *   get:
 *     summary: Danh sách giao dịch thu chi
 *     tags: [Transactions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Danh sách giao dịch }
 *   post:
 *     summary: Tạo phiếu thu / phiếu chi mới
 *     tags: [Transactions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Tạo phiếu thành công }
 */
router
  .route('/transactions')
  .get(
    authorize(PERMISSIONS.FINANCE_READ),
    validate({ query: queryTransactionSchema }),
    transactionController.list,
  )
  .post(
    authorize(PERMISSIONS.FINANCE_MANAGE),
    validate({ body: createTransactionSchema }),
    transactionController.create,
  );

/**
 * @openapi
 * /transactions/summary:
 *   get:
 *     summary: Thống kê tổng hợp sổ quỹ thu chi
 *     tags: [Transactions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Thống kê thu chi }
 */
router.get(
  '/transactions/summary',
  authorize(PERMISSIONS.FINANCE_READ),
  transactionController.summary,
);

/**
 * @openapi
 * /transactions/export/excel:
 *   get:
 *     summary: Xuất file Excel sổ quỹ thu chi
 *     tags: [Transactions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: File Excel sổ quỹ }
 */
router.get(
  '/transactions/export/excel',
  authorize(PERMISSIONS.FINANCE_READ),
  validate({ query: queryTransactionSchema }),
  transactionController.exportExcel,
);

/**
 * @openapi
 * /transactions/{id}:
 *   get:
 *     summary: Chi tiết phiếu thu / phiếu chi
 *     tags: [Transactions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Chi tiết giao dịch }
 *   put:
 *     summary: Cập nhật phiếu thu / chi
 *     tags: [Transactions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Cập nhật thành công }
 *   delete:
 *     summary: Xóa phiếu thu / chi
 *     tags: [Transactions]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Xóa thành công }
 */
router
  .route('/transactions/:id')
  .get(authorize(PERMISSIONS.FINANCE_READ), transactionController.getById)
  .put(
    authorize(PERMISSIONS.FINANCE_MANAGE),
    validate({ body: updateTransactionSchema }),
    transactionController.update,
  )
  .delete(authorize(PERMISSIONS.FINANCE_MANAGE), transactionController.remove);

export default router;

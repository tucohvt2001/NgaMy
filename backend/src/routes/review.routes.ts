import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createReviewSchema, listReviewsQuerySchema } from '../validators/review.validator';
import { PERMISSIONS } from '../types/enums';

const router = Router();

// ============ PUBLIC ROUTES (Khách hàng không cần đăng nhập) ============

// Lấy thông tin show để khách đánh giá
router.get('/public/events/:id/review-info', reviewController.getPublicEventReviewInfo);

// Khách hàng gửi form đánh giá
router.post(
  '/public/events/:id/reviews',
  validate({ body: createReviewSchema }),
  reviewController.createPublicReview,
);

// ============ PROTECTED ROUTES (Quản trị viên / Đoàn xem báo cáo) ============

router.get(
  '/reviews',
  authenticate,
  authorize(PERMISSIONS.EVENT_READ),
  validate({ query: listReviewsQuerySchema }),
  reviewController.list,
);

router.get(
  '/events/:eventId/reviews',
  authenticate,
  authorize(PERMISSIONS.EVENT_READ),
  reviewController.getByEvent,
);

export default router;

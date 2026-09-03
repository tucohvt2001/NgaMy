import { Request, Response } from 'express';
import { reviewService } from '../services/review.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const reviewController = {
  // Public: Lấy thông tin show để khách hàng đánh giá
  getPublicEventReviewInfo: asyncHandler(async (req: Request, res: Response) => {
    const info = await reviewService.getPublicEventReviewInfo(req.params.id);
    sendSuccess(res, info);
  }),

  // Public: Khách hàng gửi đánh giá
  createPublicReview: asyncHandler(async (req: Request, res: Response) => {
    const result = await reviewService.createPublicReview(req.params.id, req.body);
    sendSuccess(res, result, 'Gửi đánh giá thành công', 201);
  }),

  // Protected: Danh sách toàn bộ đánh giá
  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await reviewService.listReviews(req.query as any);
    sendSuccess(res, data);
  }),

  // Protected: Đánh giá theo sự kiện
  getByEvent: asyncHandler(async (req: Request, res: Response) => {
    const items = await reviewService.getEventReviews(req.params.eventId);
    sendSuccess(res, items);
  }),
};

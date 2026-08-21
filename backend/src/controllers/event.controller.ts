import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { eventService } from '../services/event.service';
import { AppError } from '../utils/AppError';

export const eventController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await eventService.list(req.query as never);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const event = await eventService.getById(req.params.id);
    sendSuccess(res, event);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw AppError.unauthorized('Chưa xác thực');
    const event = await eventService.create(req.body, req.user.id);
    sendSuccess(res, event, 'Tạo sự kiện thành công', 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const event = await eventService.update(req.params.id, req.body);
    sendSuccess(res, event, 'Cập nhật sự kiện thành công');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await eventService.cancel(req.params.id);
    sendSuccess(res, null, 'Hủy sự kiện thành công');
  }),

  stats: asyncHandler(async (req: Request, res: Response) => {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const stats = await eventService.getStats(year);
    sendSuccess(res, stats, 'Lấy thống kê biểu đồ lịch diễn thành công');
  }),
};

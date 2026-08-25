import { Request, Response } from 'express';
import { eventTypeService } from '../services/eventType.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const eventTypeController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { isActive, search } = req.query;
    const items = await eventTypeService.list({
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      search: search as string | undefined,
    });
    sendSuccess(res, items);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const item = await eventTypeService.getById(req.params.id);
    sendSuccess(res, item);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await eventTypeService.create(req.body);
    sendSuccess(res, item, 'Tạo loại show diễn thành công', 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await eventTypeService.update(req.params.id, req.body);
    sendSuccess(res, item, 'Cập nhật loại show diễn thành công');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await eventTypeService.remove(req.params.id);
    sendSuccess(res, null, 'Xóa loại show diễn thành công');
  }),
};

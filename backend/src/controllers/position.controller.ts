import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { positionService } from '../services/position.service';

export const positionController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const positions = await positionService.list();
    sendSuccess(res, positions);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const position = await positionService.getById(req.params.id);
    sendSuccess(res, position);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const position = await positionService.create(req.body);
    sendSuccess(res, position, 'Tạo chức vụ thành công', 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const position = await positionService.update(req.params.id, req.body);
    sendSuccess(res, position, 'Cập nhật chức vụ thành công');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await positionService.remove(req.params.id);
    sendSuccess(res, null, 'Xóa chức vụ thành công');
  }),
};

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { memberService } from '../services/member.service';

export const memberController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await memberService.list(req.query as never);
    sendSuccess(res, result);
  }),

  stats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await memberService.getStats();
    sendSuccess(res, stats);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const member = await memberService.getById(req.params.id);
    sendSuccess(res, member);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const member = await memberService.create(req.body);
    sendSuccess(res, member, 'Tạo thành viên thành công', 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const member = await memberService.update(req.params.id, req.body);
    sendSuccess(res, member, 'Cập nhật thành viên thành công');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await memberService.remove(req.params.id);
    sendSuccess(res, null, 'Vô hiệu hóa thành viên thành công');
  }),
};

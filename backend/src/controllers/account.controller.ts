import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { accountService } from '../services/account.service';

export const accountController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await accountService.list(page, limit);
    sendSuccess(res, result);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const account = await accountService.create(req.body);
    sendSuccess(res, account, 'Tạo tài khoản thành công', 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const account = await accountService.update(req.params.id, req.body);
    sendSuccess(res, account, 'Cập nhật tài khoản thành công');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await accountService.remove(req.params.id);
    sendSuccess(res, null, 'Vô hiệu hóa tài khoản thành công');
  }),
};

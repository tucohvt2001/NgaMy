import { Request, Response } from 'express';
import { bankService } from '../services/bank.service';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';

export const bankController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const transferOnly = req.query.transferOnly === 'true';
    const banks = await bankService.list({ search, transferOnly });
    sendSuccess(res, banks, 'Lấy danh sách ngân hàng thành công');
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const bank = await bankService.getById(req.params.id);
    sendSuccess(res, bank, 'Lấy thông tin ngân hàng thành công');
  }),

  sync: asyncHandler(async (req: Request, res: Response) => {
    const banks = await bankService.sync();
    sendSuccess(res, banks, 'Đồng bộ danh sách ngân hàng VietQR thành công');
  }),
};

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { salaryService, salaryConfigService } from '../services/salary.service';
import { AppError } from '../utils/AppError';

export const salaryController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await salaryService.list(req.query as never);
    sendSuccess(res, result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const record = await salaryService.getById(req.params.id);
    sendSuccess(res, record);
  }),

  calculate: asyncHandler(async (req: Request, res: Response) => {
    const record = await salaryService.calculate(req.body);
    sendSuccess(res, record, 'Tính tiền công thành công', 201);
  }),

  confirm: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw AppError.unauthorized('Chưa xác thực');
    const record = await salaryService.confirm(req.params.id, req.user.id);
    sendSuccess(res, record, 'Xác nhận bảng lương thành công');
  }),
};

export const salaryConfigController = {
  list: asyncHandler(async (_req: Request, res: Response) => {
    const configs = await salaryConfigService.list();
    sendSuccess(res, configs);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const config = await salaryConfigService.create(req.body);
    sendSuccess(res, config, 'Tạo cấu hình tiền công thành công', 201);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const config = await salaryConfigService.update(req.params.id, req.body);
    sendSuccess(res, config, 'Cập nhật cấu hình tiền công thành công');
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await salaryConfigService.remove(req.params.id);
    sendSuccess(res, null, 'Xóa cấu hình tiền công thành công');
  }),
};

import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { leaveService } from '../services/leave.service';
import { AppError } from '../utils/AppError';

export const leaveController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await leaveService.list(req.query as never);
    sendSuccess(res, result);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.memberId) throw AppError.badRequest('Tài khoản chưa liên kết với thành viên');
    const result = await leaveService.create(req.user.memberId, req.body);
    sendSuccess(res, result, 'Gửi đơn nghỉ thành công', 201);
  }),

  approve: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw AppError.unauthorized('Chưa xác thực');
    const leave = await leaveService.approve(req.params.id, req.user.id);
    sendSuccess(res, leave, 'Duyệt đơn nghỉ thành công');
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw AppError.unauthorized('Chưa xác thực');
    const leave = await leaveService.reject(req.params.id, req.user.id);
    sendSuccess(res, leave, 'Từ chối đơn nghỉ thành công');
  }),
};

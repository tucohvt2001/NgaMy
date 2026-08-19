import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { attendanceService } from '../services/attendance.service';
import { AppError } from '../utils/AppError';

export const attendanceController = {
  checkIn: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.memberId) throw AppError.badRequest('Tài khoản chưa liên kết với thành viên');
    const attendance = await attendanceService.checkIn(req.user.memberId, req.body.eventId);
    sendSuccess(res, attendance, 'Check-in thành công', 201);
  }),

  checkOut: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user?.memberId) throw AppError.badRequest('Tài khoản chưa liên kết với thành viên');
    const attendance = await attendanceService.checkOut(req.user.memberId, req.body.eventId);
    sendSuccess(res, attendance, 'Check-out thành công');
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const result = await attendanceService.list(req.query as never);
    sendSuccess(res, result);
  }),

  confirm: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw AppError.unauthorized('Chưa xác thực');
    const attendance = await attendanceService.confirm(req.params.id, req.user.id, req.body);
    sendSuccess(res, attendance, 'Xác nhận chấm công thành công');
  }),
};

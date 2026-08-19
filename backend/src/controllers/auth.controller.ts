import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { sendSuccess } from '../utils/apiResponse';
import { authService } from '../services/auth.service';
import { AppError } from '../utils/AppError';

export const authController = {
  login: asyncHandler(async (req: Request, res: Response) => {
    const { identifier, password } = req.body;
    const result = await authService.login(identifier, password);
    sendSuccess(res, result, 'Đăng nhập thành công');
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    sendSuccess(res, result, 'Làm mới token thành công');
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized('Chưa xác thực');
    }
    await authService.logout(req.user.id);
    sendSuccess(res, null, 'Đăng xuất thành công');
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw AppError.unauthorized('Chưa xác thực');
    }
    const profile = await authService.me(req.user.id);
    sendSuccess(res, profile, 'Success');
  }),
};

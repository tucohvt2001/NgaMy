import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { PermissionCode } from '../types/enums';

// Kiểm tra người dùng có ít nhất một trong các permission được yêu cầu
// Backend luôn kiểm tra permission ở đây, không chỉ dựa vào việc ẩn/hiện menu ở frontend
export function authorize(...requiredPermissions: PermissionCode[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(AppError.unauthorized('Chưa xác thực'));
      return;
    }

    const hasPermission = requiredPermissions.some((permission) =>
      req.user!.permissions.includes(permission),
    );

    if (!hasPermission) {
      next(AppError.forbidden('Bạn không có quyền thực hiện hành động này'));
      return;
    }

    next();
  };
}

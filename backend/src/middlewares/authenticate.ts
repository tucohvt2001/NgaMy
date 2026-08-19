import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { verifyAccessToken, toAuthUser } from '../utils/jwt';

// Xác thực JWT access token từ header Authorization: Bearer <token>
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(AppError.unauthorized('Thiếu token xác thực'));
    return;
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.user = toAuthUser(payload);
    next();
  } catch {
    next(AppError.unauthorized('Token không hợp lệ hoặc đã hết hạn'));
  }
}

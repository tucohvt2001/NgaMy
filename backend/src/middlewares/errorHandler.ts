import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';
import { logger } from '../config/logger';

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, `Không tìm thấy route: ${req.method} ${req.originalUrl}`, 404);
}

// Central error handler: must be registered last, after all routes
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err);
    }
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  logger.error(err);
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  sendError(res, message, 500);
}

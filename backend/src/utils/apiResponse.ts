import { Response } from 'express';

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  message: string;
  errors: unknown[];
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200,
): Response<ApiSuccessResponse<T>> {
  return res.status(statusCode).json({ success: true, data, message });
}

export function sendError(
  res: Response,
  message = 'Error',
  statusCode = 500,
  errors: unknown[] = [],
): Response<ApiErrorResponse> {
  return res.status(statusCode).json({ success: false, data: null, message, errors });
}

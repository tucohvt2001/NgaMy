// Custom application error carrying an HTTP status code, used by the central error handler
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: unknown[];

  constructor(message: string, statusCode = 500, errors: unknown[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  static badRequest(message = 'Bad Request', errors: unknown[] = []): AppError {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(message, 403);
  }

  static notFound(message = 'Not Found'): AppError {
    return new AppError(message, 404);
  }

  static conflict(message = 'Conflict'): AppError {
    return new AppError(message, 409);
  }
}

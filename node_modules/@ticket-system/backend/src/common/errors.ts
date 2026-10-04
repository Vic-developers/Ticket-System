export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = 'INTERNAL_ERROR',
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'No autorizado') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message: string = 'Acceso denegado') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(message: string = 'Recurso no encontrado') {
    return new AppError(message, 404, 'NOT_FOUND');
  }

  static conflict(message: string, details?: unknown) {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static validationError(message: string, details?: unknown) {
    return new AppError(message, 422, 'VALIDATION_ERROR', details);
  }

  static internal(message: string = 'Error interno del servidor') {
    return new AppError(message, 500, 'INTERNAL_ERROR');
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public readonly errors: Record<string, string[]> = {}) {
    super(message, 422, 'VALIDATION_ERROR', errors);
    this.name = 'ValidationError';
  }
}
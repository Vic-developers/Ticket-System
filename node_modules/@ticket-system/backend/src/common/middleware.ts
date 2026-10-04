import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ValidationError } from './errors.js';
import { config } from '../config/index.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const path = e.path.join('.');
      if (!errors[path]) errors[path] = [];
      errors[path].push(e.message);
    });
    return res.status(422).json({
      success: false,
      error: 'Validation Error',
      message: 'Datos de entrada inválidos',
      details: errors,
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.code,
      message: err.message,
      details: err.details,
    });
  }

  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Token inválido o expirado',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'TOKEN_EXPIRED',
      message: 'Token expirado',
    });
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      const field = prismaErr.meta?.target?.[0] || 'campo';
      return res.status(409).json({
        success: false,
        error: 'CONFLICT',
        message: `Ya existe un registro con este ${field}`,
        details: { field },
      });
    }
    if (prismaErr.code === 'P2025') {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Registro no encontrado',
      });
    }
  }

  // Default error
  const statusCode = config.env === 'production' ? 500 : 500;
  const message = config.env === 'production' ? 'Error interno del servidor' : err.message;

  return res.status(statusCode).json({
    success: false,
    error: 'INTERNAL_ERROR',
    message,
    ...(config.env !== 'production' && { stack: err.stack }),
  });
};

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Ruta no encontrada',
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const validate = (schema: any) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw new ValidationError('Datos de entrada inválidos', err.flatten().fieldErrors);
      }
      next(err);
    }
  };
};

export const validateQuery = (schema: any) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw new ValidationError('Parámetros de consulta inválidos', err.flatten().fieldErrors);
      }
      next(err);
    }
  };
};

export const validateParams = (schema: any) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw new ValidationError('Parámetros de ruta inválidos', err.flatten().fieldErrors);
      }
      next(err);
    }
  };
};
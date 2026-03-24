import type { Request, Response, NextFunction } from 'express';
import { CatalogError } from '../error.js';

export interface ErrorHandlerOptions {
  onError?: (error: unknown, req: Request) => void;
}

export function errorHandler(options: ErrorHandlerOptions = {}) {
  return (
    error: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
  ): void => {
    if (options.onError) {
      options.onError(error, req);
    }

    if (error instanceof CatalogError) {
      res.status(error.status).json({
        code: error.code,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  };
}

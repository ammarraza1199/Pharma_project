import { Request, Response, NextFunction } from 'express';

interface AppError extends Error {
  statusCode?: number;
  code?: number;
}

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    message = 'Duplicate entry. Resource already exists.';
  }

  // MongoDB CastError (bad ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format.';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired.';
  }

  console.error(`[ERROR] ${req.method} ${req.path} → ${statusCode}: ${message}`);
  
  try {
    require('fs').appendFileSync('error.log', `[ERROR] ${new Date().toISOString()} ${req.method} ${req.path} → ${statusCode}: ${message}\n${err.stack}\n\n`);
  } catch (e) {}

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  const err: AppError = new Error(`Route not found: ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

import { Request, Response, NextFunction } from "express";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[ERROR] ${statusCode} - ${message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  res.status(statusCode).json({
    error: err.name || "Error",
    message,
    details: [],
    timestamp: new Date().toISOString(),
  });
};

export class ValidationError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class ResourceLimitError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = "ResourceLimitError";
  }
}

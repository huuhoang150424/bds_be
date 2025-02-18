import { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError, UnauthorizedError, TokenError } from '../helper';

const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  if (err instanceof NotFoundError) {
    return res.status(err.status || 404).json({
      message: err.message,
      status: err.status || 404,
    });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(err.status || 401).json({
      message: err.message,
      status: err.status || 401,
    });
  }

  if (err instanceof TokenError) {
    return res.status(err.status || 401).json({
      message: err.message,
      status: err.status || 401,
    });
  }

  if (err instanceof ValidationError) {
    return res.status(err.status || 400).json({
      message: err.message,
      status: err.status || 400,
    });
  }

  console.error(err);  
  return res.status(500).json({
    message: 'Internal server error',
    status: 500,
  });
};

export default errorMiddleware;

import { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError, UnauthorizedError, TokenError, BadRequestError, ForbiddenError } from '@helper';
import {ApiResponse} from "@helper";
const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  let message: string;
  let status: number;

  if (err instanceof NotFoundError) {
    message = err.message;
    status = err.status || 404;
  } else if (err instanceof UnauthorizedError || err instanceof TokenError) {
    message = err.message;
    status = err.status || 401;
  } else if (err instanceof ForbiddenError) {
    message = err.message;
    status = err.status || 403;
  } else if (err instanceof ValidationError || err instanceof BadRequestError) {
    message = err.message;
    status = err.status || 400;
  } else {
    console.error(err);
    message = 'Internal server error';
    status = 500;
  }

  return res.status(status).json(ApiResponse.error(message, status));
};

export default errorMiddleware;

import { Request, Response, NextFunction } from "express";

export const paginationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  let { page, limit } = req.query;
  const pageNumber = Math.max(Number(page) || 1, 1);
  const limitNumber = Math.max(Number(limit) || 10, 1);
  const offset = (pageNumber - 1) * limitNumber;
	(req as any).pagination = { page: pageNumber, limit: limitNumber, offset };
  next();
};


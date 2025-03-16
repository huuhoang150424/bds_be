import { Request, Response, NextFunction } from "express";

export const paginationMiddleware = (req: Request, res: Response, next: NextFunction) => {
  let { page, limit } = req.query;
  const pageNumber =Number(page) || 1;
  const limitNumber = Number(limit) || 10;
  const offset = (pageNumber - 1) * limitNumber;
	(req as any).pagination = { page: pageNumber, limit: limitNumber, offset };
  next();
};


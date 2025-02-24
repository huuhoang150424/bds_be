
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import "dotenv/config";
import { TokenError,ForbiddenError } from '@helper';
import { CacheRepository } from '@helper';
import {ApiResponse} from '@helper'

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json(ApiResponse.error("Token không hợp lệ", 401));
    }
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_KEY!) as any;
    } catch (err) {
      throw new TokenError("Token không hợp lệ hoặc đã hết hạn", 401);
    }
    (req as any).user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};

const verifyRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await verifyToken(req, res, () => {});
      const user = (req as any).user;
      if (!user) {
        return next(new ForbiddenError("Bạn chưa đăng nhập"));
      }
      if (roles.includes(user.role) || user.role === "Admin") {
        return next();
      }
      next(new ForbiddenError("Bạn không có quyền"));
    } catch (err) {
      next(err);
    }
  };
};




export {
	verifyToken,
	verifyRole
}
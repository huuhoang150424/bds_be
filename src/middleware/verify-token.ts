
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { TokenError,ForbiddenError } from '@helper';
import { CacheRepository } from '@helper';
dotenv.config({ path: '.env.local' });
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
		const rawSession = await CacheRepository.get(`session:${decoded.sessionId}`);
		const sessionExists = rawSession?.replace(/^"|"$/g, ''); 
		if (!sessionExists || sessionExists !== decoded.userId) {
			return res.status(401).json(ApiResponse.error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn", 401));
		}
    (req as any).user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};




const verifyAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyToken(req, res, () => {});

    if ((req as any).user && (req as any).user.role === "Admin") {
      next();
    } else {
      next(new ForbiddenError("Bạn không có quyền"));
    }
  } catch (err) {
    next(err); 
  }
};


const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyToken(req, res, () => {}); 

    const user = (req as any).user;
		console.log(user)
    if (user.role === "User" || user.role === "Agent" || user.role === "Admin") {
      next();
    } else {
      next(new ForbiddenError("Bạn không có quyền"));
    }
  } catch (err) {
    next(err);
  }
};


const verifyAgent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await verifyToken(req, res, () => {}); 
    const user = (req as any).user;
    if (user.role === "Agent" || user.role === "Admin") {
      next();
    } else {
      next(new ForbiddenError("Bạn không có quyền"));
    }
  } catch (err) {
    next(err);
  }
};



export {
	verifyToken,
	verifyAdmin,
	verifyUser,
	verifyAgent
}
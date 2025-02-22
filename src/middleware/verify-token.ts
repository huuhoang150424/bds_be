import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { TokenError,ForbiddenError } from '@helper';
dotenv.config({ path: '.env.local' });


const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new TokenError('token không hợp lệ', 401);
  }
  const token = authHeader.split(' ')[1]; 
  jwt.verify(token,  process.env.ACCESS_TOKEN_KEY!, (err: any, user: any) => {
    if (err) {
			throw new TokenError('token không hợp lệ', 401);
    }
    (req as any).user = user; 
    next(); 
  });
};

const verifyAdmin=(req: Request, res: Response, next: NextFunction)=>{
	verifyToken(req, res,()=>{
		if ((req as any).user  &&  (req as any).user.role==="Admin") {
			next();
		} else {
			throw new ForbiddenError('Bạn không có quyền');
		}
	})
}

const verifyUser=(req: Request, res: Response, next: NextFunction)=>{
	verifyToken(req, res,()=>{
		if ((req as any).user  &&  (req as any).user.role==="User") {
			next();
		} else {
			throw new ForbiddenError('Bạn không có quyền ');
		}
	})
}

const verifyAgent=(req: Request, res: Response, next: NextFunction)=>{
	verifyToken(req, res,()=>{
		if ((req as any).user  &&  (req as any).user.role==="Agent") {
			next();
		} else {
			throw new ForbiddenError('Bạn không có quyền ');
		}
	})
}

export {
	verifyToken,
	verifyAdmin,
	verifyUser,
	verifyAgent
}
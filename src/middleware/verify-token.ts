import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { TokenError } from '../helper';
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
	verifyToken(req, res,()=>{})
}

const verifyUser=(req: Request, res: Response, next: NextFunction)=>{
	verifyToken(req, res,()=>{})
}

const verifyAgent=(req: Request, res: Response, next: NextFunction)=>{
	verifyToken(req, res,()=>{})
}

export {
	verifyToken,
	verifyAdmin,
	verifyUser,
	verifyAgent
}
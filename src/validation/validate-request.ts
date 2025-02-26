import {  validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '@helper';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		throw new ValidationError(errors, 400);
	}
	next();
};
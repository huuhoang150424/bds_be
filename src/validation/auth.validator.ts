import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import {ValidationError} from '../helper'; 

const validatorLogin = [
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isString()
    .withMessage('Email must be a string')
    .isLength({ min: 6, max: 15 })
    .withMessage('Email must be between 6 and 15 characters'),
  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isString()
    .withMessage('Password must be a string')
    .isLength({ min: 6, max: 15 })
    .withMessage('Password must be between 6 and 15 characters'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors,400);
    }
    next(); 
  },
];
const validatorRegister = [
  check('name')
    .notEmpty()
    .withMessage('Username is required')
    .isString()
    .withMessage('Username must be a string')
    .isLength({ min: 6, max: 15 })
    .withMessage('Username must be between 6 and 15 characters'),
  check('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address'),
  check('password')
    .notEmpty()
    .withMessage('Password is required')
    .isString()
    .withMessage('Password must be a string')
    .isLength({ min: 6, max: 15 })
    .withMessage('Password must be between 6 and 15 characters'),
  check('confirmPassword')
    .notEmpty()
    .withMessage('Confirm password is required')
    .isString()
    .withMessage('Confirm password must be a string')
    .isLength({ min: 6, max: 15 })
    .withMessage('Confirm password must be between 6 and 15 characters'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ValidationError(errors, 400);
    }
    next();
  },
];
export {
  validatorLogin,
  validatorRegister
};

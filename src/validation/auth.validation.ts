import { check } from 'express-validator';
import { validateRequest } from './validate-request';


const validatorLogin = [
  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),

  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6, max: 15 })
    .withMessage('Password must be between 6 and 15 characters'),

  validateRequest,
];

const validatorRegister = [
  check('fullname')
    .trim()
    .notEmpty()
    .withMessage('fullname is required')
    .isLength({ min: 6, max: 15 })
    .withMessage('fullname must be between 6 and 15 characters'),

  check('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),

  check('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6, max: 15 })
    .withMessage('Password must be between 6 and 15 characters'),

  check('confirmPassword')
    .trim()
    .notEmpty()
    .withMessage('Confirm password is required')
    .isLength({ min: 6, max: 15 })
    .withMessage('Confirm password must be between 6 and 15 characters')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Confirm password must match password');
      }
      return true;
    }),
  validateRequest,
];

export { validatorLogin, validatorRegister };

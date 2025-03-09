import { check, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '@helper';
import { CategoryNew } from  "@models/enums";
import {validateRequest} from "./validate-request";

const validatorCreateNews = [
  check('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 10, max: 255 })
    .withMessage('Title must be between 10 and 255 characters'),

  check('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters'),

  check('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(Object.values(CategoryNew)) 
    .withMessage(`Category must be one of: ${Object.values(CategoryNew).join(', ')}`),

  check('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),

  check('readingTime')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Reading time must be between 1 and 120 minutes'),

  validateRequest,
];

const validatorUpdateNews = [
  check('title')
    .optional()
    .trim()
    .isLength({ min: 10, max: 255 })
    .withMessage('Title must be between 10 and 255 characters'),

  check('content')
    .optional()
    .trim()
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters'),

  check('category')
    .optional()
    .isIn(Object.values(CategoryNew))
    .withMessage(`Category must be one of: ${Object.values(CategoryNew).join(', ')}`),

  check('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),

  check('readingTime')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Reading time must be between 1 and 120 minutes'),

  validateRequest,
];

export { validatorCreateNews, validatorUpdateNews };

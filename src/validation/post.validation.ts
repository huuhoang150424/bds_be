import { check } from 'express-validator';
import { validateRequest } from './validate-request';
import { ValidationChain } from "express-validator";



export const validateCreatePost = [
  check('title').notEmpty().withMessage('Title cannot be empty'),
  check('address').notEmpty().withMessage('Address cannot be empty'),
  check('squareMeters')
    .isNumeric()
    .withMessage('Square meters must be a number')
    .custom((value) => value > 0)
    .withMessage('Square meters must be greater than 0'),
  check('price')
    .isNumeric()
    .withMessage('Price must be a number')
    .custom((value) => value > 0)
    .withMessage('Price must be greater than 0'),
  check('floor')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Floor must be an integer greater than 0'),
  check('bedroom')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bedroom count must be a non-negative integer'),
  check('bathroom')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Bathroom count must be a non-negative integer'),
  check('isFurniture')
    .optional()
    .isBoolean()
    .withMessage('isFurniture must be true or false'),
  check('direction')
    .optional()
    .isString()
    .withMessage('Direction must be a string'),
  check('status')
    .optional()
    .isString()
    .withMessage('Status must be a string'),
  check('listingType')
    .notEmpty()
    .withMessage('Listing type cannot be empty')
    .isUUID()
    .withMessage('Listing type must be a valid UUID'),
  check('propertyType')
    .notEmpty()
    .withMessage('Property type cannot be empty'),
		check('tags')
		.optional()
		.custom((value) => {
			if (typeof value === 'string') return true;
			if (Array.isArray(value)) {
				return value.every((tag) => typeof tag === 'string');
			}
			return false;
		})
		.withMessage('Tags must be a string or an array of strings'),	

	validateRequest
];
export const validateCreatePostDraft = [
  ...validateCreatePost.filter((rule: any) => {
    return rule?.fields?.[0] !== "status";
  }),
  validateRequest,
];
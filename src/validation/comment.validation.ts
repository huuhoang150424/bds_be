import { check, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "@helper";

const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors, 400);
  }
  next();
};

const validatorCreateComment = [
  check("postId")
    .trim()
    .notEmpty()
    .withMessage("Post ID is required")
    .isUUID()
    .withMessage("Invalid Post ID format"),

  check("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ min: 3, max: 500 })
    .withMessage("Content must be between 3 and 500 characters"),

  validateRequest,
];

const validatorUpdateComment = [
  check("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ min: 3, max: 500 })
    .withMessage("Content must be between 3 and 500 characters"),

  validateRequest,
];

export { validatorCreateComment, validatorUpdateComment };

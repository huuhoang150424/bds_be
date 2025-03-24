import { check } from "express-validator";
import { validateRequest } from "./validate-request";

const ratingValidation = [
  check("rating")
    .trim()
    .notEmpty().withMessage("Rating is required")
    .isFloat({ min: 1, max: 5 }).withMessage("Rating must be a number between 1 and 5")
    .toFloat(), 

  validateRequest,
];

export { ratingValidation };

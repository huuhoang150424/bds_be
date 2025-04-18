import { check } from "express-validator";
import { validateRequest } from "./validate-request";
import { ReportReason, ProcessingStatus } from "@models/enums";

const validatorReport = [
  check("postId")
    .trim()
    .notEmpty()
    .withMessage("Post ID is required")
    .isUUID()
    .withMessage("Invalid Post ID format"),

  check("reason")
    .trim()
    .notEmpty()
    .withMessage("Reason is required")
    .isIn(Object.values(ReportReason))
    .withMessage("Invalid report reason"),

  check("content")
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage("Content must not exceed 500 characters"),

  check("status")
    .trim()
    .notEmpty()
    .withMessage("Status is required")
    .isIn(Object.values(ProcessingStatus))
    .withMessage("Invalid processing status"),

  validateRequest,
];

export { validatorReport };

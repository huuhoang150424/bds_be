import { check } from "express-validator";
import { validateRequest } from "./validate-request";

const validatorCreateBanner = [
  check("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters"),

  check("targetUrl")
    .trim()
    .notEmpty()
    .withMessage("Target URL is required")
    .isURL()
    .withMessage("Target URL must be a valid URL"),

  check("displayOrder")
    .notEmpty()
    .withMessage("Display order is required")
    .isInt({ min: 1 })
    .withMessage("Display order must be a positive integer"),

  check("isActive")
    .optional()
    .customSanitizer(value => {
      // Chuyển đổi các giá trị string thành boolean
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    })
    .isBoolean()
    .withMessage("isActive must be true or false"),

  check("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .custom((value) => {
      // Kiểm tra xem có thể chuyển đổi thành Date hợp lệ không
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error("Start date must be a valid date");
      }
      return true;
    }),

  check("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .custom((value, { req }) => {
      // Kiểm tra xem có thể chuyển đổi thành Date hợp lệ không
      const endDate = new Date(value);
      if (isNaN(endDate.getTime())) {
        throw new Error("End date must be a valid date");
      }

      // Kiểm tra endDate > startDate
      const startDate = new Date(req.body.startDate);
      if (!isNaN(startDate.getTime()) && endDate <= startDate) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),

  validateRequest,
];

const validatorUpdateBanner = [
  check("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters"),

  check("targetUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Target URL must be a valid URL"),

  check("displayOrder")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Display order must be a positive integer"),

  check("isActive")
    .optional()
    .customSanitizer(value => {
      // Chuyển đổi các giá trị string thành boolean
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    })
    .isBoolean()
    .withMessage("isActive must be true or false"),

  check("startDate")
    .optional()
    .custom((value) => {
      // Kiểm tra xem có thể chuyển đổi thành Date hợp lệ không
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error("Start date must be a valid date");
      }
      return true;
    }),

  check("endDate")
    .optional()
    .custom((value, { req }) => {
      // Kiểm tra xem có thể chuyển đổi thành Date hợp lệ không
      const endDate = new Date(value);
      if (isNaN(endDate.getTime())) {
        throw new Error("End date must be a valid date");
      }

      // Nếu có startDate trong request, kiểm tra endDate > startDate
      if (req.body.startDate) {
        const startDate = new Date(req.body.startDate);
        if (!isNaN(startDate.getTime()) && endDate <= startDate) {
          throw new Error("End date must be after start date");
        }
      }
      return true;
    }),

  validateRequest,
];

export { validatorCreateBanner, validatorUpdateBanner };
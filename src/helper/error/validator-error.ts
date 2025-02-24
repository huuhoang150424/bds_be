import { ValidationError as ExpressValidationError, Result } from 'express-validator';

class ValidationError extends Error {
  public errors: ExpressValidationError[];
  public status: number;
  constructor(errors: Result<ExpressValidationError>,status=422) {
    super(
      'Validation failed: ' +
        errors.array().map((err) => err.msg).join(', ')
    );
    Object.setPrototypeOf(this, ValidationError.prototype);
    this.errors = errors.array();
    this.status = status; 
  }
}

export default ValidationError;

class BadRequestError extends Error {
  public status: number;

  constructor(message = 'Yêu cầu không hợp lệ') {
    super(message);
    this.status = 400;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export default BadRequestError;

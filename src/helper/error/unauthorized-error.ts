
class UnauthorizedError extends Error {
  public status: number;
  constructor(message: string,status=403) {
    super(message);
    this.status = status
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export default UnauthorizedError;

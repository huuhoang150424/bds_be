class NotFoundError extends Error {
  public status: number;

  constructor(message: string,status=404) {
    super(message);
    this.status = status;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export default NotFoundError;

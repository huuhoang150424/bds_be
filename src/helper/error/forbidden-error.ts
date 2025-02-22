class ForbiddenError extends Error {
  public status: number;

  constructor(message = 'Bạn không có quyền truy cập') {
    super(message);
    this.status = 403; 
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export default ForbiddenError;

class TokenError extends Error {
  public status: number;
  constructor(message: string,status=401) {
    super(message);
    this.name = 'TokenError'; 
    this.status = status; 
    Error.captureStackTrace(this, TokenError); 
  }
}

export default TokenError;

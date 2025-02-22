class ApiResponse {
  status: number;
  message: string;
  data: any;

  constructor(status: number, message: string, data?: any) {
    this.status = status;
    this.message = message;
    this.data = data || null;
  }

  static success(data: any, message = "Success", status = 200) {
    return new ApiResponse(status, message, data);
  }

  static error(message = "Error", status = 400, data?: any) {
    return new ApiResponse(status, message, data);
  }
}

export default ApiResponse;

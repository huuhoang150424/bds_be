export enum ProcessingStatus {
  Pending = "pending",
  Resolved = "resolved",
  Rejected = "rejected",
	Reviewing = 'reviewing',
}

export enum ReportReason  {
	ADDRESS_ISSUE = "Địa chỉ của bất động sản",
  INCORRECT_INFO = "Thông tin giá, diện tích, mô tả không chính xác",
  DUPLICATE_IMAGE = "Ảnh trùng với tin rao khác",
  UNREACHABLE = "Không liên lạc được",
  FAKE_LISTING = "Tin không có thật",
  SOLD = "Bất động sản đã bán",
	OTHER = "khác",
}




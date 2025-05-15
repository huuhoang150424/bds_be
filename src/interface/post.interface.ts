export interface RegionStats {
  address: string;
  viewCount: number;
  growthPercentage?: number;
}

export interface MonthlyPostCount {
  month: string;
  count: string;
}
export interface ApprovalResult {
  postId: string;
  approved: boolean;
  reason?: string;
}
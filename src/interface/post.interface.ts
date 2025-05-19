export interface RegionPostStats {
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

export interface PropertyTypeStats {
  name: string;
  percentage: number;
}

export interface RegionDistributionStats { 
  name: string;
  percentage: number;
}

export interface PriceRangeStats {
  range: string;
  count: number;
}

export interface PostDistributionStats {
  propertyTypeDistribution: PropertyTypeStats[];
  regionDistribution: RegionDistributionStats[];
  priceRangeDistribution: PriceRangeStats[];
}

export interface MonthlyPropertyStats {
  month: string;
  totalProperties: number; // Tổng số bất động sản
  averagePrice: number;   // Giá trung bình
}

// Interface cho kết quả truy vấn thô
export interface RawPropertyStats {
  month: number;
  totalProperties: number;
  averagePrice: number;
}
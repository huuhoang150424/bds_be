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
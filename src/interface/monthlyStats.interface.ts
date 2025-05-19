export interface MonthlyStats {
  totalRevenue: number;
  newUsers: number;
  soldPricings: number;
  newPosts: number;
}

export interface MonthlyRevenue {
  month: number;
  revenue: number;
}

export interface RevenueStats {
  year: number;
  monthlyRevenue: MonthlyRevenue[];
}
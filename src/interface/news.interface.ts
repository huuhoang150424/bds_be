import { CategoryNew } from "@models/enums";
import { News } from "@models";

export interface DailyNewsCount {
  date: string;
  count: string;
}

export interface CategoryNewsCount {
  category: CategoryNew;
  count: string;
}

export interface NewsWithStats {
  recentNewsCount: number;
  totalViews: number;
  growthPercentage: number;
  period: {
    start: Date;
    end: Date;
    days: number;
  };
  dailyStats: Array<{
    date: string;
    count: number;
    formattedDate: string;
  }>;
  categoryStats: Array<{
    category: CategoryNew;
    count: number;
  }>;
  recentNews: News[];
}

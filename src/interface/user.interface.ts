
export interface TopUsersStats {
  userId: string;
  fullname: string;
  email: string;
  postCount: number;
}

export interface NotificationData {
  message: string;
  priority?: number;
  endDate: Date;
  userId?: string;
}

export interface GenderStats {
  male: number;
  female: number;
  other: number;
  malePercentage: number;
  femalePercentage: number;
  otherPercentage: number;
}

export interface AgeStats {
  ageGroup: string;
  count: number;
}

export interface RegionStats {
  name: string;
  count: number;
  percentage: number;
}

export interface DemographicStats {
  genderDistribution: GenderStats;
  ageDistribution: AgeStats[];
  regionDistribution: RegionStats[];
}

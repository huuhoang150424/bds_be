export interface AgeGenderStats {
  ageGroup: string;
  male: number;
  female: number;
  other: number;
}

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


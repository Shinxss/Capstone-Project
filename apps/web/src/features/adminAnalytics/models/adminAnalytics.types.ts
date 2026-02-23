export type AdminAnalyticsOverview = {
  range: "7d" | "30d";
  scopeLabel: string;
  counts: {
    emergencies: {
      OPEN: number;
      ACKNOWLEDGED: number;
      RESOLVED: number;
    };
    volunteerApplications: {
      pending: number;
      verified: number;
    };
    dispatchTasks: {
      PENDING: number;
      ACCEPTED: number;
      DONE: number;
      VERIFIED: number;
    };
  };
  trends: {
    emergencies: Array<{ date: string; OPEN: number; ACKNOWLEDGED: number; RESOLVED: number }>;
    volunteerApplications: Array<{ date: string; pending: number; verified: number }>;
    dispatchTasks: Array<{ date: string; PENDING: number; ACCEPTED: number; DONE: number; VERIFIED: number }>;
  };
};

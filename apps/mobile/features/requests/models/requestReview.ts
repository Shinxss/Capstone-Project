export type RequestReviewVolunteer = {
  id: string;
  name: string;
  lifelineId?: string;
  avatarUrl?: string;
};

export type RequestReviewRecord = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
};

export type MyRequestReviewDTO = {
  requestId: string;
  reviewable: boolean;
  reason?: string;
  requestStatus?: {
    emergencyStatus: string;
    verificationStatus: string;
    dispatchStatus: string | null;
  };
  volunteer: RequestReviewVolunteer | null;
  review: RequestReviewRecord | null;
};

export type UpsertMyRequestReviewInput = {
  rating: number;
  comment?: string;
};

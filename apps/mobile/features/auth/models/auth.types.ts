export type LoginRequest = {
  email: string;
  password: string;
};

export type SignupRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

// If your backend later returns user info, extend this
export type LoginSuccess = {
  accessToken: string;
};

export type ApiErrorShape = {
  error?: string;
  message?: string;
};

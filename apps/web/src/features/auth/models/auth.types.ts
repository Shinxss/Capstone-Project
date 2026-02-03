export type ApiEnvelope<T> = {
  data?: T;
  error?: string;
  message?: string;
};

export type LguLoginRequest = {
  username: string;
  password: string;
};

export type LguLoginResponse = {
  accessToken: string;
};

export type ApiResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type UserRole = "LGU" | "ADMIN";

export type LguLoginRequest = {
  username: string;
  password: string;
};

export type LoginSuccessData = {
  accessToken: string;
  role: UserRole;
  user: {
    id: string;
    username?: string;
    role: UserRole;
    lguName?: string;
  };
};

export type LoginMfaRequiredData = {
  mfaRequired: true;
  role: "ADMIN";
  challengeId: string;
  emailMasked: string;
  user: {
    id: string;
    username?: string;
    role: "ADMIN";
  };
};

export type PortalLoginData = LoginSuccessData | LoginMfaRequiredData;

export type AdminMfaVerifyRequest = {
  challengeId: string;
  code: string;
};

export type AdminMfaVerifyData = {
  accessToken: string;
  role: "ADMIN";
  user: {
    id: string;
    username?: string;
    role: "ADMIN";
  };
};

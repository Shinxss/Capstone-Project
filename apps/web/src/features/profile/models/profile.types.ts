export type LguProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  barangay?: string;
  municipality?: string;
  position?: string;
};

export type ProfileUpdateInput = {
  firstName: string;
  lastName: string;
  email: string;
  barangay?: string;
  municipality?: string;
  position?: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};


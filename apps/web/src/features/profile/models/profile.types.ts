export type LguProfile = {
  id: string;
  firstName: string;
  lastName: string;
  birthdate?: string;
  email: string;
  contactNo?: string;
  role: string;
  country?: string;
  postalCode?: string;
  avatarUrl?: string;
  barangay?: string;
  municipality?: string;
  position?: string;
};

export type ProfileUpdateInput = {
  firstName: string;
  lastName: string;
  birthdate?: string;
  email: string;
  contactNo?: string;
  country?: string;
  postalCode?: string;
  avatarUrl?: string;
  barangay?: string;
  municipality?: string;
  position?: string;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

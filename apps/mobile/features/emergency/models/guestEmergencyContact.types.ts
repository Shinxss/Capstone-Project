export type GuestEmergencyContact = {
  fullName: string;
  phoneNumber: string;
  updatedAt: string;
};

export type GuestEmergencyContactInput = {
  fullName: string;
  phoneNumber: string;
};

export type GuestEmergencyContactErrors = Partial<
  Record<keyof GuestEmergencyContactInput, string>
>;

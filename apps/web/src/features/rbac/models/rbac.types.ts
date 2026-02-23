export type RoleKey = "SUPER_ADMIN" | "CDRRMO_ADMIN" | "LGU_ADMIN";

export type RoleProfile = {
  _id?: string;
  key: RoleKey;
  label: string;
  permissions: string[];
};

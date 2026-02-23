export type MasterDataTab = "emergency-types" | "severity-levels" | "task-templates" | "workflows";

export type MasterDataRecord = {
  _id: string;
  code?: string;
  label?: string;
  rank?: number;
  isActive?: boolean;
  checklistItems?: string[];
  entityType?: "emergency" | "dispatch" | "volunteerApplication";
  states?: string[];
  transitions?: Array<{ from: string; to: string }>;
  createdAt?: string;
  updatedAt?: string;
};

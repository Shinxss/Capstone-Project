import { Schema, model, models } from "mongoose";

export const MASTER_DATA_TYPES = [
  "emergency-types",
  "severity-levels",
  "task-templates",
  "workflows",
] as const;

export type MasterDataType = (typeof MASTER_DATA_TYPES)[number];

export type EmergencyTypeDoc = {
  code: string;
  label: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type SeverityLevelDoc = {
  code: string;
  label: string;
  rank: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type TaskTemplateDoc = {
  code: string;
  label: string;
  checklistItems: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type StatusWorkflowDoc = {
  entityType: "emergency" | "dispatch" | "volunteerApplication";
  states: string[];
  transitions: Array<{ from: string; to: string }>;
  createdAt: Date;
  updatedAt: Date;
};

const baseStringField = { type: String, required: true, trim: true, maxlength: 120 } as const;

const EmergencyTypeSchema = new Schema<EmergencyTypeDoc>(
  {
    code: { ...baseStringField, unique: true, index: true },
    label: baseStringField,
    isActive: { type: Boolean, default: true, index: true },
  },
  { strict: "throw", timestamps: true, versionKey: false }
);

const SeverityLevelSchema = new Schema<SeverityLevelDoc>(
  {
    code: { ...baseStringField, unique: true, index: true },
    label: baseStringField,
    rank: { type: Number, required: true, default: 1, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { strict: "throw", timestamps: true, versionKey: false }
);

const TaskTemplateSchema = new Schema<TaskTemplateDoc>(
  {
    code: { ...baseStringField, unique: true, index: true },
    label: baseStringField,
    checklistItems: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
  },
  { strict: "throw", timestamps: true, versionKey: false }
);

const StatusWorkflowSchema = new Schema<StatusWorkflowDoc>(
  {
    entityType: {
      type: String,
      required: true,
      enum: ["emergency", "dispatch", "volunteerApplication"],
      unique: true,
      index: true,
    },
    states: { type: [String], default: [] },
    transitions: {
      type: [
        new Schema(
          {
            from: baseStringField,
            to: baseStringField,
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { strict: "throw", timestamps: true, versionKey: false }
);

export const EmergencyTypeModel =
  models.EmergencyType || model<EmergencyTypeDoc>("EmergencyType", EmergencyTypeSchema, "masterdata_emergency_types");

export const SeverityLevelModel =
  models.SeverityLevel ||
  model<SeverityLevelDoc>("SeverityLevel", SeverityLevelSchema, "masterdata_severity_levels");

export const TaskTemplateModel =
  models.TaskTemplate || model<TaskTemplateDoc>("TaskTemplate", TaskTemplateSchema, "masterdata_task_templates");

export const StatusWorkflowModel =
  models.StatusWorkflow ||
  model<StatusWorkflowDoc>("StatusWorkflow", StatusWorkflowSchema, "masterdata_status_workflows");

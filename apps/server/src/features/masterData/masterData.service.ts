import { Types } from "mongoose";
import type { SortOrder } from "mongoose";
import {
  type MasterDataType,
  EmergencyTypeModel,
  SeverityLevelModel,
  StatusWorkflowModel,
  TaskTemplateModel,
} from "./masterData.model";

function getModel(type: MasterDataType) {
  if (type === "emergency-types") return EmergencyTypeModel;
  if (type === "severity-levels") return SeverityLevelModel;
  if (type === "task-templates") return TaskTemplateModel;
  return StatusWorkflowModel;
}

function getSort(type: MasterDataType) {
  if (type === "severity-levels") {
    return { rank: 1, code: 1 } as Record<string, SortOrder>;
  }

  if (type === "workflows") {
    return { entityType: 1 } as Record<string, SortOrder>;
  }

  return { code: 1 } as Record<string, SortOrder>;
}

export async function listMasterData(type: MasterDataType) {
  const model = getModel(type);
  return model.find({}).sort(getSort(type)).lean();
}

export async function createMasterData(type: MasterDataType, payload: Record<string, unknown>) {
  const model = getModel(type);
  const created = await model.create(payload);
  return created.toObject();
}

export async function updateMasterData(type: MasterDataType, id: string, payload: Record<string, unknown>) {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid id");
  }

  const model = getModel(type);
  const updated = await model.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
  if (!updated) {
    throw new Error("Record not found");
  }

  return updated;
}

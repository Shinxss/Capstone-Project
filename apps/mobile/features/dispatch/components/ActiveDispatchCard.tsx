import { Pressable, Text, View } from "react-native";
import type { DispatchOffer } from "../models/dispatch";
import { getDispatchStatusLabel } from "../utils/dispatchProgress";
import {
  formatDateTime,
  formatDispatchProofCount,
  getDispatchCoordinatesLabel,
  getDispatchLatestProofTime,
  getDispatchLocationLabel,
  getDispatchNotes,
  getDispatchTitle,
} from "../utils/dispatchFormatters";
import { DispatchProgressStepper } from "./DispatchProgressStepper";
import { TaskCardBase } from "./TaskCardBase";

type ActiveDispatchCardProps = {
  dispatch: DispatchOffer;
  busy: boolean;
  uploadingProof: boolean;
  markingDone: boolean;
  onUploadProof: (dispatch: DispatchOffer) => void;
  onMarkDone: (dispatch: DispatchOffer) => void;
};

export function ActiveDispatchCard({
  dispatch,
  busy,
  uploadingProof,
  markingDone,
  onUploadProof,
  onMarkDone,
}: ActiveDispatchCardProps) {
  const notes = getDispatchNotes(dispatch);
  const coordinates = getDispatchCoordinatesLabel(dispatch);
  const proofCount = formatDispatchProofCount(dispatch);
  const latestProofTime = formatDateTime(getDispatchLatestProofTime(dispatch));
  const canMarkDone = dispatch.status === "ACCEPTED";

  return (
    <TaskCardBase
      eyebrow="Active Task"
      title={getDispatchTitle(dispatch)}
      subtitle={getDispatchLocationLabel(dispatch)}
      badgeLabel={getDispatchStatusLabel(dispatch)}
      badgeTone="active"
    >
      {notes ? <Text className="mt-3 text-sm font-medium text-slate-700">{notes}</Text> : null}

      <View className="mt-3 gap-1">
        <Text className="text-xs font-semibold text-slate-600">Proofs: {proofCount}</Text>
        {latestProofTime ? (
          <Text className="text-xs font-medium text-slate-500">Latest upload: {latestProofTime}</Text>
        ) : null}
        {coordinates ? <Text className="text-xs font-medium text-slate-500">Coordinates: {coordinates}</Text> : null}
      </View>

      <DispatchProgressStepper dispatch={dispatch} />

      <View className="mt-4 flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Upload proof image"
          onPress={() => onUploadProof(dispatch)}
          disabled={busy}
          className="flex-1 rounded-xl border border-red-300 bg-white px-4 py-3"
        >
          <Text className="text-center text-sm font-extrabold text-red-700">
            {uploadingProof ? "Uploading..." : "Upload Proof"}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mark dispatch as done"
          onPress={() => onMarkDone(dispatch)}
          disabled={busy || !canMarkDone}
          className={`flex-1 rounded-xl px-4 py-3 ${canMarkDone ? "bg-red-600" : "bg-red-200"}`}
        >
          <Text className="text-center text-sm font-extrabold text-white">
            {markingDone ? "Submitting..." : "Mark as Done"}
          </Text>
        </Pressable>
      </View>
    </TaskCardBase>
  );
}

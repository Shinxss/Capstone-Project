import { Text, View } from "react-native";
import type { DispatchOffer } from "../models/dispatch";
import { getDispatchStatusLabel } from "../utils/dispatchProgress";
import { formatDateTime, formatDispatchProofCount, getDispatchLocationLabel, getDispatchTitle } from "../utils/dispatchFormatters";
import { DispatchProgressStepper } from "./DispatchProgressStepper";
import { TaskCardBase } from "./TaskCardBase";

type AwaitingApprovalCardProps = {
  dispatch: DispatchOffer;
};

export function AwaitingApprovalCard({ dispatch }: AwaitingApprovalCardProps) {
  const submittedAt = formatDateTime(dispatch.completedAt ?? dispatch.updatedAt);

  return (
    <TaskCardBase
      eyebrow="Awaiting Approval"
      title={getDispatchTitle(dispatch)}
      subtitle={getDispatchLocationLabel(dispatch)}
      badgeLabel={getDispatchStatusLabel(dispatch)}
      badgeTone="review"
    >
      <View className="mt-3 gap-1">
        {submittedAt ? <Text className="text-xs font-semibold text-slate-600">Submitted: {submittedAt}</Text> : null}
        <Text className="text-xs font-medium text-slate-500">Proofs: {formatDispatchProofCount(dispatch)}</Text>
      </View>

      <DispatchProgressStepper dispatch={dispatch} />

      <Text className="mt-4 text-xs font-semibold text-red-700">
        Waiting for LGU verification. No further volunteer action is required.
      </Text>
    </TaskCardBase>
  );
}

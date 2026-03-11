import { Text, View } from "react-native";
import type { DispatchOffer } from "../models/dispatch";
import { getDispatchStatusLabel } from "../utils/dispatchProgress";
import {
  formatDateTime,
  formatDispatchProofCount,
  formatShortHash,
  getDispatchLocationLabel,
  getDispatchTitle,
} from "../utils/dispatchFormatters";
import { TaskCardBase } from "./TaskCardBase";

type CompletedDispatchCardProps = {
  dispatch: DispatchOffer;
};

export function CompletedDispatchCard({ dispatch }: CompletedDispatchCardProps) {
  const verifiedAt = formatDateTime(dispatch.verifiedAt ?? dispatch.updatedAt);
  const completedAt = formatDateTime(dispatch.completedAt);
  const txHash = formatShortHash(dispatch.blockchain?.verifiedTxHash ?? dispatch.chainRecord?.txHash);
  const hasBlockchainRecord = Boolean(txHash);

  return (
    <TaskCardBase
      eyebrow="Completed"
      title={getDispatchTitle(dispatch)}
      subtitle={getDispatchLocationLabel(dispatch)}
      badgeLabel={getDispatchStatusLabel(dispatch)}
      badgeTone="verified"
    >
      <View className="mt-3 gap-1">
        {completedAt ? <Text className="text-xs font-medium text-slate-500">Completed: {completedAt}</Text> : null}
        {verifiedAt ? <Text className="text-xs font-semibold text-slate-600">Verified: {verifiedAt}</Text> : null}
        <Text className="text-xs font-medium text-slate-500">Proofs: {formatDispatchProofCount(dispatch)}</Text>
      </View>

      {hasBlockchainRecord ? (
        <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
          <Text className="text-xs font-extrabold text-red-700">Blockchain Logged</Text>
          <Text className="mt-1 text-xs font-medium text-red-700">Tx: {txHash}</Text>
        </View>
      ) : null}
    </TaskCardBase>
  );
}

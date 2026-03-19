import { Image, ScrollView, Text, View } from "react-native";
import { useAuth } from "../../auth/AuthProvider";
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

function toAbsoluteAssetUrl(raw: string) {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  const apiBase = String(process.env.EXPO_PUBLIC_API_URL ?? "").trim();
  if (!apiBase) return value;
  return `${apiBase.replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
}

export function CompletedDispatchCard({ dispatch }: CompletedDispatchCardProps) {
  const { token } = useAuth();
  const verifiedAt = formatDateTime(dispatch.verifiedAt ?? dispatch.updatedAt);
  const completedAt = formatDateTime(dispatch.completedAt);
  const txHash = formatShortHash(dispatch.blockchain?.verifiedTxHash ?? dispatch.chainRecord?.txHash);
  const hasBlockchainRecord = Boolean(txHash);
  const proofImages = (Array.isArray(dispatch.proofs) ? dispatch.proofs : [])
    .map((proof, index) => {
      const uri = toAbsoluteAssetUrl(String(proof?.url ?? "").trim());
      if (!uri) return null;
      return { key: `${dispatch.id}-${uri}-${index}`, uri };
    })
    .filter((item): item is { key: string; uri: string } => Boolean(item));
  const proofHeaders = token?.trim() ? { Authorization: `Bearer ${token.trim()}` } : undefined;

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

      {proofImages.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingTop: 12, paddingBottom: 2 }}
        >
          {proofImages.map((proof) => (
            <Image
              key={proof.key}
              source={proofHeaders ? { uri: proof.uri, headers: proofHeaders } : { uri: proof.uri }}
              style={{ width: 120, height: 88, borderRadius: 12, backgroundColor: "#F1F5F9" }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>
      ) : null}

      {hasBlockchainRecord ? (
        <View className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
          <Text className="text-xs font-extrabold text-red-700">Blockchain Logged</Text>
          <Text className="mt-1 text-xs font-medium text-red-700">Tx: {txHash}</Text>
        </View>
      ) : null}
    </TaskCardBase>
  );
}

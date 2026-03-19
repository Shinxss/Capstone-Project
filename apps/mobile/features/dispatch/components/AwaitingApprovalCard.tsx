import { Image, ScrollView, Text, View } from "react-native";
import { useAuth } from "../../auth/AuthProvider";
import type { DispatchOffer } from "../models/dispatch";
import { getDispatchStatusLabel } from "../utils/dispatchProgress";
import { formatDateTime, formatDispatchProofCount, getDispatchLocationLabel, getDispatchTitle } from "../utils/dispatchFormatters";
import { DispatchProgressStepper } from "./DispatchProgressStepper";
import { TaskCardBase } from "./TaskCardBase";

type AwaitingApprovalCardProps = {
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

export function AwaitingApprovalCard({ dispatch }: AwaitingApprovalCardProps) {
  const { token } = useAuth();
  const submittedAt = formatDateTime(dispatch.completedAt ?? dispatch.updatedAt);
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

      <DispatchProgressStepper dispatch={dispatch} />

      <Text className="mt-4 text-xs font-semibold text-red-700">
        Waiting for LGU verification. No further volunteer action is required.
      </Text>
    </TaskCardBase>
  );
}

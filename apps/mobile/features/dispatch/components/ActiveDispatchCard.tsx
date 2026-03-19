import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useAuth } from "../../auth/AuthProvider";
import { MIN_DISPATCH_PROOFS_REQUIRED } from "../constants/dispatchUi.constants";
import type { DispatchOffer } from "../models/dispatch";
import { getDispatchStatusLabel } from "../utils/dispatchProgress";
import {
  formatDateTime,
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

function toAbsoluteAssetUrl(raw: string) {
  const value = String(raw ?? "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  const apiBase = String(process.env.EXPO_PUBLIC_API_URL ?? "").trim();
  if (!apiBase) return value;
  return `${apiBase.replace(/\/+$/, "")}/${value.replace(/^\/+/, "")}`;
}

export function ActiveDispatchCard({
  dispatch,
  busy,
  uploadingProof,
  markingDone,
  onUploadProof,
  onMarkDone,
}: ActiveDispatchCardProps) {
  const { token } = useAuth();
  const notes = getDispatchNotes(dispatch);
  const coordinates = getDispatchCoordinatesLabel(dispatch);
  const proofCount = Array.isArray(dispatch.proofs) ? dispatch.proofs.length : 0;
  const latestProofTime = formatDateTime(getDispatchLatestProofTime(dispatch));
  const canMarkDone = dispatch.status === "ACCEPTED" && proofCount >= MIN_DISPATCH_PROOFS_REQUIRED;
  const proofRequirementLabel =
    proofCount >= MIN_DISPATCH_PROOFS_REQUIRED
      ? `Proof requirement met (${proofCount}/${MIN_DISPATCH_PROOFS_REQUIRED})`
      : `Upload at least ${MIN_DISPATCH_PROOFS_REQUIRED} proofs (${proofCount}/${MIN_DISPATCH_PROOFS_REQUIRED})`;
  const proofImages = (Array.isArray(dispatch.proofs) ? dispatch.proofs : [])
    .map((proof, index) => {
      const uri = toAbsoluteAssetUrl(String(proof?.url ?? "").trim());
      if (!uri) return null;
      return {
        key: `${dispatch.id}-${uri}-${index}`,
        uri,
        uploadedAt: formatDateTime(proof?.uploadedAt),
      };
    })
    .filter(
      (
        item
      ): item is {
        key: string;
        uri: string;
        uploadedAt: string | null;
      } => Boolean(item)
    );
  const proofHeaders = token?.trim() ? { Authorization: `Bearer ${token.trim()}` } : undefined;

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
        <Text
          className={`text-xs font-semibold ${
            proofCount >= MIN_DISPATCH_PROOFS_REQUIRED ? "text-emerald-700" : "text-amber-700"
          }`}
        >
          {proofRequirementLabel}
        </Text>
        {latestProofTime ? (
          <Text className="text-xs font-medium text-slate-500">Latest upload: {latestProofTime}</Text>
        ) : null}
        {coordinates ? <Text className="text-xs font-medium text-slate-500">Coordinates: {coordinates}</Text> : null}
      </View>

      {proofImages.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingTop: 12, paddingBottom: 2 }}
        >
          {proofImages.map((proof) => (
            <View key={proof.key} style={{ width: 132 }}>
              <Image
                source={proofHeaders ? { uri: proof.uri, headers: proofHeaders } : { uri: proof.uri }}
                style={{ width: "100%", height: 94, borderRadius: 12, backgroundColor: "#F1F5F9" }}
                resizeMode="cover"
              />
              {proof.uploadedAt ? (
                <Text className="mt-1 text-[10px] font-medium text-slate-500">Uploaded {proof.uploadedAt}</Text>
              ) : null}
            </View>
          ))}
        </ScrollView>
      ) : null}

      <DispatchProgressStepper dispatch={dispatch} />

      <View className="mt-4 flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Upload proof images"
          onPress={() => onUploadProof(dispatch)}
          disabled={busy}
          className="flex-1 rounded-xl border border-red-300 bg-white px-4 py-3"
        >
          <Text className="text-center text-sm font-extrabold text-red-700">
            {uploadingProof ? "Uploading..." : "Upload Proofs"}
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

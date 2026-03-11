import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { DispatchOffer } from "../models/dispatch";
import { completeDispatch, respondToDispatch, uploadDispatchProof } from "../services/dispatchApi";
import { setStoredActiveDispatch } from "../services/dispatchStorage";

type DispatchActionKind = "accept" | "decline" | "upload_proof" | "mark_done";

type UseDispatchActionsParams = {
  onAccepted?: (dispatch: DispatchOffer) => Promise<void> | void;
  onDeclined?: () => Promise<void> | void;
  onCurrentUpdated?: (dispatch: DispatchOffer) => Promise<void> | void;
  onPendingExpired?: () => Promise<void> | void;
};

function readErrorMessage(error: unknown, fallback: string) {
  const parsed = error as { response?: { data?: { message?: string } }; message?: string };
  const message = String(parsed?.response?.data?.message ?? parsed?.message ?? "").trim();
  return message || fallback;
}

function isStalePendingError(message: string) {
  const normalized = message.toLowerCase();
  return normalized.includes("not pending") || normalized.includes("timed out");
}

export function useDispatchActions(params?: UseDispatchActionsParams) {
  const [busyAction, setBusyAction] = useState<DispatchActionKind | null>(null);

  const acceptDispatch = useCallback(
    async (dispatch: DispatchOffer | null | undefined) => {
      if (!dispatch?.id || busyAction) return;

      try {
        setBusyAction("accept");
        const updated = await respondToDispatch(dispatch.id, "ACCEPT");
        await setStoredActiveDispatch(updated);
        await params?.onAccepted?.(updated);
      } catch (error) {
        const message = readErrorMessage(error, "Unable to accept dispatch.");
        if (isStalePendingError(message)) {
          await params?.onPendingExpired?.();
          return;
        }
        Alert.alert("Failed", message);
      } finally {
        setBusyAction(null);
      }
    },
    [busyAction, params]
  );

  const declineDispatch = useCallback(
    async (dispatch: DispatchOffer | null | undefined) => {
      if (!dispatch?.id || busyAction) return;

      try {
        setBusyAction("decline");
        await respondToDispatch(dispatch.id, "DECLINE");
        await params?.onDeclined?.();
      } catch (error) {
        const message = readErrorMessage(error, "Unable to decline dispatch.");
        if (isStalePendingError(message)) {
          await params?.onPendingExpired?.();
          return;
        }
        Alert.alert("Failed", message);
      } finally {
        setBusyAction(null);
      }
    },
    [busyAction, params]
  );

  const uploadProof = useCallback(
    async (dispatch: DispatchOffer | null | undefined) => {
      if (!dispatch?.id || busyAction) return;

      try {
        setBusyAction("upload_proof");

        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Permission needed", "Please allow access to your photo library.");
          return;
        }

        const picked = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
          base64: true,
        });
        if (picked.canceled) return;

        const asset = picked.assets?.[0];
        if (!asset?.base64) {
          Alert.alert("Upload failed", "Unable to read image data. Try again.");
          return;
        }

        const updated = await uploadDispatchProof(dispatch.id, {
          base64: asset.base64,
          mimeType: (asset as any).mimeType ?? undefined,
          fileName: (asset as any).fileName ?? "proof.jpg",
        });

        await params?.onCurrentUpdated?.(updated);
        Alert.alert("Uploaded", "Proof uploaded successfully.");
      } catch (error) {
        Alert.alert("Upload failed", readErrorMessage(error, "Something went wrong"));
      } finally {
        setBusyAction(null);
      }
    },
    [busyAction, params]
  );

  const completeDispatchNow = useCallback(
    async (dispatch: DispatchOffer) => {
      if (!dispatch.id || busyAction) return;

      try {
        setBusyAction("mark_done");
        const updated = await completeDispatch(dispatch.id);
        await params?.onCurrentUpdated?.(updated);
        Alert.alert("Submitted", "Task marked as done. Waiting for LGU verification.");
      } catch (error) {
        Alert.alert("Failed", readErrorMessage(error, "Something went wrong"));
      } finally {
        setBusyAction(null);
      }
    },
    [busyAction, params]
  );

  const markDispatchDone = useCallback(
    (dispatch: DispatchOffer | null | undefined) => {
      if (!dispatch?.id || busyAction) return;

      Alert.alert("Mark as done?", "Make sure you uploaded proof before marking this task as done.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark Done",
          style: "default",
          onPress: () => {
            void completeDispatchNow(dispatch);
          },
        },
      ]);
    },
    [busyAction, completeDispatchNow]
  );

  return useMemo(
    () => ({
      busyAction,
      isBusy: busyAction !== null,
      isAccepting: busyAction === "accept",
      isDeclining: busyAction === "decline",
      isUploadingProof: busyAction === "upload_proof",
      isMarkingDone: busyAction === "mark_done",
      acceptDispatch,
      declineDispatch,
      uploadProof,
      markDispatchDone,
    }),
    [acceptDispatch, busyAction, declineDispatch, markDispatchDone, uploadProof]
  );
}

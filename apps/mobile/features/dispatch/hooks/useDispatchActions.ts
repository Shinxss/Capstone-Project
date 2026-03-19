import { useCallback, useMemo, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { DispatchOffer } from "../models/dispatch";
import { MIN_DISPATCH_PROOFS_REQUIRED } from "../constants/dispatchUi.constants";
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
          allowsMultipleSelection: true,
          quality: 0.7,
          base64: true,
        });
        if (picked.canceled) return;

        const assets = Array.isArray(picked.assets) ? picked.assets : [];
        if (!assets.length) return;

        const validAssets = assets.filter((asset) => Boolean(asset?.base64));
        if (!validAssets.length) {
          Alert.alert("Upload failed", "Unable to read image data. Try again.");
          return;
        }

        let uploadedCount = 0;
        let failedCount = 0;
        let latestUpdated: DispatchOffer | null = null;
        let firstUploadError: unknown = null;

        for (let index = 0; index < validAssets.length; index += 1) {
          const asset = validAssets[index];
          try {
            latestUpdated = await uploadDispatchProof(dispatch.id, {
              base64: String(asset.base64),
              mimeType: (asset as any).mimeType ?? undefined,
              fileName:
                (asset as any).fileName ??
                `proof-${Date.now()}-${index + 1}.jpg`,
            });
            uploadedCount += 1;
          } catch (error) {
            failedCount += 1;
            if (!firstUploadError) {
              firstUploadError = error;
            }
          }
        }

        if (latestUpdated) {
          await params?.onCurrentUpdated?.(latestUpdated);
        }

        if (uploadedCount === 0) {
          Alert.alert("Upload failed", readErrorMessage(firstUploadError, "Unable to upload selected proofs."));
          return;
        }

        const unreadableCount = assets.length - validAssets.length;
        const nonUploadedCount = failedCount + unreadableCount;
        if (nonUploadedCount > 0) {
          Alert.alert(
            "Uploaded",
            `${uploadedCount} proof image${uploadedCount === 1 ? "" : "s"} uploaded. ${nonUploadedCount} could not be uploaded.`
          );
          return;
        }

        Alert.alert(
          "Uploaded",
          `${uploadedCount} proof image${uploadedCount === 1 ? "" : "s"} uploaded successfully.`
        );
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
      const proofCount = Array.isArray(dispatch.proofs) ? dispatch.proofs.length : 0;
      if (proofCount < MIN_DISPATCH_PROOFS_REQUIRED) {
        Alert.alert(
          "More proof required",
          `Upload at least ${MIN_DISPATCH_PROOFS_REQUIRED} proof images before marking this task as done. (${proofCount}/${MIN_DISPATCH_PROOFS_REQUIRED})`
        );
        return;
      }

      Alert.alert(
        "Mark as done?",
        `You uploaded ${proofCount} proof images. Submit this task for LGU verification?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Mark Done",
            style: "default",
            onPress: () => {
              void completeDispatchNow(dispatch);
            },
          },
        ]
      );
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

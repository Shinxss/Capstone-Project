import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSession } from "../../auth/hooks/useSession";
import {
  removeMyAvatar,
  uploadMyAvatar,
  type UploadMyAvatarPayload,
} from "../services/profileAvatarApi";

type UseProfileAvatarOptions = {
  enabled: boolean;
  avatarUrl?: string | null;
  onAvatarChanged?: (avatarUrl: string | null) => Promise<void> | void;
};

function asNullableString(value: unknown) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function normalizeMimeType(value?: string | null): UploadMyAvatarPayload["mimeType"] | undefined {
  const mime = String(value ?? "").trim().toLowerCase();
  if (!mime) return undefined;
  if (mime === "image/jpg") return "image/jpeg";
  if (mime === "image/png" || mime === "image/jpeg" || mime === "image/heic") return mime;
  return undefined;
}

function getExtensionFromMime(mimeType?: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/heic") return "heic";
  return "jpg";
}

function normalizeFileName(value?: string | null, fallbackExt = "jpg") {
  const normalized = String(value ?? "").trim();
  if (normalized) return normalized.slice(0, 255);
  return `avatar_${Date.now()}.${fallbackExt}`;
}

export function useProfileAvatar(options: UseProfileAvatarOptions) {
  const { updateUser } = useSession();
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(asNullableString(options.avatarUrl));

  useEffect(() => {
    setAvatarUrl(asNullableString(options.avatarUrl));
  }, [options.avatarUrl]);

  const persistAvatar = useCallback(
    async (nextAvatarUrl: string | null) => {
      setAvatarUrl(nextAvatarUrl);
      await updateUser({ avatarUrl: nextAvatarUrl ?? undefined });
      await options.onAvatarChanged?.(nextAvatarUrl);
    },
    [options, updateUser]
  );

  const uploadFromAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      if (!options.enabled) return;
      if (!asset.base64) {
        Alert.alert("Upload failed", "Unable to read image data. Please try again.");
        return;
      }

      const mimeType = normalizeMimeType((asset as any).mimeType);
      const extension = getExtensionFromMime(mimeType);
      const fileName = normalizeFileName((asset as any).fileName, extension);

      setUploading(true);
      try {
        const uploaded = await uploadMyAvatar({
          base64: asset.base64,
          mimeType,
          fileName,
        });
        await persistAvatar(uploaded.avatarUrl);
      } catch (error: any) {
        const message = String(error?.response?.data?.message ?? error?.message ?? "Failed to upload avatar.");
        Alert.alert("Upload failed", message);
      } finally {
        setUploading(false);
      }
    },
    [options.enabled, persistAvatar]
  );

  const chooseFromLibrary = useCallback(async () => {
    if (!options.enabled || uploading) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to upload a profile photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.65,
      base64: true,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset) return;

    await uploadFromAsset(asset);
  }, [options.enabled, uploadFromAsset, uploading]);

  const takePhoto = useCallback(async () => {
    if (!options.enabled || uploading) return;

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow camera access to take a profile photo.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.65,
      base64: true,
    });

    if (result.canceled) return;
    const asset = result.assets?.[0];
    if (!asset) return;

    await uploadFromAsset(asset);
  }, [options.enabled, uploadFromAsset, uploading]);

  const removeAvatar = useCallback(async () => {
    if (!options.enabled || uploading) return;

    setUploading(true);
    try {
      await removeMyAvatar();
      await persistAvatar(null);
    } catch (error: any) {
      const message = String(error?.response?.data?.message ?? error?.message ?? "Failed to remove avatar.");
      Alert.alert("Remove failed", message);
    } finally {
      setUploading(false);
    }
  }, [options.enabled, persistAvatar, uploading]);

  return useMemo(
    () => ({
      avatarUrl,
      uploading,
      hasAvatar: Boolean(avatarUrl),
      chooseFromLibrary,
      takePhoto,
      removeAvatar,
    }),
    [avatarUrl, chooseFromLibrary, removeAvatar, takePhoto, uploading]
  );
}

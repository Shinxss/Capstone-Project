import { useCallback, useEffect, useMemo, useRef } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { uploadEmergencyReportPhoto } from "../../emergency/services/emergencyApi";
import type { ReportPhoto } from "../models/report.types";
import { useReportDraft } from "./useReportDraft";

const MAX_PHOTOS = 5;

function normalizeMimeType(value?: string | null) {
  const mime = String(value ?? "").trim().toLowerCase();
  if (!mime) return undefined;
  if (mime === "image/jpg") return "image/jpeg";
  return mime;
}

function normalizeFileName(value?: string | null, fallbackExt = "jpg") {
  const trimmed = String(value ?? "").trim();
  if (trimmed) return trimmed.slice(0, 255);
  return `photo_${Date.now()}.${fallbackExt}`;
}

function getExtensionFromMime(mimeType?: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/heic") return "heic";
  return "jpg";
}

export function useReportPhotos() {
  const { draft, addPhotoLocal, updatePhoto, removePhoto: removePhotoFromDraft } = useReportDraft();
  const photos = draft.photos ?? [];
  const photosRef = useRef(photos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const remainingSlots = MAX_PHOTOS - photos.length;
  const hasUploading = useMemo(() => photos.some((photo) => Boolean(photo.uploading)), [photos]);
  const hasError = useMemo(() => photos.some((photo) => Boolean(photo.error)), [photos]);

  const ensureSlotAvailable = useCallback(() => {
    if (remainingSlots > 0) return true;
    Alert.alert("Photo limit reached", `You can upload up to ${MAX_PHOTOS} photos.`);
    return false;
  }, [remainingSlots]);

  const patchPhotoByLocalUri = useCallback(
    (localUri: string, patch: Partial<ReportPhoto>) => {
      const index = photosRef.current.findIndex((photo) => photo.localUri === localUri);
      if (index >= 0) {
        updatePhoto(index, patch);
      }
    },
    [updatePhoto]
  );

  const uploadAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      if (!asset.uri || !asset.base64) {
        Alert.alert("Photo unavailable", "Unable to read the selected image.");
        return;
      }

      const mimeType = normalizeMimeType((asset as any).mimeType);
      const ext = getExtensionFromMime(mimeType);
      const fileName = normalizeFileName((asset as any).fileName, ext);

      addPhotoLocal({
        localUri: asset.uri,
        mimeType,
        fileName,
        uploading: true,
      });

      try {
        const response = await uploadEmergencyReportPhoto({
          base64: asset.base64,
          mimeType,
          fileName,
        });

        patchPhotoByLocalUri(asset.uri, {
          url: response.url,
          uploading: false,
          error: undefined,
        });
      } catch (error: any) {
        const message = String(
          error?.response?.data?.message ?? error?.message ?? "Unable to upload photo."
        );
        patchPhotoByLocalUri(asset.uri, {
          uploading: false,
          error: message,
        });
      }
    },
    [addPhotoLocal, patchPhotoByLocalUri]
  );

  const pickFromLibrary = useCallback(async () => {
    if (!ensureSlotAvailable()) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow photo library access to add images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: Math.max(1, remainingSlots),
      quality: 0.65,
      base64: true,
    });

    if (result.canceled) return;
    const selectedAssets = (result.assets ?? []).slice(0, Math.max(0, remainingSlots));
    if (selectedAssets.length === 0) return;

    if ((result.assets?.length ?? 0) > selectedAssets.length) {
      Alert.alert("Photo limit reached", `Only ${selectedAssets.length} photo(s) were added.`);
    }

    for (const asset of selectedAssets) {
      await uploadAsset(asset);
    }
  }, [ensureSlotAvailable, remainingSlots, uploadAsset]);

  const takePhoto = useCallback(async () => {
    if (!ensureSlotAvailable()) return;

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow camera access to take a photo.");
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

    await uploadAsset(asset);
  }, [ensureSlotAvailable, uploadAsset]);

  const removePhoto = useCallback(
    (index: number) => {
      removePhotoFromDraft(index);
    },
    [removePhotoFromDraft]
  );

  return {
    photos,
    pickFromLibrary,
    takePhoto,
    removePhoto,
    hasUploading,
    hasError,
  };
}

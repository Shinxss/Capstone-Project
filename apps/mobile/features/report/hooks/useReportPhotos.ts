import { useCallback, useEffect, useMemo, useRef } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { ReportPhoto } from "../models/report.types";
import { MAX_PROOF_IMAGES } from "../constants/report.constants";
import { useReportDraft } from "./useReportDraft";

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
  const { draft, addPhotoLocal, removePhoto: removePhotoFromDraft } = useReportDraft();
  const photos = draft.photos ?? [];
  const photosRef = useRef(photos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const remainingSlots = MAX_PROOF_IMAGES - photos.length;
  const hasUploading = useMemo(() => photos.some((photo) => Boolean(photo.uploading)), [photos]);
  const hasError = useMemo(() => photos.some((photo) => Boolean(photo.error)), [photos]);

  const ensureSlotAvailable = useCallback(() => {
    if (remainingSlots > 0) return true;
    Alert.alert("Photo already added", "Remove the current proof photo before adding another one.");
    return false;
  }, [remainingSlots]);

  const addLocalAsset = useCallback(
    (asset: ImagePicker.ImagePickerAsset) => {
      if (!asset.uri) {
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
        base64: asset.base64 ?? undefined,
        uploading: false,
        error: undefined,
      });
    },
    [addPhotoLocal]
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
      allowsMultipleSelection: false,
      selectionLimit: 1,
      quality: 0.65,
      base64: true,
    });

    if (result.canceled) return;
    const selectedAssets = (result.assets ?? []).slice(0, 1);
    if (selectedAssets.length === 0) return;

    for (const asset of selectedAssets) {
      addLocalAsset(asset);
    }
  }, [ensureSlotAvailable, addLocalAsset]);

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

    addLocalAsset(asset);
  }, [ensureSlotAvailable, addLocalAsset]);

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

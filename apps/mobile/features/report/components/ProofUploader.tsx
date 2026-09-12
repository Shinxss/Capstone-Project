import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { PROOF_PHOTO_HELPER_TEXT } from "../constants/report.constants";
import type { ReportPhoto } from "../models/report.types";

type Props = {
  photos: ReportPhoto[];
  hasError: boolean;
  onAddPhoto: () => void;
  onRemovePhoto: (index: number) => void;
};

export function ProofUploader({ photos, hasError, onAddPhoto, onRemovePhoto }: Props) {
  const photo = photos[0];
  const proofAdded = Boolean(photo?.url) && !photo.uploading && !photo.error;

  return (
    <View className="mt-8">
      <Text className="text-xl font-semibold text-zinc-900">Proof *</Text>

      <View className="mt-3 flex-row items-start gap-3">
        {!photo ? (
          <Pressable
            onPress={onAddPhoto}
            className="h-24 w-28 items-center justify-center rounded-2xl border border-dashed border-zinc-300"
            accessibilityRole="button"
            accessibilityLabel="Add proof photo"
          >
            <Ionicons name="camera-outline" size={21} color="#71717a" />
            <Text className="mt-1 text-sm text-zinc-600">Add Photo</Text>
          </Pressable>
        ) : (
          <View className="h-24 w-24 overflow-hidden rounded-2xl border border-zinc-300 bg-zinc-200">
            <Image
              source={{ uri: photo.localUri }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />

            <Pressable
              onPress={() => onRemovePhoto(0)}
              className="absolute right-1 top-1 h-7 w-7 items-center justify-center rounded-full bg-black/70"
              accessibilityRole="button"
              accessibilityLabel="Remove proof photo"
            >
              <Ionicons name="close" size={16} color="#ffffff" />
            </Pressable>

            {photo.uploading ? (
              <View className="absolute inset-0 items-center justify-center bg-black/45">
                <Text className="rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
                  Uploading...
                </Text>
              </View>
            ) : null}

            {photo.error ? (
              <View className="absolute bottom-1 left-1 right-1 rounded-md bg-red-500 px-1 py-0.5">
                <Text className="text-center text-[10px] font-medium text-white">Upload failed</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {hasError ? (
        <Text className="mt-2 text-xs text-red-500">
          Remove the failed photo upload before submitting your report.
        </Text>
      ) : proofAdded ? (
        <View className="mt-2 flex-row items-center gap-1">
          <Ionicons name="checkmark-circle" size={15} color="#16A34A" />
          <Text className="text-xs font-medium text-green-700">Proof photo added</Text>
        </View>
      ) : photo?.uploading ? (
        <Text className="mt-2 text-xs text-zinc-500">Uploading proof photo...</Text>
      ) : (
        <Text className="mt-2 text-xs text-zinc-500">{PROOF_PHOTO_HELPER_TEXT}</Text>
      )}
    </View>
  );
}

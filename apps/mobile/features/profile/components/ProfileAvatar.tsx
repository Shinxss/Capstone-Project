import React, { useMemo } from "react";
import { ActivityIndicator, Image, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";
import { resolveAvatarUri } from "../utils/avatarUrl";

type ProfileAvatarProps = {
  avatarUrl?: string | null;
  authToken?: string | null;
  editable?: boolean;
  size?: number;
  uploading?: boolean;
  onPress?: () => void;
};

export default function ProfileAvatar({
  avatarUrl,
  authToken,
  editable = false,
  size = 88,
  uploading = false,
  onPress,
}: ProfileAvatarProps) {
  const { isDark } = useTheme();

  const resolvedAvatarUri = useMemo(() => resolveAvatarUri(avatarUrl), [avatarUrl]);
  const canPress = Boolean(onPress) && !uploading;
  const badgeSize = Math.max(22, Math.round(size * 0.33));
  const cameraSize = Math.max(20, Math.round(size * 0.32));

  return (
    <Pressable
      onPress={onPress}
      disabled={!canPress}
      hitSlop={10}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "visible",
        alignItems: "center",
        justifyContent: "center",
        opacity: canPress && pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          borderWidth: 2,
          borderColor: isDark ? "#3B82F6" : "#DC2626",
          backgroundColor: isDark ? "#0E1626" : "#F8FAFC",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {resolvedAvatarUri ? (
          <Image
            source={{
              uri: resolvedAvatarUri,
              ...(authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {}),
            }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="camera-outline" size={cameraSize} color={isDark ? "#94A3B8" : "#94A3B8"} />
        )}

        {uploading ? (
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(15,23,42,0.28)",
            }}
          >
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        ) : null}
      </View>

      {editable && resolvedAvatarUri ? (
        <View
          style={{
            position: "absolute",
            right: -1,
            bottom: -1,
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
            borderWidth: 1.5,
            borderColor: isDark ? "#334155" : "#E2E8F0",
          }}
        >
          <Ionicons name="camera" size={Math.max(11, Math.round(badgeSize * 0.48))} color={isDark ? "#E2E8F0" : "#334155"} />
        </View>
      ) : null}
    </Pressable>
  );
}

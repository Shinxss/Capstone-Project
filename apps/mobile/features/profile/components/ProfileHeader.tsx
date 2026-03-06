import React, { useCallback } from "react";
import { Alert, Platform, Pressable, Text, ToastAndroid, View } from "react-native";
import { Menu } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "../../theme/useTheme";
import ProfileAvatar from "./ProfileAvatar";

type ProfileHeaderProps = {
  fullName: string;
  roleLabel: string;
  lifelineId?: string | null;
  avatarUrl?: string | null;
  avatarAuthToken?: string | null;
  avatarUploading?: boolean;
  isGuest: boolean;
  showVerified: boolean;
  onPressAvatar: () => void;
  onPressEdit: () => void;
  onPressMenu: () => void;
};

export default function ProfileHeader({
  fullName,
  roleLabel,
  lifelineId,
  avatarUrl,
  avatarAuthToken,
  avatarUploading,
  isGuest,
  showVerified,
  onPressAvatar,
  onPressEdit,
  onPressMenu,
}: ProfileHeaderProps) {
  const { isDark } = useTheme();
  const lifelineIdValue = String(lifelineId ?? "").trim() || "LF-2026-xxxxxx";

  const onCopyLifelineId = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(lifelineIdValue);
      if (Platform.OS === "android") {
        ToastAndroid.show("Lifeline ID copied", ToastAndroid.SHORT);
      } else {
        Alert.alert("Copied", "Lifeline ID copied to clipboard.");
      }
    } catch {
      Alert.alert("Copy failed", "Unable to copy Lifeline ID right now.");
    }
  }, [lifelineIdValue]);

  return (
    <View
      style={{
        marginTop: 12,
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#162544" : "#E5E7EB",
        backgroundColor: isDark ? "#0B1220" : "transparent",
      }}
    >
      <Pressable
        onPress={onPressMenu}
        hitSlop={12}
        style={({ pressed }) => ({
          position: "absolute",
          top: -8,
          left: 15,
          padding: 4,
          opacity: pressed ? 0.72 : 1,
          zIndex: 3,
        })}
      >
        <Menu size={25} color={isDark ? "#F8FAFC" : "#0F172A"} strokeWidth={2} />
      </Pressable>

      <View style={{ flexDirection: "row", alignItems: "center", marginTop: 16 }}>
        <ProfileAvatar
          avatarUrl={avatarUrl}
          authToken={avatarAuthToken}
          editable
          size={88}
          uploading={avatarUploading}
          onPress={onPressAvatar}
        />

        <View style={{ flex: 1, minWidth: 0, marginLeft: 14, marginRight: 12 }}>
          <Text className="text-[17px] font-extrabold text-slate-900 dark:text-slate-100" numberOfLines={1}>
            {fullName}
          </Text>

          {isGuest ? (
            <Text className="mt-1 text-[13px] leading-5 text-slate-600 dark:text-slate-300">
              Sign in to access all features
            </Text>
          ) : (
            <>
              <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text className="text-[13px] font-medium text-slate-600 dark:text-slate-300">{roleLabel}</Text>
                {showVerified ? (
                  <View
                    style={{
                      borderRadius: 999,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      backgroundColor: isDark ? "rgba(34,197,94,0.18)" : "#DCFCE7",
                    }}
                  >
                    <Text
                      style={{
                        color: isDark ? "#86EFAC" : "#15803D",
                        fontSize: 11,
                        fontWeight: "700",
                      }}
                    >
                      Verified
                    </Text>
                  </View>
                ) : null}
              </View>
              <Pressable
                onPress={() => {
                  void onCopyLifelineId();
                }}
                hitSlop={8}
                style={({ pressed }) => ({ marginTop: 4, opacity: pressed ? 0.72 : 1 })}
              >
                <Text className="text-xs font-medium text-slate-600 dark:text-slate-300" numberOfLines={1}>
                  {`Lifeline ID: ${lifelineIdValue}`}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 4 }}>
          <Pressable
            onPress={onPressEdit}
            hitSlop={8}
            style={({ pressed }) => ({
              minWidth: 70,
              height: 35,
              paddingHorizontal: 14,
              borderRadius: 12,
              borderWidth: 1,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
              borderColor: isDark ? "#3B82F6" : "#DC2626",
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text
              className="text-sm font-semibold text-slate-900 dark:text-slate-100"
              style={{ lineHeight: 18 }}
            >
              Edit
            </Text>
          </Pressable>

        </View>
      </View>
    </View>
  );
}

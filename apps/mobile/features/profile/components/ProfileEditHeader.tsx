import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";
import ProfileAvatar from "./ProfileAvatar";

type ProfileEditHeaderProps = {
  fullName: string;
  roleLabel: string;
  email?: string | null;
  lifelineId?: string | null;
  showVerified: boolean;
  avatarUrl?: string | null;
  avatarAuthToken?: string | null;
  saving: boolean;
  canSave: boolean;
  onBack: () => void;
  onSave: () => void;
};

export default function ProfileEditHeader({
  fullName,
  roleLabel,
  email,
  lifelineId,
  showVerified,
  avatarUrl,
  avatarAuthToken,
  saving,
  canSave,
  onBack,
  onSave,
}: ProfileEditHeaderProps) {
  const { isDark } = useTheme();
  const showLifelineId = Boolean(String(lifelineId ?? "").trim());

  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: isDark ? "#162544" : "#E5E7EB",
        backgroundColor: isDark ? "#0B1220" : "transparent",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 6,
            opacity: pressed ? 0.72 : 1,
          })}
        >
          <Ionicons name="chevron-back" size={18} color={isDark ? "#E2E8F0" : "#0F172A"} />
          <Text style={{ marginLeft: 3, fontSize: 15, fontWeight: "700", color: isDark ? "#E2E8F0" : "#0F172A" }}>
            Back
          </Text>
        </Pressable>

        <Pressable
          onPress={onSave}
          disabled={!canSave || saving}
          hitSlop={8}
          style={({ pressed }) => ({
            minWidth: 64,
            height: 34,
            borderRadius: 10,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: canSave && !saving ? "#DC2626" : isDark ? "#162544" : "#E5E7EB",
            opacity: pressed ? 0.84 : 1,
          })}
        >
          <Text style={{ color: canSave && !saving ? "#FFFFFF" : isDark ? "#94A3B8" : "#64748B", fontWeight: "700" }}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>

      <View style={{ marginTop: 16, flexDirection: "row", alignItems: "center" }}>
        <ProfileAvatar
          avatarUrl={avatarUrl}
          authToken={avatarAuthToken}
          editable={false}
          size={74}
          uploading={false}
        />

        <View style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
          <Text style={{ color: isDark ? "#E2E8F0" : "#0F172A", fontSize: 18, fontWeight: "800" }} numberOfLines={1}>
            {fullName}
          </Text>

          <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ color: isDark ? "#94A3B8" : "#475569", fontSize: 13, fontWeight: "600" }}>{roleLabel}</Text>
            {showVerified ? (
              <View
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  backgroundColor: isDark ? "rgba(34,197,94,0.18)" : "#DCFCE7",
                }}
              >
                <Text style={{ color: isDark ? "#86EFAC" : "#15803D", fontSize: 11, fontWeight: "700" }}>Verified</Text>
              </View>
            ) : null}
          </View>

          {email ? (
            <Text style={{ marginTop: 4, color: isDark ? "#94A3B8" : "#475569", fontSize: 12 }} numberOfLines={1}>
              {email}
            </Text>
          ) : null}

          {showLifelineId ? (
            <Text style={{ marginTop: 2, color: isDark ? "#64748B" : "#64748B", fontSize: 12 }} numberOfLines={1}>
              {`Lifeline ID: ${String(lifelineId).trim()}`}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

import React, { useCallback } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import GradientScreen from "../../../src/components/GradientScreen";
import { useTheme } from "../../theme/useTheme";
import { useSession } from "../../auth/hooks/useSession";
import { useAuth } from "../../auth/AuthProvider";
import { RefreshableScrollScreen } from "../../common/components/RefreshableScrollScreen";
import ProfileSkillsCard from "../components/ProfileSkillsCard";
import { useProfileSkillsEditor } from "../hooks/useProfileSkillsEditor";

export default function ProfileSkillsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { isUser } = useSession();
  const { signOut } = useAuth();
  const skillsEditor = useProfileSkillsEditor();

  const onSave = useCallback(async () => {
    const saved = await skillsEditor.save();
    if (!saved) return;

    Alert.alert("Saved", "Skills updated successfully.", [
      {
        text: "OK",
        onPress: () => router.back(),
      },
    ]);
  }, [router, skillsEditor]);

  if (!isUser) {
    return (
      <GradientScreen gradientHeight={180}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: isDark ? "#E2E8F0" : "#0F172A", fontSize: 18, fontWeight: "800" }}>
            Sign in required
          </Text>
          <Text
            style={{
              marginTop: 8,
              textAlign: "center",
              color: isDark ? "#94A3B8" : "#64748B",
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            You need an account to manage profile skills.
          </Text>
          <Pressable
            onPress={() => {
              void signOut();
            }}
            style={({ pressed }) => ({
              marginTop: 16,
              minWidth: 140,
              height: 42,
              borderRadius: 12,
              backgroundColor: "#DC2626",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.86 : 1,
            })}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 14 }}>Sign In</Text>
          </Pressable>
        </View>
      </GradientScreen>
    );
  }

  if (!skillsEditor.canEdit) {
    return (
      <GradientScreen gradientHeight={180}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Text style={{ color: isDark ? "#E2E8F0" : "#0F172A", fontSize: 18, fontWeight: "800" }}>
            Skills unavailable
          </Text>
          <Text
            style={{
              marginTop: 8,
              textAlign: "center",
              color: isDark ? "#94A3B8" : "#64748B",
              fontSize: 14,
              lineHeight: 20,
            }}
          >
            Skills can only be edited for volunteer profiles.
          </Text>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              marginTop: 16,
              minWidth: 140,
              height: 42,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: isDark ? "#162544" : "#E5E7EB",
              backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.86 : 1,
            })}
          >
            <Text style={{ color: isDark ? "#E2E8F0" : "#0F172A", fontWeight: "700", fontSize: 14 }}>Back</Text>
          </Pressable>
        </View>
      </GradientScreen>
    );
  }

  return (
    <GradientScreen gradientHeight={210}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? "#162544" : "#E5E7EB",
          backgroundColor: isDark ? "#0B1220" : "transparent",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable
            onPress={() => router.back()}
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
            onPress={() => {
              void onSave();
            }}
            disabled={!skillsEditor.hasChanges || skillsEditor.saving}
            hitSlop={8}
            style={({ pressed }) => ({
              minWidth: 64,
              height: 34,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor:
                skillsEditor.hasChanges && !skillsEditor.saving ? "#DC2626" : isDark ? "#162544" : "#E5E7EB",
              opacity: pressed ? 0.84 : 1,
            })}
          >
            <Text
              style={{
                color:
                  skillsEditor.hasChanges && !skillsEditor.saving ? "#FFFFFF" : isDark ? "#94A3B8" : "#64748B",
                fontWeight: "700",
              }}
            >
              {skillsEditor.saving ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </View>

        <Text style={{ marginTop: 8, color: isDark ? "#E2E8F0" : "#0F172A", fontSize: 18, fontWeight: "800" }}>
          Add Skills
        </Text>
      </View>

      <RefreshableScrollScreen
        refreshing={skillsEditor.loading}
        onRefresh={skillsEditor.refresh}
        className="bg-transparent"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <ProfileSkillsCard
          skillOptions={skillsEditor.skillOptions}
          selectedSkills={skillsEditor.selectedSkills}
          otherSkillEnabled={skillsEditor.otherSkillEnabled}
          otherSkillText={skillsEditor.otherSkillText}
          error={skillsEditor.error}
          onToggleSkill={skillsEditor.toggleSkill}
          onToggleOther={skillsEditor.toggleOtherSkillEnabled}
          onChangeOtherText={skillsEditor.setOtherSkill}
        />
      </RefreshableScrollScreen>
    </GradientScreen>
  );
}

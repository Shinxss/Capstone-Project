import React, { useCallback } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import GradientScreen from "../../src/components/GradientScreen";
import { RefreshableScrollScreen } from "../../features/common/components/RefreshableScrollScreen";
import { useAuth } from "../../features/auth/AuthProvider";
import { useSession } from "../../features/auth/hooks/useSession";
import { useTheme } from "../../features/theme/useTheme";
import ProfileEditForm from "../../features/profile/components/ProfileEditForm";
import ProfileEditHeader from "../../features/profile/components/ProfileEditHeader";
import { useEditProfile } from "../../features/profile/hooks/useEditProfile";
import { formatSkillsDisplayText } from "../../features/profile/utils/skills";

export default function EditProfileScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const { isUser, session } = useSession();
  const { isDark } = useTheme();
  const editProfile = useEditProfile();

  const authToken = session?.mode === "user" ? session.user.accessToken : null;

  const confirmDiscard = useCallback(
    (onDiscard: () => void) => {
      Alert.alert("Discard changes?", "You have unsaved changes.", [
        { text: "Keep editing", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: onDiscard },
      ]);
    },
    []
  );

  const onBack = useCallback(() => {
    if (editProfile.hasUnsavedChanges && !editProfile.saving) {
      confirmDiscard(() => router.back());
      return;
    }
    router.back();
  }, [confirmDiscard, editProfile.hasUnsavedChanges, editProfile.saving, router]);

  usePreventRemove(editProfile.hasUnsavedChanges && !editProfile.saving, ({ data }) => {
    confirmDiscard(() => {
      navigation.dispatch(data.action);
    });
  });

  const onSave = useCallback(async () => {
    const saved = await editProfile.save();
    if (!saved) {
      if (editProfile.saveError) {
        Alert.alert("Save failed", editProfile.saveError);
      }
      return;
    }

    Alert.alert("Saved", "Profile updated successfully.", [
      {
        text: "OK",
        onPress: () => {
          router.back();
        },
      },
    ]);
  }, [editProfile, router]);

  const onPressSkills = useCallback(() => {
    router.push("/profile/skills");
  }, [router]);

  const rawSkillsDisplay =
    session?.mode === "user" ? String(session.user.skills ?? "").trim() : editProfile.fields.skills;
  const skillsDisplay = formatSkillsDisplayText(rawSkillsDisplay);

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
            You need an account to edit your profile.
          </Text>
          <Pressable
            onPress={async () => {
              await signOut();
              router.replace("/(auth)/login");
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

  return (
    <GradientScreen gradientHeight={230}>
      <ProfileEditHeader
        fullName={editProfile.display.fullName}
        roleLabel={editProfile.display.roleLabel}
        email={editProfile.profile.email}
        lifelineId={editProfile.profile.lifelineId}
        showVerified={editProfile.display.showVerified}
        avatarUrl={editProfile.profile.avatarUrl}
        avatarAuthToken={authToken}
        saving={editProfile.saving}
        canSave={editProfile.canSave}
        onBack={onBack}
        onSave={() => {
          void onSave();
        }}
      />

      <RefreshableScrollScreen
        refreshing={editProfile.loading}
        onRefresh={editProfile.refresh}
        className="bg-transparent"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <ProfileEditForm
          fields={editProfile.fields}
          errors={editProfile.errors}
          canEditSkills={editProfile.canEditSkills}
          skillsDisplay={skillsDisplay}
          onChangeField={editProfile.setField}
          onPressSkills={onPressSkills}
        />

        {editProfile.loadError ? (
          <Text
            style={{
              marginTop: 12,
              marginHorizontal: 20,
              color: isDark ? "#94A3B8" : "#64748B",
              fontSize: 13,
            }}
          >
            {editProfile.loadError}
          </Text>
        ) : null}

        {editProfile.saveError ? (
          <Text
            style={{
              marginTop: 10,
              marginHorizontal: 20,
              color: "#DC2626",
              fontSize: 13,
              fontWeight: "600",
            }}
          >
            {editProfile.saveError}
          </Text>
        ) : null}
      </RefreshableScrollScreen>
    </GradientScreen>
  );
}

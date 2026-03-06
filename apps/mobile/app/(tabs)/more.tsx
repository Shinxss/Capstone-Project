import React, { useCallback, useMemo, useState } from "react";
import { Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import GradientScreen from "../../src/components/GradientScreen";
import { useAuth } from "../../features/auth/AuthProvider";
import { useSession } from "../../features/auth/hooks/useSession";
import { useGoogleLogin } from "../../features/auth/hooks/useGoogleLogin";
import { linkGoogleAccount } from "../../features/auth/services/authApi";
import { useTheme } from "../../features/theme/useTheme";
import ProfileActivitiesGrid from "../../features/profile/components/ProfileActivitiesGrid";
import ProfileAchievementsCard from "../../features/profile/components/ProfileAchievementsCard";
import ProfileAvatarActionSheet from "../../features/profile/components/ProfileAvatarActionSheet";
import ProfileAvatarViewerModal from "../../features/profile/components/ProfileAvatarViewerModal";
import ProfileHeader from "../../features/profile/components/ProfileHeader";
import ProfileMoreDrawer from "../../features/profile/components/ProfileMoreDrawer";
import ProfilePersonalInfoCard from "../../features/profile/components/ProfilePersonalInfoCard";
import ProfileRequestsSection from "../../features/profile/components/ProfileRequestsSection";
import { useProfileNotificationPreferences } from "../../features/profile/hooks/useProfileNotificationPreferences";
import { useProfileAvatar } from "../../features/profile/hooks/useProfileAvatar";
import { useProfileRequestShortcuts } from "../../features/profile/hooks/useProfileRequestShortcuts";
import { useProfileSummary } from "../../features/profile/hooks/useProfileSummary";
import {
  formatProfileRoleLabel,
  isApprovedVolunteer,
  MOCK_PROFILE_ACHIEVEMENTS,
  type ProfileRequestShortcutTab,
} from "../../features/profile/models/profile";

export default function MoreScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { displayName, isUser, session, updateUser } = useSession();
  const { mode, isDark, setMode } = useTheme();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [avatarSheetVisible, setAvatarSheetVisible] = useState(false);
  const [avatarViewerVisible, setAvatarViewerVisible] = useState(false);

  const user = session?.mode === "user" ? session.user : null;
  const hasPassword =
    Boolean(user?.passwordSet) || user?.authProvider === "local" || user?.authProvider === "both";
  const isGoogleLinked =
    Boolean(user?.googleLinked) || user?.authProvider === "google" || user?.authProvider === "both";

  const { summary, refresh: refreshProfileSummary } = useProfileSummary({
    enabled: isUser,
    user,
  });

  const {
    showDotFor,
    markShortcutSeen,
    markAllShortcutsSeen,
    refresh: refreshRequestCounts,
  } = useProfileRequestShortcuts({
    enabled: isUser,
    userId: user?.id,
  });

  const {
    communityUpdatesEnabled,
    volunteerAssignmentsEnabled,
    updating,
    canShowVolunteerAssignmentsToggle,
    onToggleCommunityUpdates,
    onToggleVolunteerAssignments,
  } = useProfileNotificationPreferences({
    enabled: isUser,
    role: user?.role,
    volunteerStatus: user?.volunteerStatus,
  });

  const {
    start: startGoogleLink,
    loading: linkingGoogle,
    clearError: clearGoogleLinkError,
  } = useGoogleLogin({
    onIdToken: async (idToken: string) => {
      const linkedUser = await linkGoogleAccount({ idToken });
      await updateUser({
        lifelineId: linkedUser.lifelineId,
        firstName: linkedUser.firstName,
        lastName: linkedUser.lastName,
        email: linkedUser.email,
        role: linkedUser.role,
        volunteerStatus: linkedUser.volunteerStatus,
        authProvider: linkedUser.authProvider,
        emailVerified: linkedUser.emailVerified,
        passwordSet: linkedUser.passwordSet,
        googleLinked: linkedUser.googleLinked,
      });

      Alert.alert("Success", "Google account linked successfully.");
    },
  });

  const onLogout = useCallback(() => {
    if (!isUser) {
      void (async () => {
        await signOut();
        router.replace("/(auth)/login");
      })();
      return;
    }

    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
            router.replace("/(auth)/login");
          } catch {
            Alert.alert("Logout failed", "Please try again.");
          }
        },
      },
    ]);
  }, [isUser, router, signOut]);

  const {
    avatarUrl: profileAvatarUrl,
    uploading: avatarUploading,
    hasAvatar,
    chooseFromLibrary,
    takePhoto,
    removeAvatar,
  } = useProfileAvatar({
    enabled: isUser,
    avatarUrl: summary.avatarUrl ?? user?.avatarUrl ?? null,
    onAvatarChanged: async () => {
      await refreshProfileSummary();
    },
  });

  const onPressAvatar = useCallback(() => {
    if (avatarUploading) return;

    if (!isUser) {
      Alert.alert("Sign in required", "Please sign in to upload your profile photo.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign In",
          onPress: () => {
            onLogout();
          },
        },
      ]);
      return;
    }

    setAvatarSheetVisible(true);
  }, [avatarUploading, isUser, onLogout]);

  const onTakeAvatarPhoto = useCallback(() => {
    setAvatarSheetVisible(false);
    void takePhoto();
  }, [takePhoto]);

  const onChooseAvatarFromLibrary = useCallback(() => {
    setAvatarSheetVisible(false);
    void chooseFromLibrary();
  }, [chooseFromLibrary]);

  const onViewAvatar = useCallback(() => {
    setAvatarSheetVisible(false);
    setAvatarViewerVisible(true);
  }, []);

  const onRemoveAvatar = useCallback(() => {
    setAvatarSheetVisible(false);
    void removeAvatar();
  }, [removeAvatar]);

  const onResetPassword = useCallback(() => {
    router.push("/forgot-password");
  }, [router]);

  const onCreatePassword = useCallback(() => {
    router.push("/set-password");
  }, [router]);

  const onLinkGoogle = useCallback(async () => {
    if (linkingGoogle) return;
    clearGoogleLinkError();
    await startGoogleLink();
  }, [clearGoogleLinkError, linkingGoogle, startGoogleLink]);

  const onPressProfileSettings = useCallback(() => {
    if (!isUser) {
      onLogout();
      return;
    }

    const actions: {
      text: string;
      style?: "default" | "cancel" | "destructive";
      onPress?: () => void;
    }[] = [
      {
        text: "Reset Password",
        onPress: onResetPassword,
      },
    ];

    if (isGoogleLinked && !hasPassword) {
      actions.push({
        text: "Create Password",
        onPress: onCreatePassword,
      });
    }

    if (hasPassword && !isGoogleLinked) {
      actions.push({
        text: linkingGoogle ? "Linking Google..." : "Link Google Account",
        onPress: () => {
          void onLinkGoogle();
        },
      });
    }

    actions.push({ text: "Cancel", style: "cancel" });

    Alert.alert("Profile Settings", "Manage your account credentials.", actions);
  }, [hasPassword, isGoogleLinked, isUser, linkingGoogle, onCreatePassword, onLinkGoogle, onLogout, onResetPassword]);

  const onComingSoon = useCallback((title: string) => {
    Alert.alert(title, "This page is not available yet.");
  }, []);

  const promptSignInForRequests = useCallback(() => {
    Alert.alert("Sign in required", "Please sign in to view your request history.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign In",
        onPress: () => {
          onLogout();
        },
      },
    ]);
  }, [onLogout]);

  const onPressRequestHistory = useCallback(() => {
    if (!isUser) {
      promptSignInForRequests();
      return;
    }

    markAllShortcutsSeen();
    router.push("/my-requests/history");
  }, [isUser, markAllShortcutsSeen, promptSignInForRequests, router]);

  const onPressRequestShortcut = useCallback(
    (tab: ProfileRequestShortcutTab) => {
      if (!isUser) {
        promptSignInForRequests();
        return;
      }

      markShortcutSeen(tab);
      router.push({ pathname: "/my-requests/history", params: { tab } });
    },
    [isUser, markShortcutSeen, promptSignInForRequests, router]
  );

  const onPressApplyVolunteer = useCallback(() => {
    if (!isUser) {
      Alert.alert("Sign in required", "Please sign in to apply as volunteer.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign In",
          onPress: () => {
            onLogout();
          },
        },
      ]);
      return;
    }

    router.push("/volunteer-apply-modal");
  }, [isUser, onLogout, router]);

  useFocusEffect(
    useCallback(() => {
      if (!isUser) return;

      void refreshRequestCounts();
      void refreshProfileSummary();
    }, [isUser, refreshProfileSummary, refreshRequestCounts])
  );

  const fullName = useMemo(() => {
    if (isUser) return summary.fullName || displayName;
    return "Guest User";
  }, [displayName, isUser, summary.fullName]);

  const roleLabel = useMemo(() => formatProfileRoleLabel(summary.role ?? user?.role), [summary.role, user?.role]);
  const showVerified = useMemo(
    () => isApprovedVolunteer(summary.role ?? user?.role, summary.volunteerStatus ?? user?.volunteerStatus),
    [summary.role, summary.volunteerStatus, user?.role, user?.volunteerStatus]
  );

  const isDarkModeEnabled = mode === "dark" || (mode === "system" && isDark);

  return (
    <GradientScreen gradientHeight={220}>
      <ScrollView
        className="bg-transparent"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        <ProfileHeader
          fullName={fullName}
          roleLabel={roleLabel}
          lifelineId={summary.lifelineId ?? user?.lifelineId}
          avatarUrl={profileAvatarUrl ?? summary.avatarUrl}
          avatarAuthToken={user?.accessToken}
          avatarUploading={avatarUploading}
          isGuest={!isUser}
          showVerified={showVerified}
          onPressAvatar={onPressAvatar}
          onPressEdit={onPressProfileSettings}
          onPressMenu={() => setDrawerVisible(true)}
        />

        <ProfileRequestsSection
          isUser={isUser}
          onPressRequestHistory={onPressRequestHistory}
          onPressRequestShortcut={onPressRequestShortcut}
          showDotFor={showDotFor}
        />

        <ProfileActivitiesGrid summary={summary} onPressApplyVolunteer={onPressApplyVolunteer} />
        <ProfilePersonalInfoCard summary={summary} />
        <ProfileAchievementsCard achievements={MOCK_PROFILE_ACHIEVEMENTS} />
      </ScrollView>

      <ProfileMoreDrawer
        visible={drawerVisible}
        isUser={isUser}
        canShowVolunteerAssignmentsToggle={canShowVolunteerAssignmentsToggle}
        communityUpdatesEnabled={communityUpdatesEnabled}
        volunteerAssignmentsEnabled={volunteerAssignmentsEnabled}
        updatingPrefs={updating}
        isDarkModeEnabled={isDarkModeEnabled}
        onClose={() => setDrawerVisible(false)}
        onPressProfileSettings={onPressProfileSettings}
        onToggleCommunityUpdates={onToggleCommunityUpdates}
        onToggleVolunteerAssignments={onToggleVolunteerAssignments}
        onToggleDarkMode={(nextValue) => setMode(nextValue ? "dark" : "light")}
        onPressResource={onComingSoon}
        onPressSupport={onComingSoon}
        onPressSessionAction={onLogout}
      />

      <ProfileAvatarActionSheet
        visible={avatarSheetVisible}
        hasAvatar={hasAvatar}
        uploading={avatarUploading}
        onClose={() => setAvatarSheetVisible(false)}
        onViewPhoto={onViewAvatar}
        onTakePhoto={onTakeAvatarPhoto}
        onChooseFromLibrary={onChooseAvatarFromLibrary}
        onRemovePhoto={onRemoveAvatar}
      />

      <ProfileAvatarViewerModal
        visible={avatarViewerVisible}
        avatarUrl={profileAvatarUrl ?? summary.avatarUrl}
        authToken={user?.accessToken}
        onClose={() => setAvatarViewerVisible(false)}
      />
    </GradientScreen>
  );
}

import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { BellRing, Lock, Shield, ShieldCheck } from "lucide-react-native";

export type AuthBlockedAction =
  | "report_emergency"
  | "view_request_history"
  | "accept_volunteer_dispatch"
  | "access_volunteer_tools"
  | "upload_profile_photo"
  | "manage_profile";

export type AuthRequiredModalProps = {
  visible: boolean;
  title?: string;
  message?: string;
  blockedAction?: AuthBlockedAction;
  onClose: () => void;
  onSignIn?: () => void;
  onLogin?: () => void;
  onRegister?: () => void;
};

const DEFAULT_TITLE = "Login Required";

const CONTEXT_BY_BLOCKED_ACTION: Record<AuthBlockedAction, string> = {
  report_emergency: "Sign in to submit and track emergency reports.",
  view_request_history: "Sign in to view your request history and updates.",
  accept_volunteer_dispatch: "Sign in to receive and manage volunteer dispatches.",
  access_volunteer_tools: "Sign in to receive and manage volunteer dispatches.",
  upload_profile_photo: "Sign in to save and sync your profile photo securely.",
  manage_profile: "Sign in to manage and secure your profile information.",
};

const BENEFITS = [
  {
    id: "track",
    label: "Track your emergency requests",
    Icon: ShieldCheck,
  },
  {
    id: "dispatch",
    label: "Receive volunteer dispatch updates",
    Icon: BellRing,
  },
  {
    id: "secure",
    label: "Keep your activity securely linked to your account",
    Icon: Shield,
  },
] as const;

export default function AuthRequiredModal({
  visible,
  title,
  message,
  blockedAction,
  onClose,
  onSignIn,
  onLogin,
  onRegister,
}: AuthRequiredModalProps) {
  const resolvedTitle = String(title ?? "").trim() || DEFAULT_TITLE;
  const resolvedMessage = String(message ?? "").trim();
  const contextualMessage = blockedAction ? CONTEXT_BY_BLOCKED_ACTION[blockedAction] : "";
  const handleSignIn = onSignIn ?? onLogin ?? onClose;
  const handleRegister = onRegister ?? handleSignIn;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center px-4">
        <BlurView intensity={78} tint="dark" style={StyleSheet.absoluteFillObject} />
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(2,6,23,0.52)" }]} />
        <View style={[styles.card, styles.cardShadow, styles.cardContainer]}>
          <View className="absolute -top-12 left-0 right-0 items-center">
            <View style={[styles.badge, styles.badgeShadow]}>
              <Lock size={28} color="#FFFFFF" strokeWidth={2.4} />
            </View>
          </View>

          <ScrollView
            bounces={false}
            contentContainerStyle={styles.cardContent}
            showsVerticalScrollIndicator={false}
          >
            <Text maxFontSizeMultiplier={1.15} style={styles.title}>
              {resolvedTitle}
            </Text>
            {resolvedMessage ? (
              <Text maxFontSizeMultiplier={1.1} style={styles.message}>
                {resolvedMessage}
              </Text>
            ) : null}
            {contextualMessage ? (
              <Text maxFontSizeMultiplier={1.1} style={styles.contextMessage}>
                {contextualMessage}
              </Text>
            ) : null}

            <View className="mt-4 px-3 py-2.5" style={styles.benefitsBox}>
              {BENEFITS.map(({ id, label, Icon }, index) => (
                <View key={id}>
                  <View className="flex-row items-center py-2">
                    <View className="h-7 w-7 items-center justify-center rounded-full bg-red-100">
                      <Icon size={16} color="#DC2626" strokeWidth={2.2} />
                    </View>
                    <Text maxFontSizeMultiplier={1.05} style={styles.benefitLabel}>
                      {label}
                    </Text>
                  </View>
                  {index < BENEFITS.length - 1 ? <View className="h-px bg-red-100" /> : null}
                </View>
              ))}
            </View>

            <View className="mt-4">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign in"
                onPress={handleSignIn}
                style={({ pressed }) => [styles.primaryButton, styles.primaryShadow, pressed ? styles.pressed : null]}
              >
                <Text maxFontSizeMultiplier={1.05} style={styles.primaryButtonText}>
                  Sign In
                </Text>
              </Pressable>
            </View>

            <View className="mt-2.5">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create account"
                onPress={handleRegister}
                style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}
              >
                <Text maxFontSizeMultiplier={1.05} style={styles.secondaryButtonText}>
                  Create Account
                </Text>
              </Pressable>
            </View>

            <View className="mt-3.5 items-center">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Maybe later"
                onPress={onClose}
                style={({ pressed }) => [styles.tertiaryButton, pressed ? styles.pressed : null]}
              >
                <Text maxFontSizeMultiplier={1.05} style={styles.tertiaryButtonText}>
                  Maybe Later
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.9,
  },
  cardShadow: {
    shadowColor: "#020617",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.34,
    shadowRadius: 30,
    elevation: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 30,
  },
  cardContainer: {
    width: 340,
    maxHeight: "48%",
  },
  cardContent: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 18,
  },
  title: {
    textAlign: "center",
    color: "#1E293B",
    fontWeight: "800",
    fontSize: 18,
    lineHeight: 24,
  },
  message: {
    marginTop: 8,
    textAlign: "center",
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
  },
  contextMessage: {
    marginTop: 15,
    marginBottom: 10,
    textAlign: "center",
    color: "#64748B",
    fontSize: 14,
    lineHeight: 18,
  },
  benefitLabel: {
    marginLeft: 10,
    flex: 1,
    color: "#334155",
    fontWeight: "700",
    fontSize: 13,
    lineHeight: 18,
  },
  benefitsBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: "#FEF2F2",
  },
  badgeShadow: {
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.34,
    shadowRadius: 18,
    elevation: 10,
  },
  badge: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: "#FECACA",
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryShadow: {
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  primaryButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 16,
  },
  secondaryButton: {
    width: "100%",
    minHeight: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  secondaryButtonText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 16,
  },
  tertiaryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tertiaryButtonText: {
    color: "#334155",
    fontWeight: "500",
    fontSize: 14,
    textDecorationLine: "underline",
  },
});

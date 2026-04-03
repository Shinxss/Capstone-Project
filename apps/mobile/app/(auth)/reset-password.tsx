import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { ArrowLeft, Shield } from "lucide-react-native";
import AuthBackground from "../../components/AuthBackground";
import AuthCard from "../../features/auth/components/AuthCard";
import PasswordChecklist from "../../features/auth/components/PasswordChecklist";
import { useResetPassword } from "../../features/auth/hooks/useResetPassword";

function normalizeParam(value: string | string[] | undefined) {
  const text = Array.isArray(value) ? value[0] : value;
  return (text ?? "").trim();
}

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string; resetToken?: string }>();
  const email = normalizeParam(params.email).toLowerCase();
  const resetToken = normalizeParam(params.resetToken);
  const vm = useResetPassword(email, resetToken);

  if (!vm.email || !resetToken) {
    return (
      <AuthBackground>
        <View className="flex-1 px-5 pt-20">
          <Pressable onPress={vm.goBack} className="h-11 w-11 items-center justify-center rounded-full bg-white/90" style={styles.backShadow}>
            <ArrowLeft size={23} color="#334155" strokeWidth={2.4} />
          </Pressable>

          <View className="mt-14">
            <AuthCard
              icon={<Shield size={30} color="#FFFFFF" strokeWidth={2.4} />}
              title="Create New Password"
              subtitle="Invalid password reset session. Go back and request a new verification code."
            >
              <Pressable onPress={vm.goBack} style={({ pressed }) => [styles.secondaryButton, pressed ? styles.pressed : null]}>
                <Text style={styles.secondaryButtonText}>Go Back</Text>
              </Pressable>
            </AuthCard>
          </View>
        </View>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.contentContainer}
        >
          <Pressable onPress={vm.goBack} className="h-11 w-11 items-center justify-center rounded-full bg-white/90" style={styles.backShadow}>
            <ArrowLeft size={23} color="#334155" strokeWidth={2.4} />
          </Pressable>

          <View className="mt-14">
            <AuthCard
              icon={<Shield size={30} color="#FFFFFF" strokeWidth={2.4} />}
              title="Create New Password"
              subtitle="Your new password must be secure and different from your previous one."
            >
              <View className="gap-3">
                <View className="relative">
                  <TextInput
                    value={vm.newPassword}
                    onChangeText={vm.setNewPassword}
                    secureTextEntry={!vm.showNewPassword}
                    placeholder="New Password"
                    placeholderTextColor="#94A3B8"
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="newPassword"
                    returnKeyType="next"
                    className={`h-15 border bg-white px-4 pr-12 pl-3 text-[15px] font-semibold text-slate-900 ${
                      vm.error ? "border-red-300" : "border-gray-200"
                    }`}
                    style={{ borderRadius: 8 }}
                  />
                  <Pressable
                    onPress={vm.toggleShowNewPassword}
                    className="absolute right-3 top-0 h-15 items-center justify-center"
                  >
                    <Ionicons
                      name={vm.showNewPassword ? "eye-off-outline" : "eye-outline"}
                      size={22}
                      color="#64748B"
                    />
                  </Pressable>
                </View>

                <View>
                  <View className="relative">
                    <TextInput
                      value={vm.confirmPassword}
                      onChangeText={vm.setConfirmPassword}
                      secureTextEntry={!vm.showConfirmPassword}
                      placeholder="Confirm New Password"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="password"
                      returnKeyType="done"
                      onSubmitEditing={vm.submit}
                      className={`h-15 border bg-white px-4 pr-12 pl-3 text-[15px] font-semibold text-slate-900 ${
                        vm.mismatchError ? "border-red-300" : "border-gray-200"
                      }`}
                      style={{ borderRadius: 8 }}
                    />
                    <Pressable
                      onPress={vm.toggleShowConfirmPassword}
                      className="absolute right-3 top-0 h-15 items-center justify-center"
                    >
                      <Ionicons
                        name={vm.showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color="#64748B"
                      />
                    </Pressable>
                  </View>

                  {vm.mismatchError ? (
                    <Text className="mt-1.5 text-[13px] font-medium text-red-600">{vm.mismatchError}</Text>
                  ) : null}
                </View>

                <PasswordChecklist checks={vm.passwordChecks} />

                {vm.error ? <Text className="text-[13px] font-medium text-red-600">{vm.error}</Text> : null}

                <Pressable
                  onPress={vm.submit}
                  disabled={!vm.canSubmit}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    !vm.canSubmit ? styles.primaryButtonDisabled : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>{vm.loading ? "Resetting..." : "Reset Password"}</Text>
                </Pressable>
              </View>
            </AuthCard>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 30,
  },
  backShadow: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryButton: {
    height: 48,
    width: "100%",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
  },
  primaryButtonDisabled: {
    opacity: 0.75,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FFFFFF",
  },
  secondaryButtonText: {
    color: "#DC2626",
    fontSize: 16,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.75,
  },
});

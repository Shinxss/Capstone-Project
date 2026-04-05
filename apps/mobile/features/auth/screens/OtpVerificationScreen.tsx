import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ArrowLeft, ShieldCheck } from "lucide-react-native";
import AuthBackground from "../../../components/AuthBackground";
import AuthCard from "../components/AuthCard";
import OtpCodeInput from "../components/OtpCodeInput";
import { useOtpVerification, type OtpMode } from "../hooks/useOtpVerification";

function normalizeMode(value: string | string[] | undefined): OtpMode {
  const mode = Array.isArray(value) ? value[0] : value;
  if (mode === "reset") return "reset";
  return "signup";
}

function normalizeParam(value: string | string[] | undefined) {
  const text = Array.isArray(value) ? value[0] : value;
  return (text ?? "").trim();
}

export default function OtpVerificationScreen() {
  const params = useLocalSearchParams<{ mode?: string; email?: string }>();
  const mode = normalizeMode(params.mode);
  const email = normalizeParam(params.email).toLowerCase();
  const vm = useOtpVerification(mode, email);
  const isVerifyDisabled = !vm.canSubmit || vm.loading;
  const displayContact = vm.maskedContact || vm.contact;

  if (!vm.contact) {
    return (
      <AuthBackground>
        <View className="flex-1 px-5 pt-20">
          <Pressable onPress={vm.goBack} className="h-11 w-11 items-center justify-center rounded-full bg-white/90" style={styles.backShadow}>
            <ArrowLeft size={23} color="#334155" strokeWidth={2.4} />
          </Pressable>

          <View className="mt-14">
            <AuthCard
              icon={<ShieldCheck size={30} color="#FFFFFF" strokeWidth={2.4} />}
              title={vm.title}
              subtitle={`Missing ${vm.contactLabel} information for verification. Please go back and request a new code.`}
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
              icon={<ShieldCheck size={30} color="#FFFFFF" strokeWidth={2.4} />}
              title={vm.title}
              subtitle={vm.subtitle}
            >
              <View className="gap-3">
                <Text className="text-center text-[15px] text-slate-600">
                  Code sent to{" "}
                  <Text className="font-semibold text-slate-800">
                    {displayContact}
                  </Text>
                </Text>

                <OtpCodeInput
                  digits={vm.otpDigits}
                  onChangeDigits={vm.setOtpDigits}
                  length={vm.otpLength}
                  disabled={vm.loading}
                  hasError={Boolean(vm.error)}
                />

                {vm.error ? (
                  <Text className="text-center text-[13px] font-medium text-red-600">{vm.error}</Text>
                ) : (
                  <Text className="text-center text-[13px] text-slate-500">
                    Check your inbox and spam folder for the latest code.
                  </Text>
                )}

                <View className="items-center">
                  {vm.canResend ? (
                    <Pressable onPress={vm.resend} disabled={vm.resending} className="px-2 py-1">
                      <Text className="text-[15px] font-bold text-red-600">
                        {vm.resending ? "Sending..." : "Resend Code"}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text className="text-[14px] font-medium text-slate-500">{vm.resendLabel}</Text>
                  )}
                </View>

                <Pressable
                  onPress={vm.submit}
                  disabled={isVerifyDisabled}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    isVerifyDisabled ? styles.primaryButtonDisabled : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>{vm.loading ? "Verifying..." : "Verify"}</Text>
                </Pressable>

                <View className="flex-row items-center justify-center">
                  <Text className="text-[15px] text-slate-600">Wrong {vm.contactLabel}? </Text>
                  <Pressable onPress={vm.goBack}>
                    <Text className="text-[15px] font-bold text-red-600">Go back</Text>
                  </Pressable>
                </View>
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
    marginTop: 6,
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 5,
  },
  primaryButtonDisabled: {
    backgroundColor: "#F87171",
    shadowOpacity: 0,
    elevation: 0,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
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
    opacity: 0.92,
  },
});

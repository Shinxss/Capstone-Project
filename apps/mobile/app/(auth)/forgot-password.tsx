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
import { ArrowLeft, KeyRound } from "lucide-react-native";
import AuthBackground from "../../components/AuthBackground";
import AuthCard from "../../features/auth/components/AuthCard";
import { useForgotPassword } from "../../features/auth/hooks/useForgotPassword";

export default function ForgotPasswordScreen() {
  const vm = useForgotPassword();
  const isDisabled = !vm.canSubmit || vm.loading;

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
              icon={<KeyRound size={30} color="#FFFFFF" strokeWidth={2.4} />}
              title="Forgot Password"
              subtitle="Enter your registered email and we'll send a verification code."
            >
              <View className="gap-3">
                <TextInput
                  value={vm.email}
                  onChangeText={vm.setEmail}
                  placeholder="Email Address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  returnKeyType="done"
                  onSubmitEditing={vm.submit}
                  placeholderTextColor="#94A3B8"
                  className={`h-14 rounded-2xl border bg-white px-4 text-[16px] font-semibold text-slate-900 ${
                    vm.error ? "border-red-300" : "border-slate-200"
                  }`}
                />

                {vm.error ? <Text className="text-[13px] font-medium text-red-600">{vm.error}</Text> : null}

                <Pressable
                  onPress={vm.submit}
                  disabled={isDisabled}
                  style={({ pressed }) => [
                    styles.primaryButton,
                    isDisabled ? styles.primaryButtonDisabled : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <Text style={styles.primaryButtonText}>{vm.loading ? "Sending Code..." : "Send Code"}</Text>
                </Pressable>

                <View className="mt-1 flex-row items-center justify-center">
                  <Text className="text-[15px] text-slate-600">Remember your password? </Text>
                  <Pressable onPress={vm.goToLogin}>
                    <Text className="text-[15px] font-bold text-red-600">Sign In</Text>
                  </Pressable>
                </View>

                <View style={styles.footerSpacer} />
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
    fontSize: 16,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.92,
  },
  footerSpacer: {
    height: 18,
  },
});

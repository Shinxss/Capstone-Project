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
                  className={`h-15 border bg-white px-6 pl-3 text-[15px] font-semibold text-slate-900 ${
                    vm.error ? "border-red-300" : "border-gray-200"
                  }`}
                  style={{ borderRadius: 8 }}
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
    marginTop: 14,
    height: 48,
    width: "100%",
    borderRadius: 8,
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
  pressed: {
    opacity: 0.75,
  },
  footerSpacer: {
    height: 18,
  },
});

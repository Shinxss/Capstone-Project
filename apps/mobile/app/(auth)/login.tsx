import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AuthBackground from "../../components/AuthBackground";
import LoginForm from "../../features/auth/components/LoginForm";
import { useLogin } from "../../features/auth/hooks/useLogin";

export default function LoginScreen() {
  const vm = useLogin();

  return (
    <AuthBackground>
      <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.safe}
        >
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <View style={styles.skipRow}>
              <Pressable onPress={vm.skip} disabled={vm.guestLoading}>
                <Text style={{ color: "#EF4444", fontSize: 15, fontWeight: "600", opacity: vm.guestLoading ? 0.65 : 1 }}>
                  {vm.guestLoading ? "Opening guest home..." : "Skip >"}
                </Text>
              </Pressable>
            </View>

            <LoginForm
              identifier={vm.identifier}
              password={vm.password}
              showPassword={vm.showPassword}
              loading={vm.loading}
              googleLoading={vm.googleLoading}
              loginCooldownSeconds={vm.loginCooldownSeconds}
              error={vm.error}
              onChangeIdentifier={vm.setIdentifier}
              onChangePassword={vm.setPassword}
              onToggleShowPassword={vm.toggleShowPassword}
              onForgotPassword={vm.goForgotPassword}
              onLogin={vm.onLogin}
              onGoogle={vm.onGoogle}
              onGoSignup={vm.goSignup}
            />
          </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 24 },
  skipRow: { width: "100%", alignItems: "flex-end", paddingTop: 12, paddingHorizontal: 28 },
});

import React from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import AuthBackground from "../../components/AuthBackground";
import SignupForm from "../../features/auth/components/SignupForm";
import { useSignup } from "../../features/auth/hooks/useSignup";

export default function SignupScreen() {
  const vm = useSignup();

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
            <SignupForm
              firstName={vm.firstName}
              lastName={vm.lastName}
              email={vm.email}
              password={vm.password}
              confirm={vm.confirm}
              showPassword={vm.showPassword}
              showConfirm={vm.showConfirm}
              agree={vm.agree}
              loading={vm.loading}
              googleLoading={vm.googleLoading}
              error={vm.error}
              onChangeFirst={vm.setFirst}
              onChangeLast={vm.setLast}
              onChangeEmail={vm.setEmail}
              onChangePassword={vm.setPass}
              onChangeConfirm={vm.setConfirm}
              onToggleShowPassword={vm.toggleShowPassword}
              onToggleShowConfirm={vm.toggleShowConfirm}
              onToggleAgree={vm.toggleAgree}
              onSignup={vm.onSignup}
              onGoogle={vm.onGoogle}
              onGoLogin={vm.goLogin}
            />
          </ScrollView>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 24 },
});

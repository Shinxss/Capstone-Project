import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import AuthBackground from "../../components/AuthBackground";
import LoginForm from "../../features/auth/components/LoginForm";
import { useLogin } from "../../features/auth/hooks/useLogin";

export default function LoginScreen() {
  const vm = useLogin();

  return (
    <AuthBackground>
      <View className="w-full items-end pt-20 px-7">
        <Pressable onPress={vm.skip}>
          <Text style={{ color: "#EF4444", fontSize: 15, fontWeight: "600" }}>Skip &gt;</Text>
        </Pressable>
      </View>

      <LoginForm
        email={vm.email}
        password={vm.password}
        showPassword={vm.showPassword}
        loading={vm.loading}
        error={vm.error}
        onChangeEmail={vm.setEmail}
        onChangePassword={vm.setPassword}
        onToggleShowPassword={vm.toggleShowPassword}
        onForgotPassword={() => Alert.alert("Forgot Password", "Add your reset flow here.")}
        onLogin={vm.onLogin}
        onGoogle={() => Alert.alert("Google Sign-In", "We can wire this after the basic auth is done.")}
        onGoSignup={vm.goSignup}
      />
    </AuthBackground>
  );
}

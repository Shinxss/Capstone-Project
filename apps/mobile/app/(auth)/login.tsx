import React from "react";
import { Pressable, Text, View } from "react-native";
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
        authMode={vm.authMode}
        email={vm.email}
        password={vm.password}
        countryRegion={vm.countryRegion}
        phoneNumber={vm.phoneNumber}
        showPassword={vm.showPassword}
        loading={vm.loading}
        googleLoading={vm.googleLoading}
        loginCooldownSeconds={vm.loginCooldownSeconds}
        error={vm.error}
        onChangeEmail={vm.setEmail}
        onChangePassword={vm.setPassword}
        onChangeCountryRegion={vm.setCountryRegion}
        onChangePhoneNumber={vm.setPhoneNumber}
        onToggleShowPassword={vm.toggleShowPassword}
        onToggleAuthMode={vm.toggleAuthMode}
        onForgotPassword={vm.goForgotPassword}
        onLogin={vm.onLogin}
        onSendOtp={vm.onSendOtp}
        onGoogle={vm.onGoogle}
        onGoSignup={vm.goSignup}
      />
    </AuthBackground>
  );
}

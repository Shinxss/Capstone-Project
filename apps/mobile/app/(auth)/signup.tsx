import React from "react";
import { Alert } from "react-native";
import AuthBackground from "../../components/AuthBackground";
import SignupForm from "../../features/auth/components/SignupForm";
import { useSignup } from "../../features/auth/hooks/useSignup";

export default function SignupScreen() {
  const vm = useSignup();

  return (
    <AuthBackground>
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
        onGoogle={() => Alert.alert("Google Sign-In", "We can wire this after the basic auth is done.")}
        onGoLogin={vm.goLogin}
      />
    </AuthBackground>
  );
}

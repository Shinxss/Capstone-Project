import React from "react";
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
    </AuthBackground>
  );
}

import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import AuthBackground from "../../components/AuthBackground";
import { useForgotPassword } from "../../features/auth/hooks/useForgotPassword";

export default function ForgotPasswordScreen() {
  const vm = useForgotPassword();

  return (
    <AuthBackground>
      <View className="flex-1 px-5 pt-28">
        <Pressable onPress={vm.goBack} className="mb-6">
          <Text className="text-[15px] font-semibold text-gray-700">{`< Back`}</Text>
        </Pressable>

        <Text className="text-[28px] font-bold text-gray-700">Forgot Password</Text>
        <Text className="mt-2 text-[14px] text-gray-500">
          Enter your email and we will send a password reset OTP.
        </Text>

        <View className="mt-6 gap-3">
          <TextInput
            value={vm.email}
            onChangeText={vm.setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#9CA3AF"
            className="h-14 rounded border border-gray-200 bg-white px-4 text-[15px] font-semibold"
          />

          {vm.error ? <Text className="text-[13px] text-red-500">{vm.error}</Text> : null}

          <Pressable
            onPress={vm.submit}
            disabled={vm.loading}
            style={({ pressed }) => ({
              marginTop: 8,
              height: 48,
              borderRadius: 10,
              backgroundColor: "#EF4444",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed || vm.loading ? 0.75 : 1,
            })}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
              {vm.loading ? "Sending OTP..." : "Send OTP"}
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthBackground>
  );
}

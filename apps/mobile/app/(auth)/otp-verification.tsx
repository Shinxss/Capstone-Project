import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import AuthBackground from "../../components/AuthBackground";
import { useOtpVerification, type OtpMode } from "../../features/auth/hooks/useOtpVerification";

function normalizeMode(value: string | string[] | undefined): OtpMode {
  const mode = Array.isArray(value) ? value[0] : value;
  return mode === "reset" ? "reset" : "signup";
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

  if (!email) {
    return (
      <AuthBackground>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[16px] font-semibold text-red-500">Missing email for OTP verification.</Text>
          <Pressable onPress={vm.goBack} className="mt-4">
            <Text className="text-[15px] font-semibold text-blue-500">Go back</Text>
          </Pressable>
        </View>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <View className="flex-1 px-5 pt-28">
        <Pressable onPress={vm.goBack} className="mb-6">
          <Text className="text-[15px] font-semibold text-gray-700">{`< Back`}</Text>
        </Pressable>

        <Text className="text-[28px] font-bold text-gray-700">{vm.title}</Text>
        <Text className="mt-2 text-[14px] text-gray-500">We sent a 6-digit OTP to {email}</Text>

        <View className="mt-6 gap-3">
          <TextInput
            value={vm.otp}
            onChangeText={(text) => vm.setOtp(text.replace(/[^0-9]/g, ""))}
            maxLength={6}
            keyboardType="number-pad"
            placeholder="Enter 6-digit OTP"
            placeholderTextColor="#9CA3AF"
            className="h-14 rounded border border-gray-200 bg-white px-4 text-[18px] font-semibold tracking-[2px]"
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
              {vm.loading ? "Verifying..." : "Verify OTP"}
            </Text>
          </Pressable>

          <Pressable onPress={vm.resend} disabled={vm.resending} className="mt-2">
            <Text className="text-[14px] font-semibold text-blue-500">
              {vm.resending ? "Resending..." : "Resend OTP"}
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthBackground>
  );
}

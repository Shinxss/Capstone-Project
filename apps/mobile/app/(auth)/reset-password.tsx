import React from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import AuthBackground from "../../components/AuthBackground";
import { useResetPassword } from "../../features/auth/hooks/useResetPassword";

function normalizeParam(value: string | string[] | undefined) {
  const text = Array.isArray(value) ? value[0] : value;
  return (text ?? "").trim();
}

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string; resetToken?: string }>();
  const email = normalizeParam(params.email).toLowerCase();
  const resetToken = normalizeParam(params.resetToken);
  const vm = useResetPassword(email, resetToken);

  if (!email || !resetToken) {
    return (
      <AuthBackground>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-[16px] font-semibold text-red-500">Invalid password reset session.</Text>
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

        <Text className="text-[28px] font-bold text-gray-700">Reset Password</Text>
        <Text className="mt-2 text-[14px] text-gray-500">Create a new password for {email}</Text>

        <View className="mt-6 gap-3">
          <View className="relative">
            <TextInput
              value={vm.newPassword}
              onChangeText={vm.setNewPassword}
              secureTextEntry={!vm.showNewPassword}
              placeholder="New Password"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              className="h-14 rounded border border-gray-200 bg-white px-4 pr-12 text-[15px] font-semibold"
            />
            <Pressable
              onPress={vm.toggleShowNewPassword}
              className="absolute right-3 top-0 h-14 items-center justify-center"
            >
              <Ionicons
                name={vm.showNewPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#9CA3AF"
              />
            </Pressable>
          </View>

          <View className="relative">
            <TextInput
              value={vm.confirmPassword}
              onChangeText={vm.setConfirmPassword}
              secureTextEntry={!vm.showConfirmPassword}
              placeholder="Confirm Password"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              className="h-14 rounded border border-gray-200 bg-white px-4 pr-12 text-[15px] font-semibold"
            />
            <Pressable
              onPress={vm.toggleShowConfirmPassword}
              className="absolute right-3 top-0 h-14 items-center justify-center"
            >
              <Ionicons
                name={vm.showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#9CA3AF"
              />
            </Pressable>
          </View>

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
              {vm.loading ? "Updating..." : "Update Password"}
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthBackground>
  );
}

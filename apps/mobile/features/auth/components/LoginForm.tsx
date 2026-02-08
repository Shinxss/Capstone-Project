import React from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LifelineLogo from "../../../components/LifelineLogo";
import GoogleIcon from "../../../components/GoogleIcon";

type Props = {
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
  error: string | null;
  onChangeEmail: (v: string) => void;
  onChangePassword: (v: string) => void;
  onToggleShowPassword: () => void;
  onForgotPassword: () => void;
  onLogin: () => void;
  onGoogle: () => void;
  onGoSignup: () => void;
};

export default function LoginForm({
  email,
  password,
  showPassword,
  loading,
  error,
  onChangeEmail,
  onChangePassword,
  onToggleShowPassword,
  onForgotPassword,
  onLogin,
  onGoogle,
  onGoSignup,
}: Props) {
  return (
    <View className="flex-1 px-5 pt-45">
      <View className="mb-10">
        <LifelineLogo />
      </View>

      <View className="gap-3">
        <TextInput
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          className="h-15 rounded border border-gray-200 bg-white px-6 pl-3 text-[15px] font-semibold"
          value={email}
          onChangeText={onChangeEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <View className="relative">
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9CA3AF"
            className="h-15 rounded border border-gray-200 bg-white px-4 pr-12 pl-3 text-[15px] font-semibold text-gray-900"
            value={password}
            onChangeText={onChangePassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <Pressable
            onPress={onToggleShowPassword}
            className="absolute right-3 top-0 h-15 items-center justify-center"
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={23}
              color="#9CA3AF"
            />
          </Pressable>
        </View>

        <Pressable onPress={onForgotPassword}>
          <Text className="text-[15px] text-gray-700">Forgot Password?</Text>
        </Pressable>

        {error ? <Text className="text-[15px] text-red-500">{error}</Text> : null}

        <Pressable
          onPress={onLogin}
          disabled={loading}
          style={({ pressed }) => ({
            marginTop: 14,
            height: 48,
            width: "100%",
            borderRadius: 10,
            backgroundColor: "#EF4444",
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed || loading ? 0.75 : 1,
          })}
        >
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
            {loading ? "Logging in..." : "Login"}
          </Text>
        </Pressable>

        {/* OR divider (fixed) */}
        <View className="my-3 flex-row items-center">
          <View className="h-px flex-1 bg-gray-200" />
          <Text className="mx-3 text-[12px] text-gray-500 font-semibold">OR</Text>
          <View className="h-px flex-1 bg-gray-200" />
        </View>

        <Pressable
          onPress={onGoogle}
          className="h-14 flex-row items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white"
        >
          <GoogleIcon />
          <Text className="text-[15px] text-gray-800">Continue with Google</Text>
        </Pressable>

        <View className="mt-25 flex-row justify-center">
          <Text className="text-[15px] text-gray-700">Don't have an account? </Text>
          <Text onPress={onGoSignup} style={{ color: "#3B82F6", fontSize: 15, fontWeight: "500" }}>
            Sign up
          </Text>
        </View>
      </View>
    </View>
  );
}

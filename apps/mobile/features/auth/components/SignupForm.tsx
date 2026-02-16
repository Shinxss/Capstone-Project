import React from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GoogleIcon from "../../../components/GoogleIcon";

type Props = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirm: string;
  showPassword: boolean;
  showConfirm: boolean;
  agree: boolean;
  loading: boolean;
  googleLoading: boolean;
  error: string | null;

  onChangeFirst: (v: string) => void;
  onChangeLast: (v: string) => void;
  onChangeEmail: (v: string) => void;
  onChangePassword: (v: string) => void;
  onChangeConfirm: (v: string) => void;

  onToggleShowPassword: () => void;
  onToggleShowConfirm: () => void;
  onToggleAgree: () => void;

  onSignup: () => void;
  onGoogle: () => void;
  onGoLogin: () => void;
};

export default function SignupForm({
  firstName,
  lastName,
  email,
  password,
  confirm,
  showPassword,
  showConfirm,
  agree,
  loading,
  googleLoading,
  error,
  onChangeFirst,
  onChangeLast,
  onChangeEmail,
  onChangePassword,
  onChangeConfirm,
  onToggleShowPassword,
  onToggleShowConfirm,
  onToggleAgree,
  onSignup,
  onGoogle,
  onGoLogin,
}: Props) {
  return (
    <View className="flex-1 px-5 pt-40">
      <Text className="mb-15 text-center text-[30px] font-bold text-gray-500">
        Create an account
      </Text>

      <View className="gap-3">
        <View className="flex-row gap-3">
          <TextInput
            placeholder="First Name"
            placeholderTextColor="#9CA3AF"
            className="h-15 flex-1 rounded border border-gray-200 bg-white px-4 pl-3 text-[15px] font-semibold"
            value={firstName}
            onChangeText={onChangeFirst}
          />
          <TextInput
            placeholder="Last Name"
            placeholderTextColor="#9CA3AF"
            className="h-15 flex-1 rounded border border-gray-200 bg-white px-4 pl-3 text-[15px] font-semibold"
            value={lastName}
            onChangeText={onChangeLast}
          />
        </View>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#9CA3AF"
          className="h-15 rounded border border-gray-200 bg-white px-4 pl-3 text-[15px] font-semibold"
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

        <View className="relative">
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#9CA3AF"
            className="h-15 rounded border border-gray-200 bg-white px-4 pr-12 pl-3 text-[15px] font-semibold text-gray-900"
            value={confirm}
            onChangeText={onChangeConfirm}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
          />
          <Pressable
            onPress={onToggleShowConfirm}
            className="absolute right-3 top-0 h-15 items-center justify-center"
          >
            <Ionicons
              name={showConfirm ? "eye-off-outline" : "eye-outline"}
              size={23}
              color="#9CA3AF"
            />
          </Pressable>
        </View>

        {error ? <Text className="text-[12px] text-red-500">{error}</Text> : null}

        <Pressable
          onPress={onSignup}
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
          <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}>
            {loading ? "Signing up..." : "Sign up"}
          </Text>
        </Pressable>

        {/* OR divider */}
        <View className="my-3 flex-row items-center">
          <View className="h-px flex-1 bg-gray-200" />
          <Text className="mx-3 text-[12px] text-gray-500 font-semibold">OR</Text>
          <View className="h-px flex-1 bg-gray-200" />
        </View>

        <Pressable
          onPress={onGoogle}
          disabled={googleLoading}
          className="h-14 flex-row items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white"
          style={({ pressed }) => ({
            opacity: pressed || googleLoading ? 0.75 : 1,
          })}
        >
          <GoogleIcon />
          <Text className="text-[15px] text-gray-800">
            {googleLoading ? "Signing in with Google..." : "Continue with Google"}
          </Text>
        </Pressable>

        <View className="mt-6 flex-row justify-center">
          <Text className="text-[15px] text-gray-700">Already have an account? </Text>
          <Text onPress={onGoLogin} style={{ color: "#3B82F6", fontSize: 15, fontWeight: "500" }}>
            Log in
          </Text>
        </View>

        {/* Terms checkbox */}
        <Pressable
          onPress={onToggleAgree}
          style={{ marginTop: 55, flexDirection: "row", alignItems: "flex-start", gap: 10 }}
        >
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 4,
              borderWidth: 1.5,
              borderColor: "#EF4444",
              backgroundColor: agree ? "#EF4444" : "transparent",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 2,
            }}
          >
            {agree ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
          </View>

          <Text style={{ flex: 1, fontSize: 13, color: "#4B5563", lineHeight: 16, textAlign: "justify" }}>
            By signing up you agree to our{" "}
            <Text style={{ color: "#3B82F6", textDecorationLine: "underline" }}>Terms of Service</Text> and{" "}
            <Text style={{ color: "#3B82F6", textDecorationLine: "underline" }}>Privacy Policy</Text>.
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

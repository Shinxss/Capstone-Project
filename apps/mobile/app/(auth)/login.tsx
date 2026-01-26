import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AuthBackground from "../../components/AuthBackground";
import LifelineLogo from "../../components/LifelineLogo";
import GoogleIcon from "../../components/GoogleIcon";
import { api } from "../../lib/api";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLogin() {
    setError(null);
    setLoading(true);
    try {
      const res = await api.post("/api/auth/community/login", { email, password });
      const token = res.data?.data?.accessToken;
      if (!token) throw new Error("No token returned");

      // store token (simple)
      // you can replace with SecureStore later
      // @ts-ignore
      globalThis.__lifeline_token = token;

      router.replace("/(tabs)"); // change to your real home route
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthBackground>
      <View className="flex-1 px-7 pt-20">
        <View className="mb-10">
          <LifelineLogo />
        </View>

        <View className="gap-3">
          <TextInput
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            className="h-12 rounded border border-gray-200 bg-white px-4 text-[14px]"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View className="relative">
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              className="h-12 rounded border border-gray-200 bg-white px-4 pr-12 text-[14px]"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!show}
              autoCapitalize="none"
            />
            <Pressable
              onPress={() => setShow((s) => !s)}
              className="absolute right-3 top-0 h-12 items-center justify-center"
            >
              <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          <Pressable onPress={() => Alert.alert("Forgot Password", "Add your reset flow here.")}>
            <Text className="text-[12px] text-gray-700">Forgot Password?</Text>
          </Pressable>

          {error ? <Text className="text-[12px] text-red-500">{error}</Text> : null}

          <Pressable
            onPress={onLogin}
            disabled={loading}
            className="mt-2 h-12 items-center justify-center rounded bg-red-500"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            <Text className="text-[14px] font-semibold text-white">
              {loading ? "Logging in..." : "Login"}
            </Text>
          </Pressable>

          {/* OR divider */}
          <View className="my-3 flex-row items-center">
            <View className="h-[1px] flex-1 bg-gray-200" />
            <Text className="mx-3 text-[12px] text-gray-400">OR</Text>
            <View className="h-[1px] flex-1 bg-gray-200" />
          </View>

          {/* Google button */}
          <Pressable
            onPress={() => Alert.alert("Google Sign-In", "We can wire this after the basic auth is done.")}
            className="h-12 flex-row items-center justify-center gap-2 rounded border border-gray-200 bg-white"
          >
            <GoogleIcon />
            <Text className="text-[13px] text-gray-800">Continue with Google</Text>
          </Pressable>

          <View className="mt-10 flex-row justify-center">
            <Text className="text-[12px] text-gray-700">Don't have an account? </Text>
            <Link href="/(auth)/signup" className="text-[12px] text-blue-500">
              Sign up
            </Link>
          </View>
        </View>
      </View>
    </AuthBackground>
  );
}

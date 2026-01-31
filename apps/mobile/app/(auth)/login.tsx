import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AuthBackground from "../../components/AuthBackground";
import LifelineLogo from "../../components/LifelineLogo";
import GoogleIcon from "../../components/GoogleIcon";
import { api } from "../../lib/api";
import { StatusBar } from "expo-status-bar";


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

      <View className="w-full items-end pt-20 px-7">
        <Pressable onPress={() => router.replace("/(tabs)")}>
          <Text style={{ color: "#EF4444", fontSize: 15, fontWeight: "600" }}>
            Skip &gt;
          </Text>
        </Pressable>
      </View>

      
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
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <View className="relative">
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9CA3AF"
              className="h-15 rounded border border-gray-200 bg-white px-4 pr-12 pl-3 text-[15px] font-semibold"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!show}
              autoCapitalize="none"
            />
            <Pressable
              onPress={() => setShow((s) => !s)}
              className="absolute right-3 top-0 h-15 items-center justify-center"
            >
              <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={23} color="#9CA3AF" />
            </Pressable>
          </View>

          <Pressable onPress={() => Alert.alert("Forgot Password", "Add your reset flow here.")}>
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

          {/* OR divider */}
          <View className="my-3 flex-row items-center">
            <View className="h-[1px flex-1 bg-gray-200" />
            <Text className="mx-3 text-[12px] text-gray-500 font-semibold">OR</Text>
            <View className="h-1px flex-1 bg-gray-200" />
          </View>

          {/* Google button */}
          <Pressable
            onPress={() => Alert.alert("Google Sign-In", "We can wire this after the basic auth is done.")}
            className="h-14 flex-row items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white"
          >
            <GoogleIcon />
            <Text className="text-[15px] text-gray-800">Continue with Google</Text>
          </Pressable>

          <View className="mt-25 flex-row justify-center">
            <Text className="text-[15px] text-gray-700">Don't have an account? </Text>

            <Link href="/signup" asChild>
              <Text style={{ color: "#3B82F6", fontSize: 15, fontWeight: "500",  }}>
                Sign up
              </Text>
            </Link>
          </View>

        </View>
      </View>
    </AuthBackground>
  );
}

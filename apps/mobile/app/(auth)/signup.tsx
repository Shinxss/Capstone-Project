import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AuthBackground from "../../components/AuthBackground";
import GoogleIcon from "../../components/GoogleIcon";
import { api } from "../../lib/api";

export default function SignupScreen() {
  const router = useRouter();
  const [firstName, setFirst] = useState("");
  const [lastName, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignup() {
    setError(null);
    if (!agree) return setError("Please agree to Terms and Privacy Policy.");
    if (password !== confirm) return setError("Passwords do not match.");

    setLoading(true);
    try {
      await api.post("/api/auth/community/register", {
        firstName,
        lastName,
        email,
        password,
      });

      Alert.alert("Success", "Account created. Please log in.");
      router.replace("/(auth)/login");
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthBackground>
      <View className="flex-1 px-7 pt-16">
        <Text className="mb-6 text-center text-[22px] font-semibold text-gray-500">
          Create an account
        </Text>

        <View className="gap-3">
          <View className="flex-row gap-3">
            <TextInput
              placeholder="First Name"
              placeholderTextColor="#9CA3AF"
              className="h-12 flex-1 rounded border border-gray-200 bg-white px-4 text-[14px]"
              value={firstName}
              onChangeText={setFirst}
            />
            <TextInput
              placeholder="Last Name"
              placeholderTextColor="#9CA3AF"
              className="h-12 flex-1 rounded border border-gray-200 bg-white px-4 text-[14px]"
              value={lastName}
              onChangeText={setLast}
            />
          </View>

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
              onChangeText={setPass}
              secureTextEntry={!show1}
              autoCapitalize="none"
            />
            <Pressable
              onPress={() => setShow1((s) => !s)}
              className="absolute right-3 top-0 h-12 items-center justify-center"
            >
              <Ionicons name={show1 ? "eye-off-outline" : "eye-outline"} size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          <View className="relative">
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#9CA3AF"
              className="h-12 rounded border border-gray-200 bg-white px-4 pr-12 text-[14px]"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!show2}
              autoCapitalize="none"
            />
            <Pressable
              onPress={() => setShow2((s) => !s)}
              className="absolute right-3 top-0 h-12 items-center justify-center"
            >
              <Ionicons name={show2 ? "eye-off-outline" : "eye-outline"} size={18} color="#9CA3AF" />
            </Pressable>
          </View>

          {error ? <Text className="text-[12px] text-red-500">{error}</Text> : null}

          <Pressable
            onPress={onSignup}
            disabled={loading}
            className="mt-2 h-12 items-center justify-center rounded bg-red-500"
            style={{ opacity: loading ? 0.7 : 1 }}
          >
            <Text className="text-[14px] font-semibold text-white">
              {loading ? "Signing up..." : "Sign up"}
            </Text>
          </Pressable>

          {/* OR divider */}
          <View className="my-3 flex-row items-center">
            <View className="h-[1px] flex-1 bg-gray-200" />
            <Text className="mx-3 text-[12px] text-gray-400">OR</Text>
            <View className="h-[1px] flex-1 bg-gray-200" />
          </View>

          <Pressable
            onPress={() => Alert.alert("Google Sign-In", "We can wire this after the basic auth is done.")}
            className="h-12 flex-row items-center justify-center gap-2 rounded border border-gray-200 bg-white"
          >
            <GoogleIcon />
            <Text className="text-[13px] text-gray-800">Continue with Google</Text>
          </Pressable>

          <View className="mt-2 flex-row justify-center">
            <Text className="text-[12px] text-gray-700">Already have an account? </Text>
            <Link href="/(auth)/login" className="text-[12px] text-blue-500">
              Log in
            </Link>
          </View>

          {/* Terms checkbox */}
          <Pressable
            onPress={() => setAgree((v) => !v)}
            className="mt-4 flex-row items-start gap-2"
          >
            <View
              className="mt-[2px] h-4 w-4 rounded border border-gray-400"
              style={{ backgroundColor: agree ? "#ef4444" : "transparent" }}
            />
            <Text className="flex-1 text-[10px] text-gray-600">
              By signing up you agree to our{" "}
              <Text className="text-blue-500 underline">Terms and Service</Text> and{" "}
              <Text className="text-blue-500 underline">Privacy Policy</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </AuthBackground>
  );
}

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
              onChangeText={setFirst}
            />
            <TextInput
              placeholder="Last Name"
              placeholderTextColor="#9CA3AF"
              className="h-15 flex-1 rounded border border-gray-200 bg-white px-4 pl-3 text-[15px] font-semibold"
              value={lastName}
              onChangeText={setLast}
            />
          </View>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            className="h-15 rounded border border-gray-200 bg-white px-4 pl-3 text-[15px] font-semibold"
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
              onChangeText={setPass}
              secureTextEntry={!show1}
              autoCapitalize="none"
            />
            <Pressable
              onPress={() => setShow1((s) => !s)}
              className="absolute right-3 top-0 h-15 items-center justify-center"
            >
              <Ionicons name={show1 ? "eye-off-outline" : "eye-outline"} size={23} color="#9CA3AF" />
            </Pressable>
          </View>

          <View className="relative">
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#9CA3AF"
              className="h-15 rounded border border-gray-200 bg-white px-4 pr-12 pl-3 text-[15px] font-semibold"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!show2}
              autoCapitalize="none"
            />
            <Pressable
              onPress={() => setShow2((s) => !s)}
              className="absolute right-3 top-0 h-15 items-center justify-center"
            >
              <Ionicons name={show2 ? "eye-off-outline" : "eye-outline"} size={23} color="#9CA3AF" />
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
            <View className="h-1px flex-1 bg-gray-200" />
            <Text className="mx-3 text-[12px] text-gray-500 font-semibold">OR</Text>
            <View className="h-1px flex-1 bg-gray-200" />
          </View>

          <Pressable
            onPress={() => Alert.alert("Google Sign-In", "We can wire this after the basic auth is done.")}
            className="h-14 flex-row items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white"
          >
            <GoogleIcon />
            <Text className="text-[15px] text-gray-800">Continue with Google</Text>
          </Pressable>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-[15px] text-gray-700">Already have an account? </Text>

            <Text
              onPress={() => router.push("/login")}
              style={{ color: "#3B82F6", fontSize: 15, fontWeight: "500" }}
            >
              Log in
            </Text>
          </View>

          {/* Terms checkbox */}
          <Pressable
          onPress={() => setAgree((v) => !v)}
          style={{ marginTop: 55, flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
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

          <Text style={{ flex: 1, fontSize: 13, color: "#4B5563", lineHeight: 16, textAlign:"justify" }}>
            By signing up you agree to our{" "}
            <Text style={{ color: "#3B82F6", textDecorationLine: "underline" }}>Terms of Service</Text> and{" "}
            <Text style={{ color: "#3B82F6", textDecorationLine: "underline" }}>Privacy Policy</Text>.
          </Text>
        </Pressable>
        </View>
      </View>
    </AuthBackground>
  );
}

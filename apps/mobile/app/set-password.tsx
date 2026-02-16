import React from "react";
import { Pressable, SafeAreaView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSetPassword } from "../features/auth/hooks/useSetPassword";

export default function SetPasswordScreen() {
  const vm = useSetPassword();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6", padding: 16 }}>
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 14,
          borderWidth: 1,
          borderColor: "#E5E7EB",
          padding: 14,
        }}
      >
        <Pressable onPress={vm.goBack}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: "#374151" }}>{`< Back`}</Text>
        </Pressable>

        <Text style={{ marginTop: 14, fontSize: 22, fontWeight: "800", color: "#111827" }}>
          Create Password
        </Text>
        <Text style={{ marginTop: 6, color: "#6B7280" }}>
          Add a password so you can login with email and password.
        </Text>

        <View style={{ marginTop: 16, gap: 12 }}>
          <View style={{ position: "relative" }}>
            <TextInput
              value={vm.newPassword}
              onChangeText={vm.setNewPassword}
              secureTextEntry={!vm.showNewPassword}
              placeholder="New Password"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              style={{
                height: 48,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                backgroundColor: "#fff",
                paddingHorizontal: 12,
                paddingRight: 44,
                fontSize: 15,
                fontWeight: "600",
              }}
            />
            <Pressable
              onPress={vm.toggleShowNewPassword}
              style={{ position: "absolute", right: 10, top: 0, height: 48, justifyContent: "center" }}
            >
              <Ionicons
                name={vm.showNewPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#9CA3AF"
              />
            </Pressable>
          </View>

          <View style={{ position: "relative" }}>
            <TextInput
              value={vm.confirmPassword}
              onChangeText={vm.setConfirmPassword}
              secureTextEntry={!vm.showConfirmPassword}
              placeholder="Confirm Password"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              style={{
                height: 48,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                backgroundColor: "#fff",
                paddingHorizontal: 12,
                paddingRight: 44,
                fontSize: 15,
                fontWeight: "600",
              }}
            />
            <Pressable
              onPress={vm.toggleShowConfirmPassword}
              style={{ position: "absolute", right: 10, top: 0, height: 48, justifyContent: "center" }}
            >
              <Ionicons
                name={vm.showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#9CA3AF"
              />
            </Pressable>
          </View>

          {vm.error ? <Text style={{ color: "#EF4444", fontSize: 13 }}>{vm.error}</Text> : null}

          <Pressable
            onPress={vm.submit}
            disabled={vm.loading}
            style={({ pressed }) => ({
              marginTop: 4,
              height: 48,
              borderRadius: 10,
              backgroundColor: "#EF4444",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed || vm.loading ? 0.75 : 1,
            })}
          >
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
              {vm.loading ? "Saving..." : "Save Password"}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

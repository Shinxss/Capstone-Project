import React from "react";
import { View, Text, TextInput, Pressable, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GoogleIcon from "../../../components/GoogleIcon";
import LifelineLogo from "../../../components/LifelineLogo";
import {
  COUNTRY_REGION_OPTIONS,
  flagFromIsoCode,
  toCountryRegionValue,
} from "../constants/countryRegionOptions";

type Props = {
  countryRegion: string;
  phoneNumber: string;
  loading: boolean;
  googleLoading: boolean;
  error: string | null;
  onChangeCountryRegion: (value: string) => void;
  onChangePhoneNumber: (value: string) => void;
  onSendOtp: () => void;
  onGoogle: () => void;
  onGoLogin: () => void;
};

export default function PhoneRegistrationForm({
  countryRegion,
  phoneNumber,
  loading,
  googleLoading,
  error,
  onChangeCountryRegion,
  onChangePhoneNumber,
  onSendOtp,
  onGoogle,
  onGoLogin,
}: Props) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredCountryOptions = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return COUNTRY_REGION_OPTIONS;

    const dialQuery = query.replace(/[^\d+]/g, "");

    return COUNTRY_REGION_OPTIONS.filter((option) => {
      const label = toCountryRegionValue(option).toLowerCase();
      return (
        option.name.toLowerCase().includes(query) ||
        label.includes(query) ||
        (dialQuery ? option.dialCode.includes(dialQuery) : false)
      );
    });
  }, [searchQuery]);

  function selectCountryRegion(value: string) {
    onChangeCountryRegion(value);
    setSearchQuery("");
    setPickerOpen(false);
  }

  return (
    <View className="flex-1 px-5 pt-45">
      <View className="mb-10">
        <LifelineLogo />
      </View>

      <View className="gap-3">
        <Pressable
          onPress={() => {
            setSearchQuery("");
            setPickerOpen(true);
          }}
          className="border border-gray-200 bg-white"
          style={{
            height: 60,
            minHeight: 60,
            borderRadius: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: 18,
            paddingRight: 12,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            backgroundColor: "#FFFFFF",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: countryRegion ? "#111827" : "#9CA3AF",
              }}
            >
              {countryRegion || "Country/Region"}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </Pressable>

        <TextInput
          placeholder="Phone number"
          placeholderTextColor="#9CA3AF"
          className="h-15 border border-gray-200 bg-white px-6 pl-3 text-[15px] font-semibold"
          style={{
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            backgroundColor: "#FFFFFF",
          }}
          value={phoneNumber}
          onChangeText={onChangePhoneNumber}
          keyboardType="phone-pad"
        />

        {error ? <Text className="text-[15px] text-red-500">{error}</Text> : null}

        <Pressable
          onPress={onSendOtp}
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
            {loading ? "Sending OTP..." : "Send OTP"}
          </Text>
        </Pressable>

        <View className="my-3 flex-row items-center">
          <View className="h-px flex-1 bg-gray-200" />
          <Text className="mx-3 text-[12px] text-gray-500 font-semibold">OR</Text>
          <View className="h-px flex-1 bg-gray-200" />
        </View>

        <Pressable
          onPress={onGoogle}
          disabled={googleLoading}
          style={({ pressed }) => ({
            height: 56,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 12,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            backgroundColor: "#FFFFFF",
            opacity: pressed || googleLoading ? 0.75 : 1,
          })}
        >
          <GoogleIcon size={25} />
          <Text style={{ marginLeft: 15, fontSize: 16, fontWeight: "600", color: "#1F2937" }}>
            {googleLoading ? "Signing in with Google..." : "Continue with Google"}
          </Text>
        </Pressable>

        <View className="mt-13 flex-row justify-center">
          <Text className="text-[15px] text-gray-700">Already have an account? </Text>
          <Text onPress={onGoLogin} style={{ color: "#3B82F6", fontSize: 15, fontWeight: "500" }}>
            Log in
          </Text>
        </View>
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }}
          onPress={() => setPickerOpen(false)}
        >
          <Pressable
            onPress={() => undefined}
            style={{
              marginTop: "auto",
              maxHeight: "58%",
              borderTopLeftRadius: 18,
              borderTopRightRadius: 18,
              backgroundColor: "#FFFFFF",
              paddingTop: 12,
              paddingBottom: 24,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 10 }}>
              Select Country/Region
            </Text>
            <View
              style={{
                height: 52,
                borderRadius: 28,
                borderWidth: 1.25,
                borderColor: "#111827",
                backgroundColor: "#F3F4F6",
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 14,
                marginBottom: 10,
              }}
            >
              <Ionicons name="search" size={18} color="#4B5563" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Select your country code"
                placeholderTextColor="#6B7280"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  flex: 1,
                  marginLeft: 8,
                  color: "#111827",
                  fontSize: 16,
                  fontWeight: "500",
                }}
              />
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredCountryOptions.map((option) => {
                const value = toCountryRegionValue(option);
                const selected = countryRegion === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => selectCountryRegion(value)}
                    style={{
                      minHeight: 46,
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: selected ? "#FEF2F2" : "transparent",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                      <Text style={{ fontSize: 19, marginRight: 10 }}>{flagFromIsoCode(option.isoCode)}</Text>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: selected ? "700" : "500",
                          color: selected ? "#DC2626" : "#111827",
                        }}
                      >
                        {option.name} {option.dialCode}
                      </Text>
                    </View>
                    {selected ? <Ionicons name="checkmark" size={18} color="#DC2626" /> : null}
                  </Pressable>
                );
              })}
              {filteredCountryOptions.length === 0 ? (
                <View style={{ paddingVertical: 16, alignItems: "center" }}>
                  <Text style={{ color: "#6B7280", fontSize: 14 }}>No country found.</Text>
                </View>
              ) : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

import React from "react";
import { Text, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import type { ProfileSummary } from "../models/profile";

type ProfilePersonalInfoCardProps = {
  summary: ProfileSummary;
};

function renderValue(value: string | null | undefined, fallback = "Not set") {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
}

function formatAddressLine(address: string | null | undefined, barangay: string | null | undefined) {
  const addressParts = String(address ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (addressParts.length > 0) {
    return addressParts.join(", ");
  }

  const fallbackBarangay = String(barangay ?? "").trim();
  return fallbackBarangay || "Not set";
}

export default function ProfilePersonalInfoCard({ summary }: ProfilePersonalInfoCardProps) {
  const { isDark } = useTheme();
  const isVolunteer = String(summary.role ?? "").trim().toUpperCase() === "VOLUNTEER";

  const rows = [
    { key: "email", label: "Email", value: renderValue(summary.email) },
    { key: "number", label: "Number", value: renderValue(summary.contactNo) },
    { key: "birthday", label: "Birthday", value: renderValue(summary.birthdate) },
    {
      key: "address",
      label: "Address",
      value: formatAddressLine(summary.address, summary.barangay),
    },
    { key: "gender", label: "Gender", value: renderValue(summary.gender) },
    {
      key: "skills",
      label: "Skills",
      value: isVolunteer ? renderValue(summary.skills, "General Volunteer") : "N/A",
    },
  ];

  return (
    <View className="mt-4">
      <Text className="text-[17px] font-extrabold text-slate-900 dark:text-slate-100">Personal Info</Text>

      <View
        style={{
          marginTop: 12,
          borderRadius: 20,
          borderWidth: 1,
          overflow: "hidden",
          backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
          borderColor: isDark ? "#162544" : "#E5E7EB",
        }}
      >
        {rows.map((row, index) => (
          <View
            key={row.key}
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: index === rows.length - 1 ? 0 : 1,
              borderBottomColor: isDark ? "#162544" : "#E5E7EB",
            }}
          >
            <Text className="w-[88px] text-[13px] font-semibold text-slate-500 dark:text-slate-300">
              {row.label}
            </Text>
            <Text className="flex-1 text-right text-[14px] font-medium text-slate-900 dark:text-slate-100">
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

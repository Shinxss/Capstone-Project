import React from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";
import type { ProfileSummary } from "../models/profile";
import { formatSkillsDisplayText } from "../utils/skills";

type PersonalInfoRowKey = "email" | "number" | "barangay" | "gender" | "skills";

type ProfilePersonalInfoCardProps = {
  summary: ProfileSummary;
  onPressHeader?: () => void;
  onPressRow?: (key: PersonalInfoRowKey) => void;
};

function normalizeString(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized;
}

function isMissingValue(value: string | null | undefined) {
  return normalizeString(value).length === 0;
}

function getDisplayText(value: string | null | undefined, fallbackLabel: string) {
  if (isMissingValue(value)) return fallbackLabel;
  return normalizeString(value);
}

function isMissingAddress(address: string | null | undefined, barangay: string | null | undefined) {
  return isMissingValue(address) && isMissingValue(barangay);
}

function formatAddressDisplay(address: string | null | undefined, barangay: string | null | undefined) {
  const base = normalizeString(barangay) || normalizeString(address);
  if (!base) return "Barangay";

  const lower = base.toLowerCase();
  const hasDagupan = lower.includes("dagupan");
  const hasPangasinan = lower.includes("pangasinan");

  if (hasDagupan && hasPangasinan) return base;
  if (hasDagupan) return `${base}, Pangasinan`;
  if (hasPangasinan) return `${base}, Dagupan City`;
  return `${base}, Dagupan City, Pangasinan`;
}

type PersonalInfoRowItem = {
  key: PersonalInfoRowKey;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  value: string;
  isFallback: boolean;
};

function PersonalInfoRow({
  row,
  isLast,
  isDark,
  onPress,
}: {
  row: PersonalInfoRowItem;
  isLast: boolean;
  isDark: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: isDark ? "#162544" : "#E5E7EB",
        opacity: pressed ? 0.78 : 1,
      })}
      accessibilityRole="button"
      accessibilityLabel={`Personal info ${row.key}`}
    >
      <View style={{ width: 26, alignItems: "center", justifyContent: "center" }}>
        <Ionicons
          name={row.icon}
          size={18}
          color={isDark ? "#94A3B8" : "#64748B"}
        />
      </View>

      <Text
        style={{
          flex: 1,
          marginLeft: 10,
          marginRight: 8,
          color: row.isFallback ? (isDark ? "#94A3B8" : "#64748B") : isDark ? "#E2E8F0" : "#0F172A",
          fontSize: 14,
          fontWeight: row.isFallback ? "400" : "500",
        }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {row.value}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={18}
        color={isDark ? "#64748B" : "#94A3B8"}
      />
    </Pressable>
  );
}

export default function ProfilePersonalInfoCard({ summary, onPressHeader, onPressRow }: ProfilePersonalInfoCardProps) {
  const { isDark } = useTheme();
  const normalizedRole = String(summary.role ?? "").trim().toUpperCase();
  const isDispatchAssignee = normalizedRole === "VOLUNTEER" || normalizedRole === "RESPONDER";
  const hasNonAssigneeSkills = !isDispatchAssignee && Boolean(String(summary.skills ?? "").trim());
  const formattedSkills = formatSkillsDisplayText(summary.skills);

  const rows: PersonalInfoRowItem[] = [
    {
      key: "email",
      icon: "mail-outline",
      value: getDisplayText(summary.email, "Email"),
      isFallback: isMissingValue(summary.email),
    },
    {
      key: "number",
      icon: "call-outline",
      value: getDisplayText(summary.contactNo, "Number"),
      isFallback: isMissingValue(summary.contactNo),
    },
    {
      key: "barangay",
      icon: "location-outline",
      value: formatAddressDisplay(summary.address, summary.barangay),
      isFallback: isMissingAddress(summary.address, summary.barangay),
    },
    {
      key: "gender",
      icon: "male-female-outline",
      value: getDisplayText(summary.gender, "Gender"),
      isFallback: isMissingValue(summary.gender),
    },
  ];

  if (isDispatchAssignee || hasNonAssigneeSkills) {
    rows.push({
      key: "skills",
      icon: "shield-checkmark-outline",
      value: formattedSkills || "Skills",
      isFallback: !formattedSkills,
    });
  }

  return (
    <View
      style={{
        marginTop: 7,
        backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={onPressHeader}
        disabled={!onPressHeader}
        style={({ pressed }) => ({
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
          opacity: pressed && onPressHeader ? 0.8 : 1,
        })}
      >
        <Text
          style={{
            color: isDark ? "#E2E8F0" : "#0F172A",
            fontSize: 17,
            fontWeight: "800",
          }}
        >
          Personal Info
        </Text>
      </Pressable>

      <View
        style={{
          backgroundColor: "transparent",
        }}
      >
        {rows.map((row, index) => (
          <PersonalInfoRow
            key={row.key}
            row={row}
            isLast={index === rows.length - 1}
            isDark={isDark}
            onPress={() => onPressRow?.(row.key)}
          />
        ))}
      </View>
    </View>
  );
}

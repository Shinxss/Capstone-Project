import React, { useRef } from "react";
import { Pressable, Text, TextInput, type KeyboardTypeOptions, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";

type ProfileFieldRowProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  displayValue?: string;
  placeholder?: string;
  error?: string;
  keyboardType?: KeyboardTypeOptions;
  editable?: boolean;
  multiline?: boolean;
  isLast?: boolean;
  onChangeText?: (value: string) => void;
  onPress?: () => void;
};

export default function ProfileFieldRow({
  icon,
  label,
  value,
  displayValue,
  placeholder,
  error,
  keyboardType = "default",
  editable = true,
  multiline = false,
  isLast = false,
  onChangeText,
  onPress,
}: ProfileFieldRowProps) {
  const { isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const hasSelector = typeof onPress === "function";
  const normalizedDisplayValue = String(displayValue ?? value).trim();
  const displayText = normalizedDisplayValue || placeholder || label;
  const isPlaceholder = normalizedDisplayValue.length === 0;

  return (
    <View
      style={{
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: isDark ? "#162544" : "#E5E7EB",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 14,
          paddingTop: 10,
          paddingBottom: 4,
          gap: 10,
        }}
      >
        <Ionicons name={icon} size={17} color={isDark ? "#94A3B8" : "#64748B"} />
        <Text style={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: 12, fontWeight: "600" }}>{label}</Text>
      </View>

      {hasSelector ? (
        <Pressable
          onPress={onPress}
          style={({ pressed }) => ({
            minHeight: 40,
            paddingHorizontal: 14,
            paddingBottom: 10,
            paddingTop: 4,
            flexDirection: "row",
            alignItems: "center",
            opacity: pressed ? 0.84 : 1,
          })}
        >
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              flex: 1,
              color: isPlaceholder ? (isDark ? "#64748B" : "#94A3B8") : isDark ? "#E2E8F0" : "#0F172A",
              fontSize: 14,
              fontWeight: "500",
            }}
          >
            {displayText}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={isDark ? "#64748B" : "#94A3B8"} />
        </Pressable>
      ) : (
        <View style={{ paddingHorizontal: 14, paddingBottom: 10, paddingTop: 2 }}>
          <View
            style={{
              borderRadius: 10,
              borderWidth: 1,
              borderColor: error ? "#DC2626" : isDark ? "#162544" : "#E5E7EB",
              backgroundColor: isDark ? "#0B1220" : "#F8FAFC",
              minHeight: multiline ? 72 : 40,
              justifyContent: "center",
            }}
          >
            <TextInput
              ref={inputRef}
              value={value}
              onChangeText={onChangeText}
              editable={editable}
              keyboardType={keyboardType}
              placeholder={placeholder}
              placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
              multiline={multiline}
              style={{
                minHeight: multiline ? 72 : 40,
                color: isDark ? "#E2E8F0" : "#0F172A",
                fontSize: 14,
                fontWeight: "500",
                paddingLeft: 12,
                paddingRight: 40,
                paddingVertical: multiline ? 10 : 8,
                textAlignVertical: multiline ? "top" : "center",
              }}
            />

            <Pressable
              onPress={() => inputRef.current?.focus()}
              hitSlop={8}
              style={({ pressed }) => ({
                position: "absolute",
                right: 10,
                top: multiline ? 10 : 9,
                opacity: pressed ? 0.75 : 1,
              })}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${label}`}
            >
              <Ionicons name="pencil-outline" size={16} color={isDark ? "#94A3B8" : "#64748B"} />
            </Pressable>
          </View>
        </View>
      )}

      {error ? (
        <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "600", paddingHorizontal: 14, paddingBottom: 10 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

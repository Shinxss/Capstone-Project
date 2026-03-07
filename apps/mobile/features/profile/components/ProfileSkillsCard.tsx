import React, { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";

type ProfileSkillsCardProps = {
  skillOptions: string[];
  selectedSkills: string[];
  otherSkillEnabled: boolean;
  otherSkillText: string;
  error?: string | null;
  onToggleSkill: (skill: string) => void;
  onToggleOther: () => void;
  onChangeOtherText: (value: string) => void;
};

function SkillCheckboxRow({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  const { isDark } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        opacity: pressed ? 0.82 : 1,
      })}
    >
      <Text style={{ color: isDark ? "#E2E8F0" : "#0F172A", fontSize: 14, fontWeight: "500" }}>{label}</Text>
      <Ionicons
        name={checked ? "checkbox-outline" : "square-outline"}
        size={20}
        color={checked ? (isDark ? "#60A5FA" : "#DC2626") : isDark ? "#64748B" : "#94A3B8"}
      />
    </Pressable>
  );
}

export default function ProfileSkillsCard({
  skillOptions,
  selectedSkills,
  otherSkillEnabled,
  otherSkillText,
  error,
  onToggleSkill,
  onToggleOther,
  onChangeOtherText,
}: ProfileSkillsCardProps) {
  const { isDark } = useTheme();
  const [searchText, setSearchText] = useState("");

  const filteredSkillOptions = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return skillOptions;
    return skillOptions.filter((skill) => skill.toLowerCase().includes(query));
  }, [searchText, skillOptions]);

  return (
    <View
      style={{
        marginTop: 14,
        marginHorizontal: 20,
        paddingHorizontal: 2,
        paddingBottom: 12,
      }}
    >
      <Text
        style={{
          paddingTop: 12,
          paddingBottom: 8,
          color: isDark ? "#E2E8F0" : "#0F172A",
          fontSize: 17,
          fontWeight: "800",
        }}
      >
        Skills
      </Text>

      <View
        style={{
          marginBottom: 8,
          minHeight: 40,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: isDark ? "#162544" : "#E5E7EB",
          backgroundColor: isDark ? "#0B1220" : "#F8FAFC",
          paddingHorizontal: 10,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        }}
      >
        <Ionicons name="search-outline" size={18} color={isDark ? "#94A3B8" : "#64748B"} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search skills"
          placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
          style={{
            flex: 1,
            color: isDark ? "#E2E8F0" : "#0F172A",
            fontSize: 14,
            fontWeight: "500",
            paddingVertical: 8,
          }}
        />
      </View>

      {filteredSkillOptions.map((skill) => (
        <SkillCheckboxRow
          key={skill}
          label={skill}
          checked={selectedSkills.includes(skill)}
          onPress={() => onToggleSkill(skill)}
        />
      ))}

      {filteredSkillOptions.length === 0 ? (
        <Text style={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: 13, paddingVertical: 10 }}>
          No matching skills.
        </Text>
      ) : null}

      <SkillCheckboxRow label="Others" checked={otherSkillEnabled} onPress={onToggleOther} />

      {otherSkillEnabled ? (
        <View style={{ marginTop: 4 }}>
          <TextInput
            value={otherSkillText}
            onChangeText={onChangeOtherText}
            placeholder="Type other skill"
            placeholderTextColor={isDark ? "#64748B" : "#94A3B8"}
            style={{
              minHeight: 40,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: error ? "#DC2626" : isDark ? "#162544" : "#E5E7EB",
              backgroundColor: isDark ? "#0B1220" : "#F8FAFC",
              color: isDark ? "#E2E8F0" : "#0F172A",
              fontSize: 14,
              fontWeight: "500",
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}
          />
        </View>
      ) : null}

      {error ? (
        <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "600", paddingTop: 8 }}>{error}</Text>
      ) : null}
    </View>
  );
}

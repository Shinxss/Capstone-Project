import React, { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DAGUPAN_BARANGAY_OPTIONS, PROFILE_GENDER_OPTIONS } from "../constants/profileEdit.constants";
import type { EditProfileFieldErrors } from "../hooks/useEditProfile";
import type { EditableProfileFields } from "../models/profile";
import { useTheme } from "../../theme/useTheme";
import ProfileFieldRow from "./ProfileFieldRow";

type PickerKind = "gender" | "barangay" | null;

type ProfileEditFormProps = {
  fields: EditableProfileFields;
  errors: EditProfileFieldErrors;
  canEditSkills: boolean;
  skillsDisplay: string;
  onChangeField: (key: keyof EditableProfileFields, value: string) => void;
  onPressSkills: () => void;
};

function PickerSheet({
  visible,
  title,
  options,
  value,
  onClose,
  onSelect,
}: {
  visible: boolean;
  title: string;
  options: readonly string[];
  value: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  const { isDark } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(2,6,23,0.48)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={() => undefined}
          style={{
            maxHeight: "74%",
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            backgroundColor: isDark ? "#0B1220" : "#FFFFFF",
            borderTopWidth: 1,
            borderColor: isDark ? "#162544" : "#E5E7EB",
            paddingBottom: 10,
          }}
        >
          <View style={{ alignItems: "center", paddingTop: 10 }}>
            <View
              style={{
                width: 46,
                height: 4,
                borderRadius: 999,
                backgroundColor: isDark ? "#334155" : "#CBD5E1",
              }}
            />
          </View>

          <Text
            style={{
              paddingHorizontal: 16,
              paddingTop: 10,
              paddingBottom: 8,
              color: isDark ? "#E2E8F0" : "#0F172A",
              fontSize: 16,
              fontWeight: "800",
            }}
          >
            {title}
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Pressable
              onPress={() => onSelect("")}
              style={({ pressed }) => ({
                paddingHorizontal: 16,
                paddingVertical: 13,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderColor: isDark ? "#162544" : "#E5E7EB",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Text style={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: 14, fontWeight: "600" }}>
                Clear selection
              </Text>
            </Pressable>

            {options.map((option) => {
              const selected = option === value;
              return (
                <Pressable
                  key={option}
                  onPress={() => onSelect(option)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 16,
                    paddingVertical: 13,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? "#162544" : "#E5E7EB",
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Text
                    style={{
                      color: isDark ? "#E2E8F0" : "#0F172A",
                      fontSize: 14,
                      fontWeight: selected ? "700" : "500",
                    }}
                  >
                    {option}
                  </Text>
                  {selected ? <Ionicons name="checkmark" size={18} color={isDark ? "#60A5FA" : "#DC2626"} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              marginHorizontal: 16,
              marginTop: 12,
              height: 40,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: isDark ? "#162544" : "#E5E7EB",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
              opacity: pressed ? 0.82 : 1,
            })}
          >
            <Text style={{ color: isDark ? "#E2E8F0" : "#0F172A", fontSize: 14, fontWeight: "700" }}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function ProfileEditForm({
  fields,
  errors,
  canEditSkills,
  skillsDisplay,
  onChangeField,
  onPressSkills,
}: ProfileEditFormProps) {
  const { isDark } = useTheme();
  const [pickerKind, setPickerKind] = useState<PickerKind>(null);
  const barangayValue = fields.barangay.trim();
  const addressDisplay = barangayValue ? `${barangayValue}, Dagupan City, Pangasinan` : "";

  const pickerConfig = useMemo(() => {
    if (pickerKind === "gender") {
      return {
        title: "Select Gender",
        options: PROFILE_GENDER_OPTIONS,
        value: fields.gender,
        onSelect: (nextValue: string) => onChangeField("gender", nextValue),
      };
    }

    if (pickerKind === "barangay") {
      return {
        title: "Select Barangay",
        options: DAGUPAN_BARANGAY_OPTIONS,
        value: fields.barangay,
        onSelect: (nextValue: string) => onChangeField("barangay", nextValue),
      };
    }

    return null;
  }, [fields.barangay, fields.gender, onChangeField, pickerKind]);

  return (
    <>
      <View
        style={{
          marginTop: 14,
          marginHorizontal: 20,
          borderRadius: 14,
          borderWidth: 1,
          overflow: "hidden",
          backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
          borderColor: isDark ? "#162544" : "#E5E7EB",
        }}
      >
        <Text
          style={{
            paddingHorizontal: 14,
            paddingTop: 12,
            paddingBottom: 8,
            color: isDark ? "#E2E8F0" : "#0F172A",
            fontSize: 17,
            fontWeight: "800",
          }}
        >
          Personal Info
        </Text>

        <ProfileFieldRow
          icon="person-outline"
          label="First name"
          value={fields.firstName}
          placeholder="First name"
          onChangeText={(nextValue) => onChangeField("firstName", nextValue)}
          error={errors.firstName}
        />
        <ProfileFieldRow
          icon="person-outline"
          label="Last name"
          value={fields.lastName}
          placeholder="Last name"
          onChangeText={(nextValue) => onChangeField("lastName", nextValue)}
          error={errors.lastName}
        />
        <ProfileFieldRow
          icon="call-outline"
          label="Contact number"
          value={fields.contactNo}
          placeholder="Contact number"
          keyboardType="phone-pad"
          onChangeText={(nextValue) => onChangeField("contactNo", nextValue)}
          error={errors.contactNo}
        />
        <ProfileFieldRow
          icon="calendar-outline"
          label="Birthday"
          value={fields.birthdate}
          placeholder="YYYY-MM-DD"
          keyboardType="numbers-and-punctuation"
          onChangeText={(nextValue) => onChangeField("birthdate", nextValue)}
          error={errors.birthdate}
        />
        <ProfileFieldRow
          icon="location-outline"
          label="Address"
          value={fields.barangay}
          displayValue={addressDisplay}
          placeholder="Address"
          onPress={() => setPickerKind("barangay")}
          error={errors.barangay}
        />
        <ProfileFieldRow
          icon="male-female-outline"
          label="Gender"
          value={fields.gender}
          placeholder="Select gender"
          onPress={() => setPickerKind("gender")}
          error={errors.gender}
          isLast={!canEditSkills}
        />
        {canEditSkills ? (
          <ProfileFieldRow
            icon="shield-checkmark-outline"
            label="Skills"
            value={skillsDisplay}
            placeholder="Add skills"
            onPress={onPressSkills}
            isLast
          />
        ) : null}
      </View>

      <PickerSheet
        visible={Boolean(pickerConfig)}
        title={pickerConfig?.title ?? ""}
        options={pickerConfig?.options ?? []}
        value={pickerConfig?.value ?? ""}
        onClose={() => setPickerKind(null)}
        onSelect={(nextValue) => {
          pickerConfig?.onSelect(nextValue);
          setPickerKind(null);
        }}
      />
    </>
  );
}

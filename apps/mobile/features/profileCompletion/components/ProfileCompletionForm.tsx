import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  DAGUPAN_BARANGAY_OPTIONS,
  PROFILE_GENDER_OPTIONS,
} from "../../profile/constants/profileEdit.constants";
import type {
  ProfileCompletionField,
  ProfileCompletionFieldErrors,
  ProfileCompletionFormValues,
} from "../models/profileCompletion";

type PickerKind = "gender" | "barangay" | null;

type ProfileCompletionFormProps = {
  values: ProfileCompletionFormValues;
  errors: ProfileCompletionFieldErrors;
  showFirstName: boolean;
  showLastName: boolean;
  addressDisplay: string;
  serverError: string | null;
  submitting: boolean;
  canSubmit: boolean;
  onChangeField: (field: ProfileCompletionField, value: string) => void;
  onSubmit: () => void;
  onLogout: () => void;
};

type SelectionSheetProps = {
  visible: boolean;
  title: string;
  options: readonly string[];
  selectedValue: string;
  onClose: () => void;
  onSelect: (value: string) => void;
  searchable?: boolean;
  searchPlaceholder?: string;
};

function SelectionSheet({
  visible,
  title,
  options,
  selectedValue,
  onClose,
  onSelect,
  searchable = false,
  searchPlaceholder = "Search",
}: SelectionSheetProps) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!visible) {
      setQuery("");
    }
  }, [visible]);

  const filteredOptions = useMemo(() => {
    if (!searchable) return options;
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return options;

    return options.filter((option) => option.toLowerCase().includes(normalizedQuery));
  }, [options, query, searchable]);

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable style={styles.sheetSurface} onPress={() => undefined}>
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>{title}</Text>

          {searchable ? (
            <View style={styles.sheetSearchContainer}>
              <Ionicons name="search-outline" size={18} color="#6B7280" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor="#9CA3AF"
                style={styles.sheetSearchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ) : null}

          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetListContainer}
            showsVerticalScrollIndicator={false}
          >
            {filteredOptions.map((option) => {
              const selected = selectedValue === option;
              return (
                <Pressable
                  key={option}
                  style={({ pressed }) => [styles.sheetItem, pressed ? styles.pressed : null]}
                  onPress={() => onSelect(option)}
                >
                  <Text style={[styles.sheetItemLabel, selected ? styles.sheetItemLabelSelected : null]}>
                    {option}
                  </Text>
                  {selected ? <Ionicons name="checkmark" size={18} color="#2563EB" /> : null}
                </Pressable>
              );
            })}

            {filteredOptions.length === 0 ? (
              <Text style={styles.sheetEmptyText}>No matching barangays found.</Text>
            ) : null}
          </ScrollView>

          <Pressable style={({ pressed }) => [styles.sheetCloseButton, pressed ? styles.pressed : null]} onPress={onClose}>
            <Text style={styles.sheetCloseButtonText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FormFieldLabel({ label }: { label: string }) {
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={styles.errorText}>{message}</Text>;
}

function TextField({
  label,
  value,
  placeholder,
  onChangeText,
  error,
  keyboardType,
  autoCapitalize,
  testID,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  error?: string;
  keyboardType?: "default" | "phone-pad";
  autoCapitalize?: "none" | "words";
  testID?: string;
}) {
  return (
    <View style={styles.fieldBlock}>
      <FormFieldLabel label={label} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType ?? "default"}
        autoCapitalize={autoCapitalize ?? "words"}
        autoCorrect={false}
        style={[styles.input, error ? styles.inputError : null]}
        testID={testID}
      />
      <FieldError message={error} />
    </View>
  );
}

function PickerField({
  label,
  displayValue,
  placeholder,
  onPress,
  error,
}: {
  label: string;
  displayValue: string;
  placeholder: string;
  onPress: () => void;
  error?: string;
}) {
  const hasValue = displayValue.trim().length > 0;

  return (
    <View style={styles.fieldBlock}>
      <FormFieldLabel label={label} />
      <Pressable style={({ pressed }) => [styles.input, styles.pickerInput, error ? styles.inputError : null, pressed ? styles.pressed : null]} onPress={onPress}>
        <Text style={[styles.inputText, !hasValue ? styles.placeholderText : null]}>{hasValue ? displayValue : placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color="#6B7280" />
      </Pressable>
      <FieldError message={error} />
    </View>
  );
}

export default function ProfileCompletionForm({
  values,
  errors,
  showFirstName,
  showLastName,
  addressDisplay,
  serverError,
  submitting,
  canSubmit,
  onChangeField,
  onSubmit,
  onLogout,
}: ProfileCompletionFormProps) {
  const [pickerKind, setPickerKind] = useState<PickerKind>(null);
  const { width } = useWindowDimensions();

  const useInlineNameLayout = width >= 390 && showFirstName && showLastName;

  return (
    <View style={styles.card}>
      {(showFirstName || showLastName) && useInlineNameLayout ? (
        <View style={styles.inlineNameRow}>
          {showFirstName ? (
            <View style={styles.inlineFieldContainer}>
              <TextField
                label="First Name"
                value={values.firstName}
                placeholder="First name"
                onChangeText={(value) => onChangeField("firstName", value)}
                error={errors.firstName}
                testID="profileCompletion.firstName"
              />
            </View>
          ) : null}

          {showLastName ? (
            <View style={styles.inlineFieldContainer}>
              <TextField
                label="Last Name"
                value={values.lastName}
                placeholder="Last name"
                onChangeText={(value) => onChangeField("lastName", value)}
                error={errors.lastName}
                testID="profileCompletion.lastName"
              />
            </View>
          ) : null}
        </View>
      ) : (
        <>
          {showFirstName ? (
            <TextField
              label="First Name"
              value={values.firstName}
              placeholder="First name"
              onChangeText={(value) => onChangeField("firstName", value)}
              error={errors.firstName}
              testID="profileCompletion.firstName"
            />
          ) : null}

          {showLastName ? (
            <TextField
              label="Last Name"
              value={values.lastName}
              placeholder="Last name"
              onChangeText={(value) => onChangeField("lastName", value)}
              error={errors.lastName}
              testID="profileCompletion.lastName"
            />
          ) : null}
        </>
      )}

      <TextField
        label="Phone Number"
        value={values.contactNo}
        placeholder="09XXXXXXXXX"
        onChangeText={(value) => onChangeField("contactNo", value)}
        error={errors.contactNo}
        keyboardType="phone-pad"
        autoCapitalize="none"
        testID="profileCompletion.contactNo"
      />

      <PickerField
        label="Gender"
        displayValue={values.gender}
        placeholder="Select gender"
        onPress={() => setPickerKind("gender")}
        error={errors.gender}
      />

      <PickerField
        label="Address"
        displayValue={addressDisplay}
        placeholder="Select your barangay"
        onPress={() => setPickerKind("barangay")}
        error={errors.barangay}
      />

      {serverError ? <Text style={styles.serverErrorText}>{serverError}</Text> : null}

      <Pressable
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && canSubmit && !submitting ? styles.primaryButtonPressed : null,
          !canSubmit || submitting ? styles.primaryButtonDisabled : null,
        ]}
        disabled={!canSubmit || submitting}
        onPress={onSubmit}
      >
        <Text style={styles.primaryButtonText}>{submitting ? "Saving..." : "Continue"}</Text>
      </Pressable>

      <Pressable style={({ pressed }) => [styles.logoutLink, pressed ? styles.pressed : null]} onPress={onLogout}>
        <Text style={styles.logoutLinkText}>Log out</Text>
      </Pressable>

      <SelectionSheet
        visible={pickerKind === "gender"}
        title="Select Gender"
        options={PROFILE_GENDER_OPTIONS}
        selectedValue={values.gender}
        onClose={() => setPickerKind(null)}
        onSelect={(value) => {
          onChangeField("gender", value);
          setPickerKind(null);
        }}
      />

      <SelectionSheet
        visible={pickerKind === "barangay"}
        title="Select Barangay"
        options={DAGUPAN_BARANGAY_OPTIONS}
        selectedValue={values.barangay}
        searchable
        searchPlaceholder="Search barangay"
        onClose={() => setPickerKind(null)}
        onSelect={(value) => {
          onChangeField("barangay", value);
          setPickerKind(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  inlineNameRow: {
    flexDirection: "row",
    columnGap: 10,
  },
  inlineFieldContainer: {
    flex: 1,
  },
  fieldBlock: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    color: "#111827",
    fontSize: 15,
    fontWeight: "500",
  },
  inputText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "500",
  },
  placeholderText: {
    color: "#9CA3AF",
    fontWeight: "400",
  },
  pickerInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    marginTop: 6,
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "500",
  },
  serverErrorText: {
    marginTop: 2,
    marginBottom: 8,
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  primaryButton: {
    marginTop: 10,
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EF4444",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  primaryButtonPressed: {
    backgroundColor: "#DC2626",
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
  },
  logoutLink: {
    alignSelf: "center",
    marginTop: 12,
    paddingVertical: 4,
  },
  logoutLinkText: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },
  sheetSurface: {
    maxHeight: "82%",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingBottom: Platform.OS === "ios" ? 22 : 14,
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
  },
  sheetHandle: {
    alignSelf: "center",
    marginTop: 10,
    width: 44,
    height: 4,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
  },
  sheetTitle: {
    marginTop: 12,
    marginBottom: 10,
    marginHorizontal: 16,
    color: "#111827",
    fontSize: 17,
    fontWeight: "800",
  },
  sheetSearchContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  sheetSearchInput: {
    flex: 1,
    color: "#111827",
    fontSize: 14,
    fontWeight: "500",
  },
  sheetListContainer: {
    paddingBottom: 8,
  },
  sheetItem: {
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetItemLabel: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "500",
  },
  sheetItemLabelSelected: {
    fontWeight: "700",
  },
  sheetEmptyText: {
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  sheetCloseButton: {
    marginHorizontal: 16,
    marginTop: 8,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  sheetCloseButtonText: {
    color: "#111827",
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.82,
  },
});

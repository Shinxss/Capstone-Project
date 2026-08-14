import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type {
  GuestEmergencyContactErrors,
  GuestEmergencyContactInput,
} from "../models/guestEmergencyContact.types";

type Props = {
  visible: boolean;
  initialValue?: GuestEmergencyContactInput | null;
  saving?: boolean;
  onContinue: (
    value: GuestEmergencyContactInput
  ) => Promise<GuestEmergencyContactErrors | void> | GuestEmergencyContactErrors | void;
  onCancel: () => void;
};

export function GuestEmergencyContactModal({
  visible,
  initialValue,
  saving,
  onContinue,
  onCancel,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errors, setErrors] = useState<GuestEmergencyContactErrors>({});

  useEffect(() => {
    if (!visible) return;
    setFullName(initialValue?.fullName ?? "");
    setPhoneNumber(initialValue?.phoneNumber ?? "");
    setErrors({});
  }, [initialValue, visible]);

  const handleContinue = async () => {
    if (saving) return;
    const nextErrors = await onContinue({ fullName, phoneNumber });
    setErrors(nextErrors ?? {});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!saving) onCancel();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.backdrop}
      >
        <ScrollView
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.card}>
            <Text style={styles.eyebrow}>Before sending an SOS</Text>
            <Text style={styles.title}>Responders need a way to contact you.</Text>
            <Text style={styles.description}>
              Please provide your name and mobile number. This information will only be used to help responders verify your emergency and contact you about this SOS request.
            </Text>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              value={fullName}
              onChangeText={(value) => {
                setFullName(value);
                if (errors.fullName) setErrors((current) => ({ ...current, fullName: undefined }));
              }}
              editable={!saving}
              autoCapitalize="words"
              autoComplete="name"
              maxLength={80}
              placeholder="Juan Dela Cruz"
              placeholderTextColor="#94A3B8"
              style={[styles.input, errors.fullName ? styles.inputError : null]}
            />
            {errors.fullName ? <Text style={styles.errorText}>{errors.fullName}</Text> : null}

            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              value={phoneNumber}
              onChangeText={(value) => {
                setPhoneNumber(value);
                if (errors.phoneNumber) {
                  setErrors((current) => ({ ...current, phoneNumber: undefined }));
                }
              }}
              editable={!saving}
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={24}
              placeholder="09XXXXXXXXX"
              placeholderTextColor="#94A3B8"
              style={[styles.input, errors.phoneNumber ? styles.inputError : null]}
            />
            {errors.phoneNumber ? <Text style={styles.errorText}>{errors.phoneNumber}</Text> : null}

            <Pressable
              accessibilityRole="button"
              onPress={() => void handleContinue()}
              disabled={Boolean(saving)}
              style={({ pressed }) => [
                styles.continueButton,
                pressed && !saving ? styles.pressed : null,
                saving ? styles.disabled : null,
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.continueText}>Continue</Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              disabled={Boolean(saving)}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && !saving ? styles.pressed : null,
                saving ? styles.disabled : null,
              ]}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.62)",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 18,
  },
  card: {
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 22,
  },
  eyebrow: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    marginTop: 7,
    color: "#0F172A",
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "800",
  },
  description: {
    marginTop: 9,
    color: "#475569",
    fontSize: 14,
    lineHeight: 20,
  },
  label: {
    marginTop: 17,
    marginBottom: 7,
    color: "#334155",
    fontSize: 13,
    fontWeight: "700",
  },
  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 14,
    color: "#0F172A",
    fontSize: 15,
  },
  inputError: {
    borderColor: "#DC2626",
    backgroundColor: "#FEF2F2",
  },
  errorText: {
    marginTop: 5,
    color: "#DC2626",
    fontSize: 12,
    lineHeight: 16,
  },
  continueButton: {
    marginTop: 22,
    minHeight: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
  },
  continueText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  cancelButton: {
    marginTop: 10,
    minHeight: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelText: {
    color: "#334155",
    fontSize: 15,
    fontWeight: "700",
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.65 },
});

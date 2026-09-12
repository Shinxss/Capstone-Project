import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  busy?: boolean;
  contactNumber?: string;
  onEditContact?: () => void;
  onConfirm: () => void;
  onCancel: () => void;
};

export function SosConfirmationModal({
  visible,
  busy,
  contactNumber,
  onEditContact,
  onConfirm,
  onCancel,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const safeTop = Math.max(insets.top, 16);
  const safeBottom = Math.max(insets.bottom, 16);
  const maxCardHeight = Math.max(0, windowHeight - safeTop - safeBottom - 32);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onCancel();
      }}
    >
      <View style={[styles.backdrop, { paddingTop: safeTop, paddingBottom: safeBottom }]}>
        <View style={[styles.card, { maxHeight: maxCardHeight }]}>
          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            style={styles.scrollView}
            contentContainerStyle={styles.cardContent}
          >
          <View style={styles.titleRow}>
            <Ionicons name="warning-outline" size={24} color="#DC2626" />
            <Text style={styles.title}>Confirm Emergency SOS</Text>
          </View>

          <Text style={styles.bodyText}>
            You are about to request emergency assistance.{"\n"}This will:
          </Text>

          <View style={styles.itemRow}>
            <Ionicons name="location-outline" size={20} color="#EF4444" />
            <Text style={styles.itemText}>Share your current location</Text>
          </View>

          <View style={styles.itemRow}>
            <Ionicons name="warning-outline" size={20} color="#EF4444" />
            <Text style={styles.itemText}>Alert emergency responders</Text>
          </View>

          <View style={styles.itemRow}>
            <Ionicons name="call-outline" size={20} color="#EF4444" />
            <Text style={styles.itemText}>Allow responders to call or text you about this emergency</Text>
          </View>

          <Text style={styles.contactWarning}>
            Keep your phone nearby. Responders may contact you to verify the emergency, confirm your location, or provide instructions.
          </Text>

          {contactNumber ? (
            <View style={styles.contactRow}>
              <View style={styles.contactTextWrap}>
                <Text style={styles.contactLabel}>Contact number</Text>
                <Text style={styles.contactValue}>{contactNumber}</Text>
              </View>
              {onEditContact ? (
                <Pressable onPress={onEditContact} disabled={Boolean(busy)} hitSlop={8}>
                  <Text style={styles.editText}>Edit</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.warningText}>Only use SOS for a real emergency.</Text>

          <Pressable
            onPress={onConfirm}
            disabled={!!busy}
            style={({ pressed }) => [
              styles.confirmBtn,
              pressed && !busy ? styles.confirmBtnPressed : null,
              busy ? styles.btnDisabled : null,
            ]}
          >
            {busy ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.confirmBtnText}>Send SOS Now</Text>
            )}
          </Pressable>

          <Pressable
            onPress={onCancel}
            disabled={!!busy}
            style={({ pressed }) => [
              styles.cancelBtn,
              pressed && !busy ? styles.cancelBtnPressed : null,
              busy ? styles.btnDisabled : null,
            ]}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.50)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  scrollView: {
    flexGrow: 0,
  },
  cardContent: {
    paddingHorizontal: 25,
    paddingVertical: 14,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "800",
    color: "#DC2626",
  },
  bodyText: {
    marginTop: 10,
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  itemRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemText: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  warningText: {
    marginTop: 12,
    fontSize: 14,
    color: "#111827",
    fontWeight: "700",
  },
  contactWarning: {
    marginTop: 13,
    borderRadius: 10,
    backgroundColor: "#FEF2F2",
    padding: 11,
    fontSize: 13,
    color: "#7F1D1D",
    lineHeight: 18,
    fontWeight: "600",
  },
  contactRow: {
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  contactTextWrap: { flex: 1 },
  contactLabel: { color: "#64748B", fontSize: 11, fontWeight: "700" },
  contactValue: { marginTop: 2, color: "#0F172A", fontSize: 14, fontWeight: "700" },
  editText: { color: "#DC2626", fontSize: 13, fontWeight: "800" },
  confirmBtn: {
    marginTop: 16,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnPressed: {
    opacity: 0.92,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  cancelBtn: {
    marginTop: 12,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnPressed: {
    backgroundColor: "#F9FAFB",
  },
  cancelBtnText: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
  },
  btnDisabled: {
    opacity: 0.65,
  },
});

import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  visible: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function SosConfirmationModal({ visible, busy, onConfirm, onCancel }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!busy) onCancel();
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Ionicons name="warning-outline" size={24} color="#DC2626" />
            <Text style={styles.title}>Confirm Emergency SOS</Text>
          </View>

          <Text style={styles.bodyText}>
            You are about to send an emergency SOS alert.{"\n"}This will:
          </Text>

          <View style={styles.itemRow}>
            <Ionicons name="location-outline" size={20} color="#EF4444" />
            <Text style={styles.itemText}>Share your current location</Text>
          </View>

          <View style={styles.itemRow}>
            <Ionicons name="call-outline" size={20} color="#EF4444" />
            <Text style={styles.itemText}>Alert nearby responders</Text>
          </View>

          <Text style={styles.warningText}>
            Only confirm if you need immediate help.
          </Text>

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
    padding: 16,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
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

import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  onClose: () => void;
  onContinue: () => void;
};

export function VolunteerApplyModalView({ onClose, onContinue }: Props) {
  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </Pressable>

          <View style={styles.iconWrap}>
            <Ionicons name="shield" size={28} color="#EF4444" />
          </View>

          <Text style={styles.title}>Become a Lifeline Volunteer</Text>

          <Text style={styles.desc}>
            You're about to fill out the Volunteer Application Form. Please
            prepare your basic details, emergency contact, and any certificates
            (e.g., First Aid/BLS) if available.
          </Text>

          <View style={styles.noteBox}>
            <View style={styles.noteRow}>
              <Ionicons name="clipboard-outline" size={18} color="#EF4444" />
              <Text style={styles.noteText}>
                Your application will be reviewed and verified by the LGU before
                you can receive tasks.
              </Text>
            </View>

            <View style={[styles.noteRow, { marginTop: 10 }]}>
              <Ionicons name="alert-circle-outline" size={18} color="#F59E0B" />
              <Text style={styles.noteText}>
                You may be asked to submit a Barangay Clearance or attend an
                orientation session.
              </Text>
            </View>
          </View>

          <Pressable style={styles.primaryBtn} onPress={onContinue}>
            <Text style={styles.primaryText}>Continue to Form</Text>
          </Pressable>

          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(17,24,39,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
  },
  closeBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    alignSelf: "center",
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 12,
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 8,
  },
  desc: {
    textAlign: "center",
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 14,
  },
  noteBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
  },
  noteRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 16,
  },
  primaryBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  cancelBtn: { paddingVertical: 12, alignItems: "center" },
  cancelText: { color: "#6B7280", fontWeight: "700" },
});

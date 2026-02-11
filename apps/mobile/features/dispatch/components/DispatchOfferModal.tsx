import React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { DispatchOffer } from "../models/dispatch";

export function DispatchOfferModal(props: {
  visible: boolean;
  offer: DispatchOffer;
  onAccept: () => void;
  onDecline: () => void;
  onClose?: () => void;
  busy?: boolean;
}) {
  const { visible, offer, onAccept, onDecline, onClose, busy } = props;
  const e = offer.emergency;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>New Dispatch</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>{String(e.emergencyType)}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Source</Text>
            <Text style={styles.value}>{String(e.source ?? "-")}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Barangay</Text>
            <Text style={styles.value}>{e.barangayName ?? "-"}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Location</Text>
            <Text style={styles.value}>{e.lat.toFixed(5)}, {e.lng.toFixed(5)}</Text>
          </View>

          {e.notes ? (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>Notes</Text>
              <Text style={styles.notes}>{e.notes}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.decline, busy && styles.btnDisabled]}
              disabled={!!busy}
              onPress={onDecline}
            >
              <Text style={styles.btnText}>Decline</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.accept, busy && styles.btnDisabled]}
              disabled={!!busy}
              onPress={onAccept}
            >
              <Text style={styles.btnText}>Accept</Text>
            </Pressable>
          </View>

          {onClose ? (
            <Pressable onPress={onClose} style={{ marginTop: 12, alignSelf: "center" }}>
              <Text style={styles.close}>Close</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    backgroundColor: "#fff",
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#111",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
  },
  label: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "700",
  },
  value: {
    fontSize: 12,
    color: "#111",
    fontWeight: "800",
  },
  notes: {
    marginTop: 6,
    fontSize: 12,
    color: "#111",
    lineHeight: 16,
  },
  actions: {
    marginTop: 16,
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  accept: {
    backgroundColor: "#16a34a",
  },
  decline: {
    backgroundColor: "#ef4444",
  },
  btnText: {
    color: "#fff",
    fontWeight: "800",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  close: {
    color: "#374151",
    fontWeight: "700",
  },
});

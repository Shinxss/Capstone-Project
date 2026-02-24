import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  DEV_LOCATION_DAGUPAN_PRESET,
  type DevLocationOverride,
} from "../hooks/useDevLocationOverride";

type DevLocationOverrideOverlayProps = {
  override: DevLocationOverride;
  onPatch: (partial: Partial<DevLocationOverride>) => void;
  onClear: () => void;
  top?: number;
};

export function DevLocationOverrideOverlay({
  override,
  onPatch,
  onClear,
  top = 174,
}: DevLocationOverrideOverlayProps) {
  const [expanded, setExpanded] = useState(false);
  const [latInput, setLatInput] = useState(String(override.lat));
  const [lngInput, setLngInput] = useState(String(override.lng));

  useEffect(() => {
    setLatInput(String(override.lat));
  }, [override.lat]);

  useEffect(() => {
    setLngInput(String(override.lng));
  }, [override.lng]);

  if (!__DEV__) return null;

  const applyCoordinates = () => {
    const nextLat = Number(latInput);
    const nextLng = Number(lngInput);

    onPatch({
      lat: Number.isFinite(nextLat) ? nextLat : DEV_LOCATION_DAGUPAN_PRESET.lat,
      lng: Number.isFinite(nextLng) ? nextLng : DEV_LOCATION_DAGUPAN_PRESET.lng,
    });
  };

  return (
    <View pointerEvents="box-none" style={[styles.container, { top }]}>
      <Pressable
        onPress={() => setExpanded((current) => !current)}
        style={[styles.bubble, override.enabled && styles.bubbleEnabled]}
      >
        <Text style={styles.bubbleText}>GPS</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.title}>DEV Location</Text>
            <Pressable style={styles.toggleBtn} onPress={() => onPatch({ enabled: !override.enabled })}>
              <Text style={styles.toggleBtnText}>{override.enabled ? "ON" : "OFF"}</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>lat</Text>
            <TextInput
              value={latInput}
              onChangeText={setLatInput}
              onBlur={applyCoordinates}
              onSubmitEditing={applyCoordinates}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder={String(DEV_LOCATION_DAGUPAN_PRESET.lat)}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>lng</Text>
            <TextInput
              value={lngInput}
              onChangeText={setLngInput}
              onBlur={applyCoordinates}
              onSubmitEditing={applyCoordinates}
              keyboardType="decimal-pad"
              style={styles.input}
              placeholder={String(DEV_LOCATION_DAGUPAN_PRESET.lng)}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.presetsRow}>
            <Pressable
              style={styles.presetBtn}
              onPress={() =>
                onPatch({
                  enabled: true,
                  lat: DEV_LOCATION_DAGUPAN_PRESET.lat,
                  lng: DEV_LOCATION_DAGUPAN_PRESET.lng,
                })
              }
            >
              <Text style={styles.presetText}>Dagupan</Text>
            </Pressable>
            <Pressable style={styles.resetBtn} onPress={onClear}>
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 12,
    zIndex: 40,
    alignItems: "flex-end",
  },
  bubble: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: "rgba(15,23,42,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.5)",
  },
  bubbleEnabled: {
    backgroundColor: "rgba(2,132,199,0.95)",
    borderColor: "rgba(56,189,248,0.95)",
  },
  bubbleText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 11,
  },
  card: {
    marginTop: 8,
    width: 244,
    borderRadius: 14,
    backgroundColor: "rgba(15,23,42,0.94)",
    borderWidth: 1,
    borderColor: "rgba(71,85,105,0.7)",
    padding: 10,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "700",
  },
  toggleBtn: {
    minWidth: 52,
    height: 28,
    borderRadius: 999,
    backgroundColor: "rgba(30,41,59,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(100,116,139,0.7)",
  },
  toggleBtnText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "700",
  },
  field: {
    gap: 6,
  },
  label: {
    color: "#CBD5E1",
    fontSize: 12,
    fontWeight: "600",
  },
  input: {
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(100,116,139,0.8)",
    backgroundColor: "rgba(15,23,42,0.75)",
    color: "#F8FAFC",
    paddingHorizontal: 10,
    fontSize: 13,
  },
  presetsRow: {
    flexDirection: "row",
    gap: 8,
  },
  presetBtn: {
    flex: 1,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(30,41,59,0.95)",
    borderWidth: 1,
    borderColor: "rgba(100,116,139,0.75)",
  },
  presetText: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "700",
  },
  resetBtn: {
    width: 76,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(100,116,139,0.3)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.6)",
  },
  resetText: {
    color: "#F1F5F9",
    fontSize: 12,
    fontWeight: "700",
  },
});

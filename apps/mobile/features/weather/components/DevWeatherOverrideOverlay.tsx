import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { OptimizeRouteAIData } from "../../routing/services/routingApi";
import type { DevWeatherOverride } from "../hooks/useDevWeatherOverride";

type DevWeatherOverrideOverlayProps = {
  override: DevWeatherOverride;
  onPatch: (partial: Partial<DevWeatherOverride>) => void;
  onClear: () => void;
  lastUsed: OptimizeRouteAIData["usedWeather"] | null;
  top?: number;
};

export function DevWeatherOverrideOverlay({
  override,
  onPatch,
  onClear,
  lastUsed,
  top = 120,
}: DevWeatherOverrideOverlayProps) {
  const [expanded, setExpanded] = useState(false);
  const [rainfallInput, setRainfallInput] = useState(String(override.rainfall_mm));

  useEffect(() => {
    setRainfallInput(String(override.rainfall_mm));
  }, [override.rainfall_mm]);

  if (!__DEV__) return null;

  const applyRainfallInput = () => {
    const parsed = Number(rainfallInput);
    onPatch({ rainfall_mm: Number.isFinite(parsed) ? parsed : override.rainfall_mm });
  };

  return (
    <View pointerEvents="box-none" style={[styles.container, { top }]}>
      <Pressable
        onPress={() => setExpanded((current) => !current)}
        style={[styles.bubble, override.enabled && styles.bubbleEnabled]}
      >
        <Text style={styles.bubbleText}>WX</Text>
      </Pressable>

      {expanded ? (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.title}>DEV Weather</Text>
            <Pressable style={styles.toggleBtn} onPress={() => onPatch({ enabled: !override.enabled })}>
              <Text style={styles.toggleBtnText}>{override.enabled ? "ON" : "OFF"}</Text>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>rainfall_mm</Text>
            <TextInput
              value={rainfallInput}
              onChangeText={setRainfallInput}
              keyboardType="default"
              style={styles.input}
              placeholder="0"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>is_raining</Text>
            <View style={styles.segmented}>
              <Pressable
                style={[styles.segmentBtn, override.is_raining === 0 && styles.segmentBtnActive]}
                onPress={() => onPatch({ is_raining: 0 })}
              >
                <Text style={styles.segmentText}>0</Text>
              </Pressable>
              <Pressable
                style={[styles.segmentBtn, override.is_raining === 1 && styles.segmentBtnActive]}
                onPress={() => onPatch({ is_raining: 1 })}
              >
                <Text style={styles.segmentText}>1</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.presetsRow}>
            <Pressable style={styles.presetBtn} onPress={() => onPatch({ enabled: true, rainfall_mm: 0, is_raining: 0 })}>
              <Text style={styles.presetText}>Dry</Text>
            </Pressable>
            <Pressable style={styles.presetBtn} onPress={() => onPatch({ enabled: true, rainfall_mm: 2, is_raining: 1 })}>
              <Text style={styles.presetText}>Light</Text>
            </Pressable>
            <Pressable style={styles.presetBtn} onPress={() => onPatch({ enabled: true, rainfall_mm: 25, is_raining: 1 })}>
              <Text style={styles.presetText}>Heavy</Text>
            </Pressable>
          </View>

          <View style={styles.footerRow}>
            <Pressable style={styles.saveBtn} onPress={applyRainfallInput}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
            <Pressable style={styles.resetBtn} onPress={onClear}>
              <Text style={styles.resetText}>Reset</Text>
            </Pressable>
          </View>

          <View style={styles.lastUsedBox}>
            <Text style={styles.lastUsedLabel}>Last AI used weather</Text>
            <Text style={styles.lastUsedValue}>
              {lastUsed
                ? `${lastUsed.rainfall_mm}mm | rain=${lastUsed.is_raining} | ${lastUsed.source}`
                : "none"}
            </Text>
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
    backgroundColor: "rgba(8,145,178,0.95)",
    borderColor: "rgba(34,211,238,0.9)",
  },
  bubbleText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
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
  segmented: {
    flexDirection: "row",
    gap: 8,
  },
  segmentBtn: {
    flex: 1,
    height: 34,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(100,116,139,0.8)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(15,23,42,0.55)",
  },
  segmentBtnActive: {
    backgroundColor: "rgba(14,165,233,0.35)",
    borderColor: "rgba(56,189,248,0.95)",
  },
  segmentText: {
    color: "#F8FAFC",
    fontWeight: "700",
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
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  saveBtn: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(14,165,233,0.28)",
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    color: "#E0F2FE",
    fontSize: 12,
    fontWeight: "700",
  },
  resetBtn: {
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: "rgba(100,116,139,0.3)",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  resetText: {
    color: "#F1F5F9",
    fontSize: 12,
    fontWeight: "700",
  },
  lastUsedBox: {
    borderTopWidth: 1,
    borderTopColor: "rgba(100,116,139,0.5)",
    paddingTop: 8,
    gap: 4,
  },
  lastUsedLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
  },
  lastUsedValue: {
    color: "#E2E8F0",
    fontSize: 12,
    fontWeight: "600",
  },
});

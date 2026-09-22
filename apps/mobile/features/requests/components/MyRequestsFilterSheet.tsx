import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/useTheme";
import {
  MOBILE_EMERGENCY_VISUAL_ORDER,
  mobileEmergencyLabel,
  type MobileEmergencyVisualType,
} from "../../emergency/constants/emergencyVisuals";
import type { RequestSortOrder, RequestTypeFilter } from "../models/myRequests";

type MyRequestsFilterSheetProps = {
  visible: boolean;
  sortOrder: RequestSortOrder;
  typeFilter: RequestTypeFilter;
  onApply: (filters: { sortOrder: RequestSortOrder; typeFilter: RequestTypeFilter }) => void;
  onReset: () => void;
  onClose: () => void;
};

const SORT_OPTIONS: { value: RequestSortOrder; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
];

export function MyRequestsFilterSheet({
  visible,
  sortOrder,
  typeFilter,
  onApply,
  onReset,
  onClose,
}: MyRequestsFilterSheetProps) {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const [draftSort, setDraftSort] = useState<RequestSortOrder>(sortOrder);
  const [draftType, setDraftType] = useState<RequestTypeFilter>(typeFilter);

  useEffect(() => {
    if (visible) {
      setDraftSort(sortOrder);
      setDraftType(typeFilter);
    }
  }, [visible, sortOrder, typeFilter]);

  const textColor = isDark ? "#F8FAFC" : "#0F172A";
  const subTextColor = isDark ? "#94A3B8" : "#64748B";
  const cardColor = isDark ? "#0E1626" : "#FFFFFF";
  const borderColor = isDark ? "#1E293B" : "#E2E8F0";
  const chipBg = isDark ? "#162032" : "#F8FAFC";

  const handleApply = () => {
    onApply({
      sortOrder: draftSort,
      typeFilter: draftType,
    });
    onClose();
  };

  const handleReset = () => {
    setDraftSort("newest");
    setDraftType("all");
    onReset();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdropContainer}>
        <Pressable
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          accessibilityRole="button"
          accessibilityLabel="Dismiss filter and sort sheet"
        />

        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: cardColor,
              borderColor,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          {/* Top drag handle */}
          <View style={styles.handleWrap}>
            <View style={[styles.handleBar, { backgroundColor: isDark ? "#334155" : "#CBD5E1" }]} />
          </View>

          {/* Header */}
          <View style={[styles.headerRow, { borderBottomColor: borderColor }]}>
            <Text style={[styles.titleText, { color: textColor }]}>Filter & Sort</Text>
            <Pressable
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close filter sheet"
              style={styles.closeButton}
            >
              <Ionicons name="close-outline" size={24} color={textColor} />
            </Pressable>
          </View>

          <ScrollView
            bounces={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Section 1: SORT BY */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: subTextColor }]}>SORT BY</Text>
              <View style={styles.sortOptionsRow}>
                {SORT_OPTIONS.map((opt) => {
                  const selected = draftSort === opt.value;
                  return (
                    <Pressable
                      key={opt.value}
                      onPress={() => setDraftSort(opt.value)}
                      accessibilityRole="button"
                      accessibilityLabel={`Sort by ${opt.label}`}
                      style={[
                        styles.sortOptionButton,
                        {
                          backgroundColor: selected ? (isDark ? "#3B0E14" : "#FEF2F2") : chipBg,
                          borderColor: selected ? "#DC2626" : borderColor,
                        },
                      ]}
                    >
                      <View style={[styles.radioCircle, { borderColor: selected ? "#DC2626" : borderColor }]}>
                        {selected ? <View style={styles.radioInner} /> : null}
                      </View>
                      <Text
                        style={[
                          styles.sortOptionLabel,
                          { color: selected ? "#DC2626" : textColor, fontWeight: selected ? "700" : "500" },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Section 2: EMERGENCY TYPE */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: subTextColor }]}>EMERGENCY TYPE</Text>
              <View style={styles.chipsWrap}>
                {/* All types */}
                <Pressable
                  onPress={() => setDraftType("all")}
                  accessibilityRole="button"
                  accessibilityLabel="Filter all emergency types"
                  style={[
                    styles.typeChip,
                    {
                      backgroundColor: draftType === "all" ? (isDark ? "#3B0E14" : "#FEF2F2") : chipBg,
                      borderColor: draftType === "all" ? "#DC2626" : borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeChipLabel,
                      { color: draftType === "all" ? "#DC2626" : textColor, fontWeight: draftType === "all" ? "700" : "500" },
                    ]}
                  >
                    All types
                  </Text>
                </Pressable>

                {/* Individual emergency types */}
                {MOBILE_EMERGENCY_VISUAL_ORDER.map((typeKey: MobileEmergencyVisualType) => {
                  const selected = draftType === typeKey;
                  const label = mobileEmergencyLabel(typeKey);
                  return (
                    <Pressable
                      key={typeKey}
                      onPress={() => setDraftType(typeKey)}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter by ${label}`}
                      style={[
                        styles.typeChip,
                        {
                          backgroundColor: selected ? (isDark ? "#3B0E14" : "#FEF2F2") : chipBg,
                          borderColor: selected ? "#DC2626" : borderColor,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeChipLabel,
                          { color: selected ? "#DC2626" : textColor, fontWeight: selected ? "700" : "500" },
                        ]}
                      >
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Actions Row */}
          <View style={[styles.actionsRow, { borderTopColor: borderColor }]}>
            <Pressable
              onPress={handleReset}
              accessibilityRole="button"
              accessibilityLabel="Reset filters"
              style={[styles.resetButton, { borderColor }]}
            >
              <Text style={[styles.resetButtonText, { color: subTextColor }]}>Reset</Text>
            </Pressable>

            <Pressable
              onPress={handleApply}
              accessibilityRole="button"
              accessibilityLabel="Apply filters"
              style={styles.applyButton}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    maxHeight: "85%",
  },
  handleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 999,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: "800",
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 22,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  sortOptionsRow: {
    flexDirection: "row",
    gap: 12,
  },
  sortOptionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#DC2626",
  },
  sortOptionLabel: {
    fontSize: 14,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  typeChipLabel: {
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  resetButton: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  applyButton: {
    flex: 2,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#DC2626",
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});

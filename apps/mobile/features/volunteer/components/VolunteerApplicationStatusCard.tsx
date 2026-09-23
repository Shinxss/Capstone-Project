import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";
import type { VolunteerApplicationRecord } from "../models/volunteerApplication.model";

type Props = {
  application?: VolunteerApplicationRecord | null;
  volunteerStatus?: string | null;
  onPressApplyVolunteer: () => void;
};

function formatSubmissionDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const parsed = new Date(dateStr);
  if (!Number.isFinite(parsed.getTime())) return null;
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function VolunteerApplicationStatusCard({
  application,
  volunteerStatus,
  onPressApplyVolunteer,
}: Props) {
  const { isDark } = useTheme();

  const normalizedVolunteerStatus = String(volunteerStatus ?? "").trim().toUpperCase();
  const applicationStatus = application?.status;
  const isPendingReview =
    applicationStatus === "pending_verification" ||
    (!applicationStatus && normalizedVolunteerStatus === "PENDING");

  const submittedDate = formatSubmissionDate(application?.createdAt);
  const reviewNotes = String(application?.reviewNotes ?? "").trim();

  // 1. Needs Info / Action Required
  if (applicationStatus === "needs_info") {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
            borderColor: isDark ? "#1E293B" : "#BAE6FD",
          },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#F1F5F9" : "#0F172A" }]}>
            Volunteer Application
          </Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isDark ? "rgba(14, 165, 233, 0.18)" : "#F0F9FF",
                borderColor: isDark ? "#0284C7" : "#7DD3FC",
              },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={13} color={isDark ? "#38BDF8" : "#0369A1"} />
            <Text
              style={[
                styles.badgeText,
                { color: isDark ? "#38BDF8" : "#0369A1" },
              ]}
            >
              ACTION REQUIRED
            </Text>
          </View>
        </View>

        <Text style={[styles.description, { color: isDark ? "#94A3B8" : "#475569" }]}>
          The LGU needs additional information before your application can be verified.
        </Text>

        {reviewNotes ? (
          <View
            style={[
              styles.notesBox,
              {
                backgroundColor: isDark ? "#162544" : "#F8FAFC",
                borderColor: isDark ? "#233876" : "#E2E8F0",
              },
            ]}
          >
            <Text style={[styles.notesLabel, { color: isDark ? "#CBD5E1" : "#334155" }]}>
              LGU Review Notes:
            </Text>
            <Text style={[styles.notesText, { color: isDark ? "#94A3B8" : "#475569" }]}>
              {reviewNotes}
            </Text>
          </View>
        ) : null}

        {submittedDate ? (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={isDark ? "#64748B" : "#94A3B8"} />
            <Text style={[styles.dateText, { color: isDark ? "#64748B" : "#64748B" }]}>
              Submitted on {submittedDate}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  // 2. Pending Verification / Under Review (or defensive fallback when volunteerStatus === "PENDING")
  if (isPendingReview) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
            borderColor: isDark ? "#1E293B" : "#FED7AA",
          },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#F1F5F9" : "#0F172A" }]}>
            Volunteer Application
          </Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isDark ? "rgba(245, 158, 11, 0.18)" : "#FFF7ED",
                borderColor: isDark ? "#D97706" : "#FDBA74",
              },
            ]}
          >
            <Ionicons name="time-outline" size={13} color={isDark ? "#FBBF24" : "#C2410C"} />
            <Text
              style={[
                styles.badgeText,
                { color: isDark ? "#FBBF24" : "#C2410C" },
              ]}
            >
              APPLICATION UNDER REVIEW
            </Text>
          </View>
        </View>

        <Text style={[styles.description, { color: isDark ? "#94A3B8" : "#475569" }]}>
          Your application was submitted successfully and is waiting for LGU verification.
        </Text>

        {submittedDate ? (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={isDark ? "#64748B" : "#94A3B8"} />
            <Text style={[styles.dateText, { color: isDark ? "#64748B" : "#64748B" }]}>
              Submitted on {submittedDate}
            </Text>
          </View>
        ) : null}
      </View>
    );
  }

  // 3. Rejected -> Display reason and allow "Apply Again"
  if (applicationStatus === "rejected") {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
            borderColor: isDark ? "#1E293B" : "#FECACA",
          },
        ]}
      >
        <View style={styles.topRow}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#F1F5F9" : "#0F172A" }]}>
            Volunteer Application
          </Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isDark ? "rgba(239, 68, 68, 0.18)" : "#FEF2F2",
                borderColor: isDark ? "#DC2626" : "#FCA5A5",
              },
            ]}
          >
            <Ionicons name="close-circle-outline" size={13} color={isDark ? "#F87171" : "#B91C1C"} />
            <Text
              style={[
                styles.badgeText,
                { color: isDark ? "#F87171" : "#B91C1C" },
              ]}
            >
              APPLICATION REJECTED
            </Text>
          </View>
        </View>

        <Text style={[styles.description, { color: isDark ? "#94A3B8" : "#475569" }]}>
          Your volunteer application was not approved by the LGU.
        </Text>

        {reviewNotes ? (
          <View
            style={[
              styles.notesBox,
              {
                backgroundColor: isDark ? "#2A1215" : "#FFF5F5",
                borderColor: isDark ? "#7F1D1D" : "#FED7D7",
              },
            ]}
          >
            <Text style={[styles.notesLabel, { color: isDark ? "#FCA5A5" : "#991B1B" }]}>
              Reason:
            </Text>
            <Text style={[styles.notesText, { color: isDark ? "#F87171" : "#B91C1C" }]}>
              {reviewNotes}
            </Text>
          </View>
        ) : null}

        <Pressable
          onPress={onPressApplyVolunteer}
          style={({ pressed }) => [
            styles.actionBtn,
            {
              backgroundColor: isDark ? "#DC2626" : "#DC2626",
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text style={styles.actionBtnText}>Apply Again</Text>
        </Pressable>
      </View>
    );
  }

  // 4. Default Community state (No application exists)
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
          borderColor: isDark ? "#162544" : "#E5E7EB",
        },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: isDark ? "#F1F5F9" : "#0F172A", marginBottom: 12 }]}>
        Volunteer Activities
      </Text>
      <Text style={[styles.description, { color: isDark ? "#94A3B8" : "#475569" }]}>
        This section is available for verified volunteers.
      </Text>
      <Pressable
        onPress={onPressApplyVolunteer}
        style={({ pressed }) => [
          styles.actionBtn,
          {
            backgroundColor: isDark ? "#1E3A8A" : "#DC2626",
            borderColor: isDark ? "#3B82F6" : "#DC2626",
            opacity: pressed ? 0.9 : 1,
          },
        ]}
      >
        <Text style={styles.actionBtnText}>Apply as Volunteer</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
  },
  notesBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  notesText: {
    fontSize: 13,
    lineHeight: 18,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  dateText: {
    fontSize: 12,
    fontWeight: "500",
  },
  actionBtn: {
    marginTop: 14,
    width: "100%",
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});

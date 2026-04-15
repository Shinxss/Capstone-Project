import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { MyRequestReviewDTO } from "../models/requestReview";

type VolunteerReviewSummaryCardProps = {
  data: MyRequestReviewDTO | null;
  loading?: boolean;
  onPressPrimary?: () => void;
  primaryLabel?: string | null;
};

function formatReviewDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderStars(rating: number) {
  return [1, 2, 3, 4, 5].map((value) => (
    <Ionicons
      key={value}
      name={value <= rating ? "star" : "star-outline"}
      size={14}
      color={value <= rating ? "#F59E0B" : "#A1A1AA"}
    />
  ));
}

export function VolunteerReviewSummaryCard({
  data,
  loading,
  onPressPrimary,
  primaryLabel,
}: VolunteerReviewSummaryCardProps) {
  const volunteerName = useMemo(() => {
    const name = String(data?.volunteer?.name ?? "").trim();
    if (name) return name;
    return loading ? "Loading volunteer..." : "No volunteer assigned yet";
  }, [data?.volunteer?.name, loading]);
  const volunteerLifelineId = useMemo(
    () => String(data?.volunteer?.lifelineId ?? "").trim(),
    [data?.volunteer?.lifelineId]
  );
  const reviewDate = useMemo(
    () => formatReviewDate(String(data?.review?.updatedAt ?? data?.review?.createdAt ?? "")),
    [data?.review?.updatedAt, data?.review?.createdAt]
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Volunteer Review</Text>

      <View style={styles.row}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={16} color="#374151" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nameText}>{volunteerName}</Text>
          <Text style={styles.metaText}>
            {volunteerLifelineId ? `Lifeline ID: ${volunteerLifelineId}` : "Lifeline ID unavailable"}
          </Text>
        </View>
      </View>

      {data?.review ? (
        <View style={styles.reviewWrap}>
          <View style={styles.ratingRow}>{renderStars(data.review.rating)}</View>
          <Text style={styles.metaText}>Submitted {reviewDate || "recently"}</Text>
          {data.review.comment ? (
            <Text numberOfLines={2} style={styles.commentText}>
              {data.review.comment}
            </Text>
          ) : (
            <Text style={styles.commentHint}>No comment provided.</Text>
          )}
        </View>
      ) : (
        <View style={styles.pendingWrap}>
          <Text style={styles.pendingText}>
            {loading
              ? "Checking review status..."
              : data?.reviewable
                ? "Your request is resolved. Please leave a review for your volunteer responder."
                : String(data?.reason ?? "Review is not available for this request.")}
          </Text>
        </View>
      )}

      {primaryLabel && onPressPrimary ? (
        <Pressable onPress={onPressPrimary} style={({ pressed }) => [styles.actionBtn, pressed ? styles.btnPressed : null]}>
          <Text style={styles.actionBtnText}>{primaryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  row: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  nameText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
  },
  metaText: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  reviewWrap: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  commentText: {
    marginTop: 6,
    fontSize: 12,
    color: "#374151",
    lineHeight: 17,
    fontWeight: "600",
  },
  commentHint: {
    marginTop: 6,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  pendingWrap: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  pendingText: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 17,
    fontWeight: "600",
  },
  actionBtn: {
    marginTop: 10,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  btnPressed: {
    opacity: 0.88,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});

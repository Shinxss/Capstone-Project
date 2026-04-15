import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSession } from "../../auth/hooks/useSession";
import { VolunteerReviewForm } from "../components/VolunteerReviewForm";
import { VolunteerReviewSummaryCard } from "../components/VolunteerReviewSummaryCard";
import { useMyRequestReview } from "../hooks/useMyRequestReview";

function toMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message.trim()) return error.message.trim();
  return fallback;
}

export function MyRequestReviewScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const requestIdParam = params.id;
  const requestId = Array.isArray(requestIdParam)
    ? String(requestIdParam[0] ?? "").trim()
    : String(requestIdParam ?? "").trim();
  const { isUser, loading: sessionLoading } = useSession();
  const isFocused = useIsFocused();
  const { data, loading, submitting, error, refresh, submitReview } = useMyRequestReview(requestId, {
    enabled: isUser && isFocused && Boolean(requestId),
  });

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    initializedRef.current = false;
    setRating(0);
    setComment("");
    setRatingError(null);
    setSubmitError(null);
  }, [requestId]);

  useEffect(() => {
    if (!data || initializedRef.current) return;
    setRating(Number(data.review?.rating ?? 0));
    setComment(String(data.review?.comment ?? ""));
    initializedRef.current = true;
  }, [data]);

  useFocusEffect(
    useCallback(() => {
      if (!isUser || !requestId) return;
      void refresh();
    }, [isUser, refresh, requestId])
  );

  const submitLabel = useMemo(
    () => (data?.review ? "Update Review" : "Submit Review"),
    [data?.review]
  );
  const canEdit = useMemo(() => Boolean(data?.reviewable), [data?.reviewable]);

  const onSubmit = useCallback(async () => {
    if (!data) return;
    if (!data.reviewable) {
      const reason = String(data.reason ?? "This request is not reviewable right now.").trim();
      setSubmitError(reason);
      Alert.alert("Review unavailable", reason);
      return;
    }

    const nextRating = Math.round(Number(rating));
    if (!Number.isFinite(nextRating) || nextRating < 1 || nextRating > 5) {
      setRatingError("Please select a rating between 1 and 5.");
      return;
    }

    setRatingError(null);
    setSubmitError(null);
    const hadReview = Boolean(data.review);

    try {
      await submitReview({
        rating: nextRating,
        comment,
      });
      Alert.alert(
        "Review saved",
        hadReview
          ? "Your volunteer review has been updated."
          : "Thank you. Your volunteer review has been submitted."
      );
      router.replace({
        pathname: "/my-requests/history",
        params: {
          tab: "resolved",
          refreshTs: String(Date.now()),
        },
      });
    } catch (submitErr) {
      const message = toMessage(submitErr, "Failed to submit review");
      setSubmitError(message);
      Alert.alert("Unable to save review", message);
    }
  }, [comment, data, rating, submitReview]);

  if (sessionLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color="#DC2626" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isUser) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Sign in required</Text>
          <Text style={styles.stateSub}>Please sign in to leave a volunteer review.</Text>
          <Pressable style={styles.actionBtn} onPress={() => router.replace("/(auth)/login")}>
            <Text style={styles.actionBtnText}>Go to Login</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!requestId) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Invalid request</Text>
          <Text style={styles.stateSub}>Missing request id.</Text>
          <Pressable style={styles.actionBtn} onPress={() => router.back()}>
            <Text style={styles.actionBtnText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color="#DC2626" />
          <Text style={styles.stateSub}>Loading review details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right"]}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={21} color="#111827" />
        </Pressable>
        <Text style={styles.headerTitle}>Volunteer Review</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <VolunteerReviewSummaryCard
          data={data}
          loading={loading}
          primaryLabel={data?.review ? "Open Tracking Details" : null}
          onPressPrimary={
            data?.review
              ? () => {
                  router.push({
                    pathname: "/my-request-tracking",
                    params: { id: requestId },
                  });
                }
              : undefined
          }
        />

        {canEdit ? (
          <VolunteerReviewForm
            rating={rating}
            comment={comment}
            ratingError={ratingError}
            submitError={submitError}
            submitLabel={submitLabel}
            submitting={submitting}
            onRatingChange={(next) => {
              setRating(next);
              setRatingError(null);
            }}
            onCommentChange={(next) => setComment(next)}
            onSubmit={() => {
              void onSubmit();
            }}
          />
        ) : (
          <View style={styles.infoCard}>
            <Text style={styles.infoCardText}>
              {String(data?.reason ?? "This request is not reviewable right now.")}
            </Text>
          </View>
        )}

        {error && !data ? (
          <View style={styles.infoCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.retryBtn}
              onPress={() => {
                void refresh();
              }}
            >
              <Text style={styles.retryBtnText}>Retry</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  headerRow: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "900",
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 28,
    gap: 12,
  },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoCardText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "600",
    lineHeight: 18,
  },
  errorText: {
    fontSize: 13,
    color: "#B91C1C",
    fontWeight: "700",
  },
  retryBtn: {
    marginTop: 10,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
  },
  retryBtnText: {
    color: "#B91C1C",
    fontSize: 12,
    fontWeight: "800",
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  stateTitle: {
    fontSize: 22,
    color: "#111827",
    fontWeight: "800",
  },
  stateSub: {
    marginTop: 8,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  actionBtn: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },
});

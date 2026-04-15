import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { ReviewStarsInput } from "./ReviewStarsInput";

type VolunteerReviewFormProps = {
  rating: number;
  comment: string;
  ratingError?: string | null;
  submitError?: string | null;
  submitting?: boolean;
  disabled?: boolean;
  submitLabel?: string;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
};

const COMMENT_MAX_LENGTH = 500;

export function VolunteerReviewForm({
  rating,
  comment,
  ratingError,
  submitError,
  submitting,
  disabled,
  submitLabel,
  onRatingChange,
  onCommentChange,
  onSubmit,
}: VolunteerReviewFormProps) {
  const charCount = comment.length;
  const effectiveDisabled = Boolean(disabled || submitting);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Rate Your Responder</Text>
      <Text style={styles.subtitle}>How was the volunteer support for this request?</Text>

      <View style={styles.group}>
        <Text style={styles.label}>Rating</Text>
        <ReviewStarsInput value={rating} onChange={onRatingChange} disabled={effectiveDisabled} error={ratingError} />
      </View>

      <View style={styles.group}>
        <Text style={styles.label}>Comment (optional)</Text>
        <TextInput
          multiline
          numberOfLines={4}
          maxLength={COMMENT_MAX_LENGTH}
          editable={!effectiveDisabled}
          value={comment}
          onChangeText={onCommentChange}
          placeholder="Share your feedback..."
          placeholderTextColor="#9CA3AF"
          textAlignVertical="top"
          style={[styles.commentInput, effectiveDisabled ? styles.commentInputDisabled : null]}
        />
        <Text style={styles.countText}>
          {charCount}/{COMMENT_MAX_LENGTH}
        </Text>
      </View>

      {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

      <Pressable
        onPress={onSubmit}
        disabled={effectiveDisabled}
        style={({ pressed }) => [
          styles.submitButton,
          effectiveDisabled ? styles.submitButtonDisabled : null,
          pressed ? styles.submitButtonPressed : null,
        ]}
      >
        <Text style={styles.submitButtonText}>{submitting ? "Saving..." : submitLabel ?? "Submit Review"}</Text>
      </Pressable>
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
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  group: {
    marginTop: 12,
  },
  label: {
    marginBottom: 6,
    fontSize: 13,
    color: "#374151",
    fontWeight: "700",
  },
  commentInput: {
    minHeight: 98,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "#FFFFFF",
  },
  commentInputDisabled: {
    backgroundColor: "#F9FAFB",
    color: "#6B7280",
  },
  countText: {
    marginTop: 5,
    textAlign: "right",
    fontSize: 11,
    color: "#71717A",
    fontWeight: "600",
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "700",
  },
  submitButton: {
    marginTop: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#FCA5A5",
  },
  submitButtonPressed: {
    opacity: 0.9,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },
});

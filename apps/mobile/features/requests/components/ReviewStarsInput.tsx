import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type ReviewStarsInputProps = {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  error?: string | null;
};

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

export function ReviewStarsInput({ value, onChange, disabled, error }: ReviewStarsInputProps) {
  return (
    <View>
      <View style={styles.row}>
        {STAR_VALUES.map((star) => {
          const active = value >= star;
          return (
            <Pressable
              key={star}
              onPress={() => {
                if (disabled) return;
                onChange(star);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Rate ${star} star${star > 1 ? "s" : ""}`}
              style={({ pressed }) => [
                styles.starButton,
                disabled ? styles.starButtonDisabled : null,
                pressed ? styles.starPressed : null,
              ]}
            >
              <Ionicons
                name={active ? "star" : "star-outline"}
                size={28}
                color={active ? "#F59E0B" : "#A1A1AA"}
              />
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hintText}>{value > 0 ? `${value} out of 5` : "Tap a star to rate"}</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  starButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  starButtonDisabled: {
    opacity: 0.55,
  },
  starPressed: {
    opacity: 0.8,
  },
  hintText: {
    marginTop: 6,
    fontSize: 12,
    color: "#71717A",
    fontWeight: "600",
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: "#B91C1C",
    fontWeight: "700",
  },
});

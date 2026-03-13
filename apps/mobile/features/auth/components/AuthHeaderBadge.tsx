import React from "react";
import { StyleSheet, View } from "react-native";

type AuthHeaderBadgeProps = {
  children: React.ReactNode;
};

export default function AuthHeaderBadge({ children }: AuthHeaderBadgeProps) {
  return (
    <View style={styles.outerShadow}>
      <View style={styles.outerCircle}>
        <View style={styles.innerCircle}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerShadow: {
    shadowColor: "#DC2626",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  outerCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: "#FECACA",
    backgroundColor: "rgba(252, 165, 165, 0.72)",
    alignItems: "center",
    justifyContent: "center",
  },
  innerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
});

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import AuthHeaderBadge from "./AuthHeaderBadge";

type AuthCardProps = {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children: React.ReactNode;
};

export default function AuthCard({ icon, title, subtitle, children }: AuthCardProps) {
  return (
    <View style={[styles.shadow, styles.card]}>
      <View style={styles.badgeContainer}>
        <AuthHeaderBadge>{icon}</AuthHeaderBadge>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.18,
    shadowRadius: 28,
    elevation: 12,
  },
  card: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 22,
  },
  badgeContainer: {
    position: "absolute",
    top: -42,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  title: {
    textAlign: "center",
    color: "#0F172A",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 10,
    textAlign: "center",
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 6,
  },
  content: {
    marginTop: 22,
  },
});

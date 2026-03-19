import React, { Fragment, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

export type RequestProgressStep = "Submitted" | "Assigned" | "En Route" | "Arrived" | "Resolved";

const DEFAULT_PROGRESS_STEPS: RequestProgressStep[] = [
  "Submitted",
  "Assigned",
  "En Route",
  "Arrived",
  "Resolved",
];

type RequestProgressTrackerProps = {
  activeIndex: number;
  steps?: RequestProgressStep[];
};

function clampActiveIndex(activeIndex: number, maxIndex: number) {
  if (!Number.isFinite(activeIndex)) return 0;
  return Math.max(0, Math.min(maxIndex, Math.round(activeIndex)));
}

export function RequestProgressTracker({
  activeIndex,
  steps = DEFAULT_PROGRESS_STEPS,
}: RequestProgressTrackerProps) {
  const safeActiveIndex = useMemo(
    () => clampActiveIndex(activeIndex, Math.max(0, steps.length - 1)),
    [activeIndex, steps.length]
  );
  const isResolvedCurrent = useMemo(() => {
    const activeStep = steps[safeActiveIndex];
    return activeStep === "Resolved";
  }, [safeActiveIndex, steps]);

  const completedColor = "#22C55E";
  const mutedColor = "#D4D4D8";
  const completedTextColor = "#15803D";
  const mutedTextColor = "#71717A";
  const currentColor = isResolvedCurrent ? completedColor : "#DC2626";
  const currentBorderColor = isResolvedCurrent ? "#86EFAC" : "#FCA5A5";
  const currentTextColor = isResolvedCurrent ? completedTextColor : "#B91C1C";

  return (
    <View style={styles.container}>
      <View style={styles.trackRow}>
        {steps.map((step, index) => {
          const isCompleted = index < safeActiveIndex;
          const isCurrent = index === safeActiveIndex;
          const isConnectorActive = index < safeActiveIndex;
          const dotColor = isCurrent ? currentColor : isCompleted ? completedColor : mutedColor;

          return (
            <Fragment key={`${step}-${index}`}>
              <View style={styles.dotSlot}>
                <View
                  style={[
                    styles.dot,
                    isCurrent ? styles.currentDot : styles.smallDot,
                    {
                      backgroundColor: dotColor,
                      borderColor: isCurrent ? currentBorderColor : "transparent",
                    },
                  ]}
                />
              </View>
              {index < steps.length - 1 ? (
                <View
                  style={[
                    styles.connector,
                    { backgroundColor: isConnectorActive ? completedColor : mutedColor },
                  ]}
                />
              ) : null}
            </Fragment>
          );
        })}
      </View>

      <View style={styles.labelsRow}>
        {steps.map((step, index) => {
          const isCompleted = index < safeActiveIndex;
          const isCurrent = index === safeActiveIndex;
          return (
            <View key={`label-${step}-${index}`} style={styles.labelSlot}>
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
                style={[
                  styles.labelText,
                  {
                    color: isCurrent
                      ? currentTextColor
                      : isCompleted
                      ? completedTextColor
                      : mutedTextColor,
                    fontWeight: isCurrent ? "800" : "700",
                  },
                ]}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E4E4E7",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: "#18181B",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  trackRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  dotSlot: {
    width: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    borderRadius: 999,
  },
  smallDot: {
    width: 8,
    height: 8,
    borderWidth: 0,
  },
  currentDot: {
    width: 10,
    height: 10,
    borderWidth: 1.5,
  },
  connector: {
    flex: 1,
    marginHorizontal: 4,
    height: 2,
    borderRadius: 999,
  },
  labelsRow: {
    marginTop: 6,
    width: "100%",
    flexDirection: "row",
  },
  labelSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  labelText: {
    fontSize: 10,
    lineHeight: 12,
    textAlign: "center",
  },
});

import React, { useState } from "react";
import {
  StyleProp,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";

export const DESIGN_WIDTH = 390;
export const MIN_SCALE = 0.88;
export const MAX_SCALE = 1.05;

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function calculateHomeScale(availableWidth: number): number {
  if (!availableWidth || availableWidth <= 0) return 1;
  const raw = availableWidth / DESIGN_WIDTH;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw));
}

export function ScaledHomeContent({ children, style, contentStyle }: Props) {
  const { width } = useWindowDimensions();
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  const availableWidth = Math.min(width, 520);
  const scale = calculateHomeScale(availableWidth);
  const isScaleIdentity = Math.abs(scale - 1) < 0.005;

  return (
    <View
      style={[
        styles.outerContainer,
        contentHeight !== null && !isScaleIdentity
          ? { height: Math.round(contentHeight * scale) }
          : null,
        style,
      ]}
    >
      <View
        onLayout={(e) => {
          const h = Math.round(e.nativeEvent.layout.height);
          if (h > 0 && (contentHeight === null || Math.abs(h - contentHeight) > 1)) {
            setContentHeight(h);
          }
        }}
        style={[
          styles.innerCanvas,
          !isScaleIdentity
            ? {
                transformOrigin: ["50%", 0, 0],
                transform: [{ scale }],
              }
            : null,
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: "100%",
    alignItems: "center",
    overflow: "visible",
  },
  innerCanvas: {
    width: DESIGN_WIDTH,
    alignSelf: "center",
    paddingHorizontal: 16,
  },
});

import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

type FocusDonutProps = {
  percent: number;
  helperText?: string;
  size?: number;
  strokeWidth?: number;
  trackColor?: string;
  progressColor?: string;
  textColor?: string;
  helperTextColor?: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function FocusDonut({
  percent,
  helperText = "Stay active",
  size = 92,
  strokeWidth = 8,
  trackColor = "rgba(255,255,255,0.16)",
  progressColor = "#FCA5A5",
  textColor = "#FFFFFF",
  helperTextColor = "rgba(255,255,255,0.72)",
}: FocusDonutProps) {
  const normalizedPercent = clamp(Math.round(percent), 0, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedPercent / 100) * circumference;
  const showProgress = normalizedPercent > 0;
  const percentFontSize = Math.max(24, Math.round(size * 0.18));
  const helperFontSize = Math.max(10, Math.round(size * 0.078));

  return (
    <View style={styles.center}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {showProgress ? (
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={progressColor}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          ) : null}
        </Svg>
        <View style={styles.overlayCenter}>
          <Text
            style={{ color: textColor, fontSize: percentFontSize, lineHeight: percentFontSize + 1 }}
            numberOfLines={1}
          >
            {normalizedPercent}%
          </Text>
          {helperText ? (
            <Text
              style={{ color: helperTextColor, fontSize: helperFontSize, lineHeight: helperFontSize + 2 }}
              numberOfLines={1}
            >
              {helperText}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  overlayCenter: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});

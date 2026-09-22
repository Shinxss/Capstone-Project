import { useState, type ReactNode } from "react";
import { Image, StyleSheet, View, type ImageProps, type StyleProp, type ViewStyle } from "react-native";
import { useTheme } from "../../features/theme/useTheme";

type SkeletonProps = {
  width?: ViewStyle["width"];
  height?: ViewStyle["height"];
  radius?: number;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ width = "100%", height = 14, radius = 7, className, style }: SkeletonProps) {
  const { isDark } = useTheme();
  return (
    <View
      accessible={false}
      importantForAccessibility="no"
      className={className}
      style={[
        styles.block,
        { width, height, borderRadius: radius },
        isDark ? styles.blockDark : styles.blockLight,
        style,
      ]}
    />
  );
}

export function SkeletonImage({
  containerStyle,
  radius = 16,
  onLoad,
  onError,
  style,
  ...props
}: ImageProps & {
  containerStyle: StyleProp<ViewStyle>;
  radius?: number;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <View style={[containerStyle, { borderRadius: radius, overflow: "hidden" }]}>
      {!loaded ? <Skeleton style={StyleSheet.absoluteFill} radius={radius} /> : null}
      <Image
        {...props}
        style={[StyleSheet.absoluteFill, style, { opacity: loaded ? 1 : 0 }]}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          setLoaded(true);
          onError?.(event);
        }}
      />
    </View>
  );
}

export function SkeletonRegion({
  label,
  style,
  children,
}: {
  label: string;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} style={style}>
      {children}
    </View>
  );
}

export function SkeletonText({
  widths = ["100%"],
  lineHeight = 13,
  gap = 8,
}: {
  widths?: ViewStyle["width"][];
  lineHeight?: number;
  gap?: number;
}) {
  return (
    <View style={{ gap }}>
      {widths.map((width, index) => (
        <Skeleton key={index} width={width} height={lineHeight} radius={lineHeight / 2} />
      ))}
    </View>
  );
}

export function SkeletonAvatar({ size = 44 }: { size?: number }) {
  return <Skeleton width={size} height={size} radius={size / 2} />;
}

export function SkeletonCard({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  const { isDark } = useTheme();
  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight, style]}>
      {children}
    </View>
  );
}

export function SkeletonListItem({ image = false }: { image?: boolean }) {
  return (
    <SkeletonCard style={styles.listItem}>
      {image ? <Skeleton width={64} height={64} radius={14} /> : <SkeletonAvatar size={42} />}
      <View style={styles.listContent}>
        <Skeleton width="68%" height={15} />
        <SkeletonText widths={["88%", "54%"]} lineHeight={12} gap={7} />
        <Skeleton width={82} height={24} radius={12} />
      </View>
    </SkeletonCard>
  );
}

const styles = StyleSheet.create({
  block: {
    overflow: "hidden",
  },
  blockLight: {
    backgroundColor: "#E5E7EB",
  },
  blockDark: {
    backgroundColor: "#1B2A45",
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  cardLight: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  cardDark: {
    backgroundColor: "#0B1220",
    borderColor: "#24324A",
  },
  listItem: {
    minHeight: 112,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  listContent: {
    minWidth: 0,
    flex: 1,
    gap: 9,
  },
});

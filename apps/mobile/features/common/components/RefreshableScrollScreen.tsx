import React from "react";
import {
  RefreshControl,
  ScrollView,
  type RefreshControlProps,
  type ScrollViewProps,
} from "react-native";
import { useTheme } from "../../theme/useTheme";

type RefreshableScrollScreenProps = Omit<ScrollViewProps, "refreshControl"> & {
  refreshing?: boolean;
  onRefresh?: () => void;
  refreshControlProps?: Omit<RefreshControlProps, "refreshing" | "onRefresh">;
};

export function RefreshableScrollScreen({
  refreshing = false,
  onRefresh,
  refreshControlProps,
  ...scrollProps
}: RefreshableScrollScreenProps) {
  const { isDark } = useTheme();
  const spinnerColor = isDark ? "#E2E8F0" : "#DC2626";
  const progressViewOffset = refreshControlProps?.progressViewOffset ?? 170;

  return (
    <ScrollView
      {...scrollProps}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={spinnerColor}
            colors={[spinnerColor]}
            progressViewOffset={progressViewOffset}
            {...refreshControlProps}
          />
        ) : undefined
      }
    />
  );
}

export type { RefreshableScrollScreenProps };

import React, { useMemo } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
  type Edge,
} from "react-native-safe-area-context";
import {
  RefreshableScrollScreen,
  type RefreshableScrollScreenProps,
} from "./RefreshableScrollScreen";

type RefreshableSafeAreaScrollScreenProps = RefreshableScrollScreenProps & {
  safeAreaEdges?: Edge[];
  safeAreaClassName?: string;
  safeAreaStyle?: StyleProp<ViewStyle>;
  includeTopInsetPadding?: boolean;
  includeBottomInsetPadding?: boolean;
};

export function RefreshableSafeAreaScrollScreen({
  safeAreaEdges,
  safeAreaClassName,
  safeAreaStyle,
  includeTopInsetPadding = false,
  includeBottomInsetPadding = false,
  contentContainerStyle,
  ...scrollProps
}: RefreshableSafeAreaScrollScreenProps) {
  const insets = useSafeAreaInsets();

  const insetPaddingStyle = useMemo(
    () => ({
      paddingTop: includeTopInsetPadding ? insets.top : 0,
      paddingBottom: includeBottomInsetPadding ? insets.bottom : 0,
    }),
    [includeBottomInsetPadding, includeTopInsetPadding, insets.bottom, insets.top]
  );

  return (
    <SafeAreaView
      style={[{ flex: 1 }, safeAreaStyle]}
      className={safeAreaClassName}
      edges={safeAreaEdges}
    >
      <RefreshableScrollScreen
        {...scrollProps}
        contentContainerStyle={[insetPaddingStyle, contentContainerStyle]}
      />
    </SafeAreaView>
  );
}

export type { RefreshableSafeAreaScrollScreenProps };

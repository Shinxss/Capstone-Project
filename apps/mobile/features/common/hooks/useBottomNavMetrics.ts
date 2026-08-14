import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsiveLayout } from "./useResponsiveLayout";

export type BottomNavMetrics = {
  contentHeight: number;
  bottomInset: number;
  totalHeight: number;
  screenContentBottomPadding: number;
};

export function useBottomNavMetrics(): BottomNavMetrics {
  const insets = useSafeAreaInsets();
  const { isNarrow } = useResponsiveLayout();
  const contentHeight = isNarrow ? 62 : 64;
  const bottomInset = Math.max(insets.bottom, 8);
  const totalHeight = contentHeight + bottomInset;

  return {
    contentHeight,
    bottomInset,
    totalHeight,
    screenContentBottomPadding: contentHeight + 16,
  };
}

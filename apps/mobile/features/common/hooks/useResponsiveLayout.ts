import { useWindowDimensions } from "react-native";

export type ResponsiveLayout = {
  width: number;
  height: number;
  fontScale: number;
  isNarrow: boolean;
  isCompactHeight: boolean;
  isLargePhone: boolean;
};

export function useResponsiveLayout(): ResponsiveLayout {
  const { width, height, fontScale } = useWindowDimensions();

  return {
    width,
    height,
    fontScale,
    isNarrow: width < 360,
    isCompactHeight: height < 700,
    isLargePhone: width >= 430,
  };
}

import { Text, View } from "react-native";
import type { DispatchBadgeTone } from "../constants/dispatchUi.constants";

const BADGE_STYLES: Record<DispatchBadgeTone, { container: string; text: string }> = {
  pending: {
    container: "border-red-200 bg-red-50",
    text: "text-red-700",
  },
  active: {
    container: "border-red-200 bg-red-50",
    text: "text-red-700",
  },
  review: {
    container: "border-rose-200 bg-rose-50",
    text: "text-rose-700",
  },
  verified: {
    container: "border-red-300 bg-red-100",
    text: "text-red-800",
  },
  neutral: {
    container: "border-slate-200 bg-slate-100",
    text: "text-slate-600",
  },
};

type DispatchStatusBadgeProps = {
  label: string;
  tone?: DispatchBadgeTone;
};

export function DispatchStatusBadge({ label, tone = "neutral" }: DispatchStatusBadgeProps) {
  const style = BADGE_STYLES[tone];
  return (
    <View className={`rounded-full border px-3 py-1 ${style.container}`}>
      <Text className={`text-[11px] font-extrabold ${style.text}`}>{label}</Text>
    </View>
  );
}

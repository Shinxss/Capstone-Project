import type { ReactNode } from "react";
import { Text, View } from "react-native";
import type { DispatchBadgeTone } from "../constants/dispatchUi.constants";
import { DispatchStatusBadge } from "./DispatchStatusBadge";

type TaskCardBaseProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string | null;
  badgeLabel: string;
  badgeTone?: DispatchBadgeTone;
  children?: ReactNode;
};

export function TaskCardBase({
  eyebrow,
  title,
  subtitle,
  badgeLabel,
  badgeTone,
  children,
}: TaskCardBaseProps) {
  return (
    <View className="rounded-3xl border border-slate-200 bg-white p-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          {eyebrow ? (
            <Text className="text-[11px] font-extrabold uppercase tracking-wide text-red-700">
              {eyebrow}
            </Text>
          ) : null}
          <Text className="mt-1 text-lg font-extrabold text-slate-900">{title}</Text>
          {subtitle ? <Text className="mt-1 text-sm font-medium text-slate-600">{subtitle}</Text> : null}
        </View>
        <DispatchStatusBadge label={badgeLabel} tone={badgeTone} />
      </View>
      {children}
    </View>
  );
}

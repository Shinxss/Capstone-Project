import React from "react";
import { Text, View } from "react-native";
import { Check } from "lucide-react-native";

type PasswordChecks = {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
};

type PasswordChecklistProps = {
  checks: PasswordChecks;
};

const CHECK_ITEMS: Array<{ key: keyof PasswordChecks; label: string }> = [
  { key: "minLength", label: "At least 8 characters" },
  { key: "hasLetter", label: "At least one letter" },
  { key: "hasNumber", label: "At least one number" },
];

export default function PasswordChecklist({ checks }: PasswordChecklistProps) {
  return (
    <View className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5">
      <Text className="text-[13px] font-semibold uppercase tracking-[0.7px] text-red-700">Password requirements</Text>
      <View className="mt-3 gap-2.5">
        {CHECK_ITEMS.map((item) => {
          const met = checks[item.key];
          return (
            <View key={item.key} className="flex-row items-center">
              <View className="mr-2.5 h-5 w-5 items-center justify-center rounded-full bg-white">
                {met ? (
                  <Check size={13} color="#15803D" strokeWidth={3} />
                ) : (
                  <View className="h-2 w-2 rounded-full bg-slate-400" />
                )}
              </View>
              <Text className={`text-[15px] ${met ? "font-semibold text-emerald-700" : "text-slate-500"}`}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

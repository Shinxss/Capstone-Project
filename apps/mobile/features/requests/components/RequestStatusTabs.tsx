import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import type { MyRequestStatusTab } from "../models/myRequests";

export type RequestStatusTabOption = {
  value: MyRequestStatusTab;
  label: string;
};

type RequestStatusTabsProps = {
  tabs: RequestStatusTabOption[];
  activeTab: MyRequestStatusTab;
  onChange: (tab: MyRequestStatusTab) => void;
};

export function RequestStatusTabs({ tabs, activeTab, onChange }: RequestStatusTabsProps) {
  return (
    <View className="border-b border-zinc-200 bg-white">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10 }}
      >
        <View className="flex-row items-center gap-2">
          {tabs.map((tab) => {
            const active = tab.value === activeTab;
            return (
              <Pressable
                key={tab.value}
                onPress={() => onChange(tab.value)}
                className={`rounded-full border px-4 py-2 ${
                  active ? "border-red-500 bg-red-50" : "border-zinc-200 bg-white"
                }`}
              >
                <Text
                  className={`text-xs font-extrabold ${
                    active ? "text-red-600" : "text-zinc-600"
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

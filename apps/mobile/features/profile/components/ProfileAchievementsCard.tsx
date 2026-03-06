import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../theme/useTheme";
import type { ProfileAchievement } from "../models/profile";

type ProfileAchievementsCardProps = {
  achievements: ProfileAchievement[];
};

export default function ProfileAchievementsCard({ achievements }: ProfileAchievementsCardProps) {
  const { isDark } = useTheme();

  return (
    <View className="mt-4 px-5">
      <Text className="text-[17px] font-extrabold text-slate-900 dark:text-slate-100">Achievements</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 12, paddingRight: 20 }}
      >
        {achievements.map((achievement) => (
          <View
            key={achievement.id}
            style={{
              marginRight: 12,
              minWidth: 144,
              borderRadius: 18,
              borderWidth: 1,
              paddingHorizontal: 14,
              paddingVertical: 12,
              backgroundColor: isDark ? "#0E1626" : "#FFFFFF",
              borderColor: isDark ? "#162544" : "#E5E7EB",
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDark ? "#1B2A45" : "#FEE2E2",
              }}
            >
              <Ionicons
                name={achievement.icon}
                size={18}
                color={isDark ? "#60A5FA" : "#DC2626"}
              />
            </View>
            <Text className="mt-3 text-[14px] font-semibold text-slate-900 dark:text-slate-100">
              {achievement.title}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

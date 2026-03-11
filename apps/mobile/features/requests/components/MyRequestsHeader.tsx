import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export type MyRequestsHeaderTabOption<T extends string = string> = {
  value: T;
  label: string;
};

type MyRequestsHeaderProps<T extends string> = {
  tabs: MyRequestsHeaderTabOption<T>[];
  activeTab: T;
  onTabChange: (tab: T) => void;
  searchValue: string;
  onSearchValueChange: (value: string) => void;
  searchPlaceholder?: string;
  onBackPress: () => void;
  onMenuPress?: () => void;
};

export function MyRequestsHeader<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  searchValue,
  onSearchValueChange,
  searchPlaceholder = "Search requests",
  onBackPress,
  onMenuPress,
}: MyRequestsHeaderProps<T>) {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <Pressable onPress={onBackPress} hitSlop={8} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={22} color="#111827" />
        </Pressable>

        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={22} color="#111827" />
          <TextInput
            value={searchValue}
            onChangeText={onSearchValueChange}
            placeholder={searchPlaceholder}
            placeholderTextColor="#6B7280"
            style={styles.searchInput}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Pressable
          onPress={onMenuPress}
          hitSlop={8}
          style={styles.iconButton}
          disabled={!onMenuPress}
        >
          <Ionicons name="menu-outline" size={25} color="#111827" />
        </Pressable>
      </View>

      <View style={styles.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {tabs.map((tab) => {
            const active = tab.value === activeTab;

            return (
              <Pressable
                key={tab.value}
                onPress={() => onTabChange(tab.value)}
                style={styles.tabButton}
              >
                <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null]}>
                  {tab.label}
                </Text>
                <View style={styles.tabIndicatorTrack}>
                  {active ? <View style={styles.tabIndicator} /> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 50,
    paddingBottom: 10,
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: "#111827",
    paddingVertical: 0,
  },
  tabsWrap: {
    borderTopWidth: 0,
  },
  tabsContent: {
    paddingHorizontal: 10,
  },
  tabButton: {
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingTop: 14,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 10,
  },
  tabLabelActive: {
    color: "#DC2626",
    fontWeight: "700",
  },
  tabIndicatorTrack: {
    height: 2,
    width: "100%",
  },
  tabIndicator: {
    height: 2,
    width: "100%",
    backgroundColor: "#DC2626",
  },
});

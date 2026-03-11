import { useEffect, useRef } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { TasksTabItem, TasksTabKey } from "../models/dispatchTaskView";

type TasksTabsProps = {
  tabs: TasksTabItem[];
  activeTab: TasksTabKey;
  onChange: (tab: TasksTabKey) => void;
};

export function TasksTabs({ tabs, activeTab, onChange }: TasksTabsProps) {
  const scrollRef = useRef<ScrollView | null>(null);
  const layoutByKeyRef = useRef<Record<string, { x: number; width: number }>>({});

  useEffect(() => {
    const layout = layoutByKeyRef.current[activeTab];
    if (!layout) return;
    const targetX = Math.max(0, layout.x - 20);
    scrollRef.current?.scrollTo({ x: targetX, animated: true });
  }, [activeTab]);

  return (
    <View style={styles.tabsWrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => {
          const selected = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onLayout={(event) => {
                const { x, width } = event.nativeEvent.layout;
                layoutByKeyRef.current[tab.key] = { x, width };
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={`${tab.label} tab`}
              onPress={() => onChange(tab.key)}
              style={styles.tabButton}
            >
              <Text style={[styles.tabLabel, selected ? styles.tabLabelActive : null]}>
                {tab.label}
              </Text>
              <View style={styles.tabIndicatorTrack}>{selected ? <View style={styles.tabIndicator} /> : null}</View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tabsWrap: {
    borderTopWidth: 0,
  },
  tabsContent: {
    paddingHorizontal: 10,
  },
  tabButton: {
    minWidth: 120,
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

import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

type TaskSearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
};

export function TaskSearchBar({
  value,
  onChangeText,
  placeholder = "Search tasks...",
}: TaskSearchBarProps) {
  const hasValue = value.trim().length > 0;

  return (
    <View style={styles.searchWrap}>
      <Ionicons name="search-outline" size={22} color="#111827" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6B7280"
        style={styles.searchInput}
        accessibilityLabel="Search tasks"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {hasValue ? (
        <Pressable
          onPress={() => onChangeText("")}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={10}
          style={styles.clearButton}
        >
          <Ionicons name="close-circle" size={18} color="#6B7280" />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    columnGap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: "#111827",
    paddingVertical: 0,
  },
  clearButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});

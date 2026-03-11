import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

type DispatchEmptyStateProps = {
  title: string;
  message: string;
};

export function DispatchEmptyState({ title, message }: DispatchEmptyStateProps) {
  return (
    <View className="rounded-3xl border border-dashed border-red-200 bg-white p-6">
      <View className="items-center">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <Ionicons name="clipboard-outline" size={22} color="#B91C1C" />
        </View>
        <Text className="mt-3 text-base font-extrabold text-slate-900">{title}</Text>
        <Text className="mt-1 text-center text-sm font-medium text-slate-500">{message}</Text>
      </View>
    </View>
  );
}

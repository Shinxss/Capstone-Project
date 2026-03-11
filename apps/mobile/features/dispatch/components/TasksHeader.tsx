import { Text, View } from "react-native";
import { TASKS_SCREEN_COPY } from "../constants/dispatchUi.constants";

export function TasksHeader() {
  return (
    <View className="px-5 pb-3 pt-6">
      <Text className="text-3xl font-extrabold text-slate-900">{TASKS_SCREEN_COPY.title}</Text>
      <Text className="mt-1 text-sm font-medium text-red-700">{TASKS_SCREEN_COPY.subtitle}</Text>
    </View>
  );
}

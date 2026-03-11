import { View } from "react-native";

function SkeletonCard() {
  return (
    <View className="rounded-3xl border border-slate-200 bg-white p-4">
      <View className="h-3 w-24 rounded-full bg-slate-200" />
      <View className="mt-3 h-6 w-3/5 rounded-lg bg-slate-200" />
      <View className="mt-2 h-4 w-2/5 rounded-lg bg-slate-200" />
      <View className="mt-4 h-4 w-full rounded-lg bg-slate-100" />
      <View className="mt-2 h-4 w-4/5 rounded-lg bg-slate-100" />
      <View className="mt-4 flex-row gap-3">
        <View className="h-11 flex-1 rounded-xl bg-slate-200" />
        <View className="h-11 flex-1 rounded-xl bg-slate-200" />
      </View>
    </View>
  );
}

export function DispatchSkeleton() {
  return (
    <View className="gap-3">
      <SkeletonCard />
      <SkeletonCard />
    </View>
  );
}

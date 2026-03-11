import type { ReactNode } from "react";
import { View } from "react-native";
import type { DispatchOffer } from "../models/dispatch";
import { DispatchEmptyState } from "./DispatchEmptyState";
import { DispatchSkeleton } from "./DispatchSkeleton";

type TaskSectionProps = {
  loading: boolean;
  items: DispatchOffer[];
  emptyTitle: string;
  emptyMessage: string;
  renderItem: (dispatch: DispatchOffer) => ReactNode;
};

export function TaskSection({
  loading,
  items,
  emptyTitle,
  emptyMessage,
  renderItem,
}: TaskSectionProps) {
  if (loading) {
    return <DispatchSkeleton />;
  }

  if (items.length === 0) {
    return <DispatchEmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return <View className="gap-3">{items.map((dispatch) => <View key={dispatch.id}>{renderItem(dispatch)}</View>)}</View>;
}

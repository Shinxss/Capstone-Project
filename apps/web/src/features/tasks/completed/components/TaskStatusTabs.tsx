import SharedTaskStatusTabs from "../../components/TaskStatusTabs";
import type { TaskStatusCounts } from "../types/completedTask.types";

type Props = { counts: TaskStatusCounts };

export default function CompletedTaskStatusTabs({ counts }: Props) {
  return <SharedTaskStatusTabs active="completed" counts={counts} />;
}

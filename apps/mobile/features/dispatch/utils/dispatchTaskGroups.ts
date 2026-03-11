import { DEFAULT_TASKS_TAB, TASKS_TAB_CONFIG } from "../constants/dispatchUi.constants";
import type { DispatchOffer } from "../models/dispatch";
import type { DispatchTaskGroups, TasksTabKey } from "../models/dispatchTaskView";

type GroupDispatchesInput = {
  pendingDispatch?: DispatchOffer | null;
  currentDispatch?: DispatchOffer | null;
  completedDispatches?: DispatchOffer[] | null;
};

function createEmptyTaskGroups(): DispatchTaskGroups {
  return {
    new_dispatch: [],
    active: [],
    awaiting_approval: [],
    completed: [],
  };
}

export function groupDispatchesForTasks(input: GroupDispatchesInput): DispatchTaskGroups {
  const groups = createEmptyTaskGroups();
  const completedById = new Set<string>();

  const pending = input.pendingDispatch;
  if (pending?.status === "PENDING") {
    groups.new_dispatch.push(pending);
  }

  const current = input.currentDispatch;
  if (current?.status === "ACCEPTED") {
    groups.active.push(current);
  } else if (current?.status === "DONE") {
    groups.awaiting_approval.push(current);
  } else if (current?.status === "VERIFIED") {
    groups.completed.push(current);
    completedById.add(current.id);
  }

  const completed = Array.isArray(input.completedDispatches) ? input.completedDispatches : [];
  completed.forEach((dispatch) => {
    if (!dispatch?.id) return;
    if (dispatch.status !== "VERIFIED") return;
    if (completedById.has(dispatch.id)) return;
    groups.completed.push(dispatch);
    completedById.add(dispatch.id);
  });

  return groups;
}

export function hasAnyDispatchTasks(groups: DispatchTaskGroups) {
  return Object.values(groups).some((items) => items.length > 0);
}

export function getDefaultTasksTab(groups: DispatchTaskGroups): TasksTabKey {
  const firstPopulatedTab = TASKS_TAB_CONFIG.find((tab) => groups[tab.key].length > 0);
  return firstPopulatedTab?.key ?? DEFAULT_TASKS_TAB;
}

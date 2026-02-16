import { useLguTaskHistory } from "./useLguTaskHistory";

export function useLguTasksCompleted() {
  return useLguTaskHistory("VERIFIED");
}

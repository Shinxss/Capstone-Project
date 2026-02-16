import { useLguTaskHistory } from "./useLguTaskHistory";
import { useDispatchReassign } from "./useDispatchReassign";

export function useLguTasksCanceled() {
  const history = useLguTaskHistory("CANCELLED");
  const reassign = useDispatchReassign();

  return {
    ...history,
    reassign,
  };
}

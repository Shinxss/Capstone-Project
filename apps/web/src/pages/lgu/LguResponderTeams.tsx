import LguShell from "../../components/lgu/LguShell";
import LguResponderTeamsView from "../../features/responderTeams/components/LguResponderTeamsView";
import { useResponderTeams } from "../../features/responderTeams/hooks/useResponderTeams";

export default function LguResponderTeams() {
  const vm = useResponderTeams();

  return (
    <LguShell title="Teams" subtitle="Create responder teams and organize deployment groups">
      <LguResponderTeamsView {...vm} />
    </LguShell>
  );
}

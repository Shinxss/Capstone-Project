import LguShell from "../../components/lgu/LguShell";
import LguResponderAccountsView from "../../features/responderAccounts/components/LguResponderAccountsView";
import { useResponderAccounts } from "../../features/responderAccounts/hooks/useResponderAccounts";

export default function LguResponderAccounts() {
  const vm = useResponderAccounts();

  return (
    <LguShell title="Responder Accounts" subtitle="Manage responder personnel records and duty readiness">
      <LguResponderAccountsView {...vm} />
    </LguShell>
  );
}

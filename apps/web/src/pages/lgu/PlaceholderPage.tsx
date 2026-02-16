import LguShell from "../../components/lgu/LguShell";
import LguPlaceholderView from "../../features/placeholder/components/LguPlaceholderView";
import { useLguPlaceholder } from "../../features/placeholder/hooks/useLguPlaceholder";

type Props = {
  title: string;
  subtitle?: string;
};

export default function PlaceholderPage({ title, subtitle = "Page coming soon" }: Props) {
  const vm = useLguPlaceholder(title);

  return (
    <LguShell title={title} subtitle={subtitle}>
      <LguPlaceholderView loading={vm.loading} error={vm.error} onRefresh={vm.refetch} title={title} />
    </LguShell>
  );
}

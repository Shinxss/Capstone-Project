import { Activity, CloudRain, Flame, HeartPulse, Siren, Waves, Wind } from "lucide-react";

type Props = { type: string; size?: number };

export default function EmergencyTypeIcon({ type, size = 25 }: Props) {
  const value = type.toLocaleLowerCase();
  if (value.includes("fire")) return <Flame size={size} aria-hidden="true" />;
  if (value.includes("medical")) return <HeartPulse size={size} aria-hidden="true" />;
  if (value.includes("flood")) return <Waves size={size} aria-hidden="true" />;
  if (value.includes("typhoon")) return <Wind size={size} aria-hidden="true" />;
  if (value.includes("storm")) return <CloudRain size={size} aria-hidden="true" />;
  if (value.includes("earthquake")) return <Activity size={size} aria-hidden="true" />;
  return <Siren size={size} aria-hidden="true" />;
}

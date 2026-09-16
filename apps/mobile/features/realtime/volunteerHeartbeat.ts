export const VOLUNTEER_HEARTBEAT_INTERVAL_MS = 15_000;

export type VolunteerHeartbeatPlan = {
  enabled: boolean;
  onDuty: boolean;
  intervalMs: number | null;
};

export function getVolunteerHeartbeatPlan(role: unknown, onDuty: unknown): VolunteerHeartbeatPlan {
  const normalizedRole = String(role ?? "").trim().toUpperCase();
  const enabled = normalizedRole === "RESPONDER" || normalizedRole === "VOLUNTEER";
  const effectiveOnDuty = enabled && Boolean(onDuty);

  return {
    enabled,
    onDuty: effectiveOnDuty,
    intervalMs: effectiveOnDuty ? VOLUNTEER_HEARTBEAT_INTERVAL_MS : null,
  };
}

import { useEffect, useMemo, useState } from "react";
import {
  Copy,
  Download,
  ExternalLink,
  LocateFixed,
  Navigation2,
  Users,
  X,
} from "lucide-react";

import EmptyState from "../../../components/ui/EmptyState";
import type { EmergencyReport } from "../../emergency/models/emergency.types";
import { emergencyTitleForType, normalizeEmergencyType } from "../../emergency/constants/emergency.constants";
import type { DispatchTask, TaskProof } from "../../tasks/models/tasks.types";
import { fetchTaskProofBlob } from "../../tasks/services/tasksApi";
import type { LguEmergencyDetails, Volunteer } from "../models/lguLiveMap.types";

type DrawerTab = "overview" | "dispatch" | "timeline" | "aar" | "blockchain";

type Props = {
  open: boolean;
  onClose: () => void;
  emergency: LguEmergencyDetails | null;
  rawEmergency: EmergencyReport | undefined;
  tasks: DispatchTask[];
  tasksLoading: boolean;
  tasksError: string | null;
  onZoomToEmergency: () => void;
  onOpenDispatch: () => void;
  trackOpen: boolean;
  onToggleTrack: () => void;
  responders: Volunteer[];
  onCenterResponder: (id: string) => void;
};

type TimelineItem = {
  id: string;
  label: string;
  at: number;
};

type ProofPreviewTarget = {
  taskId: string;
  taskLabel: string;
  proof: TaskProof;
};

const TAB_LABELS: Array<{ id: DrawerTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "dispatch", label: "Dispatch" },
  { id: "timeline", label: "Timeline" },
  { id: "aar", label: "AAR" },
  { id: "blockchain", label: "Blockchain" },
];

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString();
}

function emergencySeverity(emergencyType?: string) {
  const up = String(emergencyType ?? "").toUpperCase();
  if (up === "SOS" || up === "FIRE" || up === "FLOOD") return "High";
  return "Medium";
}

async function copyText(value: string) {
  if (!value) return;
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const el = document.createElement("textarea");
    el.value = value;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

function statusBadgeClass(statusRaw?: string) {
  const status = String(statusRaw ?? "").toUpperCase();
  if (status === "VERIFIED") return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300";
  if (status === "DONE") return "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300";
  if (status === "ACCEPTED" || status === "PENDING") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300";
  }
  if (status === "DECLINED" || status === "CANCELLED") {
    return "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300";
  }
  return "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300";
}

export default function EmergencyDetailsDrawer({
  open,
  onClose,
  emergency,
  rawEmergency,
  tasks,
  tasksLoading,
  tasksError,
  onZoomToEmergency,
  onOpenDispatch,
  trackOpen,
  onToggleTrack,
  responders,
  onCenterResponder,
}: Props) {
  const [tab, setTab] = useState<DrawerTab>("overview");
  const [previewTarget, setPreviewTarget] = useState<ProofPreviewTarget | null>(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState<string | null>(null);
  const [previewMime, setPreviewMime] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setTab("overview");
      setPreviewTarget(null);
      setPreviewError(null);
      setPreviewLoading(false);
      setPreviewMime("");
      setPreviewObjectUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [open]);

  useEffect(() => {
    setTab("overview");
  }, [emergency?.id]);

  useEffect(() => {
    if (!previewTarget) return;

    let cancelled = false;
    let nextObjectUrl: string | null = null;

    setPreviewLoading(true);
    setPreviewError(null);
    setPreviewMime(previewTarget.proof.mimeType ?? "");

    fetchTaskProofBlob(previewTarget.proof.url)
      .then((blob) => {
        if (cancelled) return;
        nextObjectUrl = URL.createObjectURL(blob);
        setPreviewMime(blob.type || previewTarget.proof.mimeType || "");
        setPreviewObjectUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return nextObjectUrl;
        });
      })
      .catch((error: any) => {
        if (cancelled) return;
        setPreviewObjectUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
        setPreviewError(error?.message ?? "Failed to load proof.");
      })
      .finally(() => {
        if (cancelled) return;
        setPreviewLoading(false);
      });

    return () => {
      cancelled = true;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [previewTarget]);

  const reporter = useMemo(() => {
    const reportedBy = rawEmergency?.reportedBy;
    if (reportedBy && typeof reportedBy === "object") {
      const fullName = `${reportedBy.firstName ?? ""} ${reportedBy.lastName ?? ""}`.trim();
      return {
        name: fullName || reportedBy.username || reportedBy.email || "Unknown",
        email: reportedBy.email || "-",
      };
    }

    return {
      name: "Guest / Unknown",
      email: "-",
    };
  }, [rawEmergency]);

  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];

    const addItem = (id: string, label: string, dateRaw?: string | null) => {
      if (!dateRaw) return;
      const ts = new Date(dateRaw).getTime();
      if (!Number.isFinite(ts)) return;
      items.push({ id, label, at: ts });
    };

    addItem("emergency-reported", "Reported", emergency?.reportedAt);
    addItem("emergency-status", `Current Status: ${emergency?.status ?? "Unknown"}`, rawEmergency?.updatedAt ?? emergency?.reportedAt);

    tasks.forEach((task) => {
      const volunteerName = task.volunteer?.name || "Volunteer";
      addItem(`task-${task.id}-created`, `Dispatch created (${volunteerName})`, task.createdAt);
      addItem(`task-${task.id}-responded`, `Volunteer responded (${volunteerName})`, task.respondedAt);
      addItem(`task-${task.id}-done`, `Marked done (${volunteerName})`, task.completedAt);
      addItem(`task-${task.id}-verified`, `Verified (${volunteerName})`, task.verifiedAt);
    });

    return items.sort((a, b) => b.at - a.at);
  }, [emergency?.reportedAt, emergency?.status, rawEmergency?.updatedAt, tasks]);

  const aarTasks = useMemo(() => {
    return tasks.filter((task) => {
      const hasProofs = Array.isArray(task.proofs) && task.proofs.length > 0;
      return hasProofs || Boolean(task.completedAt);
    });
  }, [tasks]);

  const chainTasks = useMemo(() => {
    return tasks.filter((task) => task.chainRecord?.txHash);
  }, [tasks]);

  const displayEmergencyId = emergency?.id ? `EMG-${emergency.id}` : "-";
  const mapsUrl =
    emergency && Number.isFinite(emergency.lat) && Number.isFinite(emergency.lng)
      ? `https://www.google.com/maps?q=${emergency.lat},${emergency.lng}`
      : null;
  const severity = emergencySeverity(emergency?.emergencyType);
  const taskBackedDispatch = tasks.length > 0;
  const assignedCount = taskBackedDispatch ? tasks.length : responders.length;
  const previewIsImage = previewMime.startsWith("image/");

  const closeProofPreview = () => {
    setPreviewTarget(null);
    setPreviewError(null);
    setPreviewLoading(false);
    setPreviewMime("");
    setPreviewObjectUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const downloadProof = () => {
    if (!previewObjectUrl || !previewTarget) return;
    const a = document.createElement("a");
    a.href = previewObjectUrl;
    a.download = previewTarget.proof.fileName || `proof-${previewTarget.taskId}`;
    a.rel = "noreferrer";
    a.click();
  };

  return (
    <>
      {open ? <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} /> : null}

      <aside
        className={[
          "fixed top-0 right-0 h-full w-[420px] max-w-[92vw] z-50",
          "bg-white border-l border-gray-200 dark:bg-[#0B1220] dark:border-[#162544]",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full pointer-events-none",
        ].join(" ")}
      >
        <div className="h-full flex flex-col">
          <div className="px-4 py-4 border-b border-gray-200 dark:border-[#162544]">
            <div className="flex items-center justify-between">
              <div className="text-sm font-bold text-gray-900 dark:text-slate-100">Emergency Details</div>
              <button
                type="button"
                onClick={onClose}
                className="h-9 w-9 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-700 dark:text-slate-300 dark:hover:bg-[#122036]"
                aria-label="Close details"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 text-xl font-black tracking-tight text-gray-900 dark:text-slate-100">
              {emergency ? emergencyTitleForType(normalizeEmergencyType(emergency.emergencyType)) : "Unknown"}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">
                Severity: {severity}
              </span>
              <span
                className={[
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold",
                  statusBadgeClass(emergency?.status),
                ].join(" ")}
              >
                {emergency?.status || "UNKNOWN"}
              </span>
            </div>

            <div className="mt-3 text-xs text-gray-600 dark:text-slate-400 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 truncate">
                  ID: <span className="font-bold text-gray-900 dark:text-slate-200">{displayEmergencyId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => void copyText(emergency?.id ?? "")}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 border border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-[#22365D] dark:text-slate-300 dark:hover:bg-[#122036]"
                >
                  <Copy size={12} />
                  Copy
                </button>
              </div>
              <div>
                Reported: <span className="font-semibold text-gray-900 dark:text-slate-200">{formatDateTime(emergency?.reportedAt)}</span>
              </div>
            </div>
          </div>

          <div className="px-4 border-b border-gray-200 dark:border-[#162544]">
            <div className="flex items-center gap-4 overflow-x-auto">
              {TAB_LABELS.map((tabOption) => {
                const active = tab === tabOption.id;
                return (
                  <button
                    key={tabOption.id}
                    type="button"
                    onClick={() => setTab(tabOption.id)}
                    className={[
                      "shrink-0 border-b-2 py-3 text-sm transition-colors",
                      active
                        ? "border-blue-600 text-blue-600 font-bold dark:border-blue-400 dark:text-blue-300"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200",
                    ].join(" ")}
                  >
                    {tabOption.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {tab === "overview" ? (
              <>
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0E1626]">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-500">Location</div>
                  <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {emergency?.barangayName ? `Brgy. ${emergency.barangayName}` : "-"}
                  </div>
                  <div className="mt-1 text-xs text-gray-600 dark:text-slate-400">
                    {emergency ? `${emergency.lng.toFixed(6)}, ${emergency.lat.toFixed(6)}` : "-"}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={onZoomToEmergency}
                      className="rounded-lg bg-blue-600 text-white hover:bg-blue-500 px-3 py-2 text-xs font-bold"
                    >
                      Zoom to Area
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!mapsUrl) return;
                        window.open(mapsUrl, "_blank", "noopener,noreferrer");
                      }}
                      className="rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 px-3 py-2 text-xs font-bold dark:border-[#22365D] dark:bg-[#0B1220] dark:text-slate-200 dark:hover:bg-[#122036]"
                    >
                      Open in Maps
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0E1626]">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-500">Reporter</div>
                  <div className="mt-2 text-sm font-semibold text-gray-900 dark:text-slate-100">{reporter.name}</div>
                  <div className="text-xs text-gray-600 dark:text-slate-400">{reporter.email}</div>

                  <div className="mt-3 text-xs text-gray-500 dark:text-slate-500">Source</div>
                  <div className="text-sm text-gray-900 dark:text-slate-200">{rawEmergency?.source || emergency?.source || "-"}</div>

                  <div className="mt-3 text-xs text-gray-500 dark:text-slate-500">Notes</div>
                  <div className="text-sm text-gray-900 whitespace-pre-wrap dark:text-slate-300">
                    {rawEmergency?.notes || emergency?.notes || "-"}
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0E1626]">
                  <div className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-slate-500">Risks</div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between text-gray-700 dark:text-slate-300">
                      <span>Road</span>
                      <span className="font-semibold">Passable -</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-700 dark:text-slate-300">
                      <span>AI Risk Score</span>
                      <span className="font-semibold">-</span>
                    </div>
                    <div className="flex items-center justify-between text-gray-700 dark:text-slate-300">
                      <span>Weather</span>
                      <span className="font-semibold">-</span>
                    </div>
                  </div>
                </div>
              </>
            ) : null}

            {tab === "dispatch" ? (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onOpenDispatch}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 px-3 py-2 text-xs font-bold"
                  >
                    <Users size={14} />
                    Dispatch Responders
                  </button>

                  <button
                    type="button"
                    onClick={onToggleTrack}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 px-3 py-2 text-xs font-bold dark:border-[#22365D] dark:bg-[#0B1220] dark:text-slate-200 dark:hover:bg-[#122036]"
                  >
                    <Navigation2 size={14} />
                    {trackOpen ? "Hide Tracking" : "Track Responders"}
                  </button>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0E1626]">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-extrabold text-gray-900 dark:text-slate-100">Assigned responders</div>
                    <div className="text-xs font-bold text-gray-600 dark:text-slate-400">{assignedCount}</div>
                  </div>
                  <div className="mt-1 text-xs text-gray-500 dark:text-slate-500">
                    {taskBackedDispatch ? "Using backend dispatch tasks for this emergency." : "Using local assigned responders fallback."}
                  </div>

                  {tasksLoading ? (
                    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-600 dark:border-[#162544] dark:bg-[#0B1220] dark:text-slate-300">
                      Loading dispatch tasks...
                    </div>
                  ) : null}

                  {tasksError ? (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                      {tasksError}
                    </div>
                  ) : null}

                  {!tasksLoading && taskBackedDispatch ? (
                    <div className="mt-3 space-y-2">
                      {tasks.map((task) => {
                        const volunteerId = task.volunteer?.id ?? "";
                        const lastLoc = task.lastKnownLocation
                          ? `${task.lastKnownLocation.lng.toFixed(5)}, ${task.lastKnownLocation.lat.toFixed(5)}`
                          : "No live location yet";

                        return (
                          <div
                            key={task.id}
                            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-[#162544] dark:bg-[#0B1220]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="text-sm font-bold text-gray-900 truncate dark:text-slate-100">
                                  {task.volunteer?.name || "Volunteer"}
                                </div>
                                <div className="mt-0.5 text-xs text-gray-600 dark:text-slate-400">{lastLoc}</div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={[
                                    "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold",
                                    statusBadgeClass(task.status),
                                  ].join(" ")}
                                >
                                  {task.status}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => volunteerId && onCenterResponder(volunteerId)}
                                  disabled={!volunteerId}
                                  className="h-8 w-8 rounded-md border border-gray-200 hover:bg-white grid place-items-center disabled:opacity-40 dark:border-[#22365D] dark:hover:bg-[#122036]"
                                  title="Center"
                                  aria-label="Center responder"
                                >
                                  <LocateFixed size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  {!tasksLoading && !taskBackedDispatch ? (
                    responders.length === 0 ? (
                      <div className="mt-3 text-sm text-gray-700 dark:text-slate-300">
                        No responders assigned yet. Use <span className="font-semibold">Dispatch Responders</span>.
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {responders.map((responder) => (
                          <div
                            key={responder.id}
                            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-[#162544] dark:bg-[#0B1220]"
                          >
                            <div>
                              <div className="text-sm font-bold text-gray-900 dark:text-slate-100">{responder.name}</div>
                              <div className="text-xs text-gray-600 dark:text-slate-400">{responder.skill}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => onCenterResponder(responder.id)}
                              className="h-8 w-8 rounded-md border border-gray-200 hover:bg-white grid place-items-center dark:border-[#22365D] dark:hover:bg-[#122036]"
                              title="Center"
                              aria-label="Center responder"
                            >
                              <LocateFixed size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )
                  ) : null}
                </div>
              </>
            ) : null}
            {tab === "timeline" ? (
              timelineItems.length === 0 ? (
                <EmptyState
                  title="No timeline events yet."
                  description="Events will appear once dispatch actions start."
                  className="min-h-[180px]"
                />
              ) : (
                <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0E1626]">
                  <ol className="space-y-3">
                    {timelineItems.map((item) => (
                      <li key={item.id} className="flex items-start gap-3">
                        <span className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{item.label}</div>
                          <div className="text-xs text-gray-500 dark:text-slate-500">{new Date(item.at).toLocaleString()}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )
            ) : null}

            {tab === "aar" ? (
              aarTasks.length === 0 ? (
                <EmptyState
                  title="No after-action records yet."
                  description="Completed tasks and uploaded proofs will appear here."
                  className="min-h-[180px]"
                />
              ) : (
                <div className="space-y-3">
                  {aarTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0E1626]"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-bold text-gray-900 dark:text-slate-100">
                          {task.volunteer?.name || "Volunteer"}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-slate-500">
                          {task.completedAt ? formatDateTime(task.completedAt) : "No completion time"}
                        </div>
                      </div>

                      {task.proofs && task.proofs.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {task.proofs.map((proof, idx) => (
                            <button
                              key={`${task.id}-proof-${idx}`}
                              type="button"
                              onClick={() => {
                                setPreviewError(null);
                                setPreviewObjectUrl((prev) => {
                                  if (prev) URL.revokeObjectURL(prev);
                                  return null;
                                });
                                setPreviewTarget({
                                  taskId: task.id,
                                  taskLabel: task.volunteer?.name || "Volunteer",
                                  proof,
                                });
                              }}
                              className="w-full rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 px-3 py-2 text-left dark:border-[#22365D] dark:bg-[#0B1220] dark:hover:bg-[#122036]"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                  <div className="text-xs font-semibold text-gray-900 truncate dark:text-slate-100">
                                    {proof.fileName || proof.mimeType || `Proof ${idx + 1}`}
                                  </div>
                                  <div className="text-[11px] text-gray-500 dark:text-slate-500">
                                    Uploaded: {formatDateTime(proof.uploadedAt)}
                                  </div>
                                </div>
                                <ExternalLink size={14} className="text-gray-500 dark:text-slate-400" />
                              </div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-xs text-gray-500 dark:text-slate-500">No proofs uploaded.</div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : null}

            {tab === "blockchain" ? (
              chainTasks.length === 0 ? (
                <EmptyState title="No on-chain record yet." className="min-h-[180px]" />
              ) : (
                <div className="space-y-3">
                  {chainTasks.map((task) => {
                    const record = task.chainRecord;
                    if (!record) return null;
                    const txHash = String(record.txHash || "");
                    const recordHash = String(record.recordHash || "");
                    return (
                      <div
                        key={`${task.id}-chain`}
                        className="rounded-xl border border-gray-200 bg-white p-4 dark:border-[#162544] dark:bg-[#0E1626]"
                      >
                        <div className="text-sm font-bold text-gray-900 dark:text-slate-100">
                          {task.volunteer?.name || "Volunteer"}
                        </div>
                        <div className="mt-2 space-y-2 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-500 dark:text-slate-500">Network</span>
                            <span className="font-semibold text-gray-900 dark:text-slate-200">{record.network || "-"}</span>
                          </div>

                          <div className="space-y-1">
                            <div className="text-gray-500 dark:text-slate-500">Tx Hash</div>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 truncate rounded bg-gray-100 px-2 py-1 text-[11px] text-gray-800 dark:bg-[#0B1220] dark:text-slate-300">
                                {txHash || "-"}
                              </code>
                              <button
                                type="button"
                                onClick={() => void copyText(txHash)}
                                className="h-7 w-7 rounded-md border border-gray-200 hover:bg-gray-50 grid place-items-center dark:border-[#22365D] dark:hover:bg-[#122036]"
                                aria-label="Copy tx hash"
                                title="Copy tx hash"
                              >
                                <Copy size={13} />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="text-gray-500 dark:text-slate-500">Record Hash</div>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 truncate rounded bg-gray-100 px-2 py-1 text-[11px] text-gray-800 dark:bg-[#0B1220] dark:text-slate-300">
                                {recordHash || "-"}
                              </code>
                              <button
                                type="button"
                                onClick={() => void copyText(recordHash)}
                                className="h-7 w-7 rounded-md border border-gray-200 hover:bg-gray-50 grid place-items-center dark:border-[#22365D] dark:hover:bg-[#122036]"
                                aria-label="Copy record hash"
                                title="Copy record hash"
                              >
                                <Copy size={13} />
                              </button>
                            </div>
                          </div>

                          {txHash ? (
                            <a
                              href={`https://sepolia.etherscan.io/tx/${txHash}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200"
                            >
                              Open in Etherscan
                              <ExternalLink size={13} />
                            </a>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : null}
          </div>
        </div>
      </aside>

      {previewTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={closeProofPreview} />
          <div className="relative w-full max-w-3xl rounded-xl border border-gray-200 bg-white shadow-xl dark:border-[#162544] dark:bg-[#0B1220]">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between dark:border-[#162544]">
              <div>
                <div className="text-sm font-bold text-gray-900 dark:text-slate-100">Proof Preview</div>
                <div className="text-xs text-gray-500 dark:text-slate-500">
                  {previewTarget.taskLabel} | {previewTarget.proof.fileName || previewTarget.proof.mimeType || "Attachment"}
                </div>
              </div>
              <button
                type="button"
                onClick={closeProofPreview}
                className="h-8 w-8 rounded-md hover:bg-gray-100 grid place-items-center text-gray-700 dark:text-slate-300 dark:hover:bg-[#122036]"
                aria-label="Close proof preview"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4">
              {previewLoading ? (
                <div className="h-[280px] rounded-lg border border-gray-200 bg-gray-50 grid place-items-center text-sm text-gray-600 dark:border-[#162544] dark:bg-[#0E1626] dark:text-slate-300">
                  Loading proof...
                </div>
              ) : null}

              {previewError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                  {previewError}
                </div>
              ) : null}

              {!previewLoading && !previewError && previewObjectUrl && previewIsImage ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-2 dark:border-[#162544] dark:bg-[#0E1626]">
                  <img src={previewObjectUrl} alt="Proof attachment" className="max-h-[60vh] w-full object-contain rounded-md" />
                </div>
              ) : null}

              {!previewLoading && !previewError && previewObjectUrl && !previewIsImage ? (
                <div className="h-[220px] rounded-lg border border-gray-200 bg-gray-50 grid place-items-center dark:border-[#162544] dark:bg-[#0E1626]">
                  <div className="text-center">
                    <div className="text-sm text-gray-700 dark:text-slate-300">
                      Preview unavailable for this file type.
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2 dark:border-[#162544]">
              <button
                type="button"
                onClick={downloadProof}
                disabled={!previewObjectUrl}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                <Download size={14} />
                Download
              </button>
              <button
                type="button"
                onClick={closeProofPreview}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-800 hover:bg-gray-50 dark:border-[#22365D] dark:bg-[#0B1220] dark:text-slate-200 dark:hover:bg-[#122036]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}



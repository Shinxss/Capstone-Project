import { useEffect, useMemo, useRef, useState } from "react";
import { Clock3, Image as ImageIcon, ImageOff, X } from "lucide-react";

import { fetchTaskProofBlob } from "@/features/tasks/services/tasksApi";
import type { EmergencyReport } from "../../emergency/models/emergency.types";
import { emergencyTitleForType } from "../../emergency/constants/emergency.constants";
import type { DispatchTask } from "../../tasks/models/tasks.types";
import type { LguEmergencyDetails, Volunteer } from "../models/lguLiveMap.types";

type DetailsTab = "overview" | "dispatch" | "timeline";

type Props = {
  open: boolean;
  onClose: () => void;
  emergencyDetails: LguEmergencyDetails | null;
  emergencyReport: EmergencyReport | undefined;
  tasks: DispatchTask[];
  tasksLoading: boolean;
  tasksError: string | null;
  onOpenDispatch: () => void;
  assignedRespondersFallback: Volunteer[];
};

type TimelineEvent = {
  id: string;
  at: number;
  label: string;
};

type ResolvedPhoto = {
  key: string;
  src: string;
};

const TAB_OPTIONS: Array<{ id: DetailsTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "dispatch", label: "Dispatch" },
  { id: "timeline", label: "Timeline" },
];

function toTimestamp(value?: string | null) {
  if (!value) return null;
  const ts = new Date(value).getTime();
  return Number.isFinite(ts) ? ts : null;
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString();
}

function formatTimeOnly(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function severityLabel(emergencyType?: string) {
  const up = String(emergencyType ?? "").toUpperCase();
  if (up === "SOS" || up === "FIRE" || up === "FLOOD") return "High";
  return "Medium";
}

function isSosEmergencyType(emergencyType?: string | null, source?: string | null) {
  const normalizedType = String(emergencyType ?? "").trim().toUpperCase();
  const normalizedSource = String(source ?? "").trim().toUpperCase();
  return normalizedType === "SOS" || normalizedSource === "SOS";
}

function taskStatusClass(statusRaw?: string) {
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

export default function LguEmergencyDetailsPanel({
  open,
  onClose,
  emergencyDetails,
  emergencyReport,
  tasks,
  tasksLoading,
  tasksError,
  onOpenDispatch,
  assignedRespondersFallback,
}: Props) {
  const [tab, setTab] = useState<DetailsTab>("overview");
  const [photosLoading, setPhotosLoading] = useState(false);
  const [photoThumbs, setPhotoThumbs] = useState<ResolvedPhoto[]>([]);
  const [photosModalOpen, setPhotosModalOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    setTab("overview");
  }, [open, emergencyDetails?.id]);

  useEffect(() => {
    if (!open) {
      setPhotosModalOpen(false);
      setActivePhotoIndex(0);
    }
  }, [open]);

  const photoUrls = useMemo(() => {
    const raw = emergencyReport?.photos;
    if (!Array.isArray(raw)) return [] as string[];
    return raw
      .map((value) => String(value ?? "").trim())
      .filter(Boolean)
      .slice(0, 5);
  }, [emergencyReport?.photos]);

  const revokeObjectUrls = () => {
    objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrlsRef.current = [];
  };

  useEffect(() => {
    return () => {
      revokeObjectUrls();
    };
  }, []);

  useEffect(() => {
    revokeObjectUrls();
    setPhotoThumbs([]);

    if (!open || photoUrls.length === 0) {
      setPhotosLoading(false);
      return;
    }

    let cancelled = false;
    setPhotosLoading(true);

    void Promise.allSettled(
      photoUrls.map(async (url) => {
        const blob = await fetchTaskProofBlob(url);
        return { key: url, src: URL.createObjectURL(blob) };
      })
    )
      .then((results) => {
        const nextThumbs: ResolvedPhoto[] = [];

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            nextThumbs.push(result.value);
          }
        });

        if (cancelled) {
          nextThumbs.forEach((entry) => URL.revokeObjectURL(entry.src));
          return;
        }

        objectUrlsRef.current = nextThumbs.map((entry) => entry.src);
        setPhotoThumbs(nextThumbs);
        setActivePhotoIndex(0);
      })
      .finally(() => {
        if (cancelled) return;
        setPhotosLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, photoUrls]);

  const reporterName = useMemo(() => {
    const reportedBy = emergencyReport?.reportedBy;
    if (reportedBy && typeof reportedBy === "object") {
      const name = `${reportedBy.firstName ?? ""} ${reportedBy.lastName ?? ""}`.trim();
      return name || reportedBy.username || reportedBy.email || "Unknown";
    }

    if (emergencyReport?.reporterIsGuest) return "Guest Reporter";
    return "Unknown";
  }, [emergencyReport?.reportedBy, emergencyReport?.reporterIsGuest]);

  const reporterContact = useMemo(() => {
    const reportedBy = emergencyReport?.reportedBy;
    if (reportedBy && typeof reportedBy === "object") {
      return reportedBy.contactNo || reportedBy.email || "-";
    }
    return "-";
  }, [emergencyReport?.reportedBy]);

  const reporterAddress = useMemo(() => {
    const reportedBy = emergencyReport?.reportedBy;
    if (reportedBy && typeof reportedBy === "object") {
      const bits = [reportedBy.barangay, reportedBy.municipality, reportedBy.country, reportedBy.postalCode].filter(
        Boolean
      );
      if (bits.length > 0) return bits.join(", ");
    }

    return "-";
  }, [emergencyReport?.reportedBy]);

  const emergencyLocation = useMemo(() => {
    if (emergencyReport?.locationLabel) return emergencyReport.locationLabel;

    const bits = [
      emergencyReport?.barangayName,
      emergencyReport?.barangayCity,
      emergencyReport?.barangayProvince,
    ].filter(Boolean);
    if (bits.length > 0) return bits.join(", ");

    return emergencyDetails?.barangayName || "-";
  }, [
    emergencyDetails?.barangayName,
    emergencyReport?.barangayCity,
    emergencyReport?.barangayName,
    emergencyReport?.barangayProvince,
    emergencyReport?.locationLabel,
  ]);

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const at = toTimestamp(a.updatedAt) ?? toTimestamp(a.createdAt) ?? 0;
      const bt = toTimestamp(b.updatedAt) ?? toTimestamp(b.createdAt) ?? 0;
      return bt - at;
    });
  }, [tasks]);

  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];
    const reportTime =
      emergencyReport?.reportedAt || emergencyReport?.createdAt || emergencyDetails?.reportedAt || null;

    const reportTs = toTimestamp(reportTime);
    if (reportTs) {
      const label = reporterName && reporterName !== "Unknown" ? `Reported by ${reporterName}` : "Reported";
      events.push({ id: "reported", at: reportTs, label });
    }

    const statusText = emergencyReport?.status || emergencyDetails?.status;
    const statusTs = toTimestamp(emergencyReport?.updatedAt) ?? reportTs;
    if (statusText && statusTs) {
      events.push({ id: "status", at: statusTs, label: `Status: ${statusText}` });
    }

    const dispatchCreatedTs = sortedTasks
      .map((task) => toTimestamp(task.createdAt))
      .filter((value): value is number => Number.isFinite(value))
      .sort((a, b) => a - b)[0];
    if (dispatchCreatedTs) {
      events.push({ id: "team-dispatched", at: dispatchCreatedTs, label: "Team Dispatched" });
    }

    sortedTasks.forEach((task, index) => {
      const volunteer = task.volunteer?.name || "Volunteer";
      const status = String(task.status ?? "").toUpperCase();

      const respondedTs = toTimestamp(task.respondedAt);
      if (respondedTs) {
        events.push({
          id: `responded-${task.id}-${index}`,
          at: respondedTs,
          label: `${volunteer} responded (${status || "UNKNOWN"})`,
        });
      }

      const completedTs = toTimestamp(task.completedAt);
      if (completedTs) {
        events.push({
          id: `done-${task.id}-${index}`,
          at: completedTs,
          label: `${volunteer} marked Done`,
        });
      }

      const verifiedTs = toTimestamp(task.verifiedAt);
      if (verifiedTs) {
        events.push({
          id: `verified-${task.id}-${index}`,
          at: verifiedTs,
          label: `LGU verified ${volunteer}`,
        });
      }
    });

    return events.sort((a, b) => a.at - b.at);
  }, [
    emergencyDetails?.reportedAt,
    emergencyDetails?.status,
    emergencyReport?.createdAt,
    emergencyReport?.reportedAt,
    emergencyReport?.status,
    emergencyReport?.updatedAt,
    reporterName,
    sortedTasks,
  ]);

  if (!open || !emergencyDetails) return null;

  const severity = severityLabel(emergencyDetails.emergencyType);
  const title = emergencyTitleForType(emergencyDetails.emergencyType);
  const reportId = emergencyReport?.referenceNumber || emergencyDetails.id;
  const reportedTime = emergencyReport?.reportedAt || emergencyReport?.createdAt || emergencyDetails.reportedAt;
  const coverPhoto = photoThumbs[0];
  const activePhoto = photoThumbs[activePhotoIndex] ?? coverPhoto ?? null;
  const isSosEmergency = isSosEmergencyType(
    emergencyReport?.emergencyType ?? emergencyDetails.emergencyType,
    emergencyReport?.source ?? emergencyDetails.source
  );

  return (
    <>
      <div className="h-full overflow-y-auto bg-white dark:bg-[#0B1220]">
        <section className="relative">
          {coverPhoto ? (
            <img src={coverPhoto.src} alt="Emergency proof" className="h-64 w-full object-cover" />
          ) : (
            <div className="h-64 w-full bg-gradient-to-b from-slate-300 to-slate-200 dark:from-[#1A2740] dark:to-[#0E1626] flex items-center justify-center">
              {!photosLoading ? (
                isSosEmergency ? (
                  <div className="flex flex-col items-center gap-2 px-4 text-center">
                    <div className="grid h-20 w-20 place-items-center rounded-xl bg-red-600 shadow-md shadow-red-500/25">
                      <span className="text-2xl font-black tracking-wide text-white">SOS</span>
                    </div>
                    <div className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-slate-100">
                      No image available
                    </div>
                    <span className="inline-flex items-center rounded-full bg-red-600 px-5 py-1.5 text-sm font-black uppercase tracking-wide text-white shadow-sm shadow-red-500/25">
                      Urgent SOS report
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-600 dark:text-slate-300">
                    <ImageOff size={36} />
                    <span className="text-xs font-semibold uppercase tracking-wide">No image</span>
                  </div>
                )
              ) : null}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/35 text-white backdrop-blur hover:bg-black/55"
            aria-label="Close details"
            title="Close"
          >
            <X size={16} />
          </button>

          {photosLoading ? (
            <div className="absolute bottom-3 left-3 rounded-lg bg-black/55 px-3 py-2 text-xs text-white">
              Loading images...
            </div>
          ) : null}

          {!photosLoading && coverPhoto ? (
            <button
              type="button"
              onClick={() => setPhotosModalOpen(true)}
              className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg border border-white/35 bg-black/40 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-black/55"
            >
              <ImageIcon size={14} />
              See photos
            </button>
          ) : null}

        </section>

        <div className="relative bg-white px-5 pb-5 pt-4 dark:bg-[#0B1220]">
          <section className="space-y-3">
            <div className="text-[2rem] font-semibold leading-tight text-gray-900 dark:text-slate-100">{title}</div>

            <div className="flex items-center gap-2">
              <span
                className={[
                  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold",
                  severity === "High"
                    ? "border-red-200 bg-red-100 text-red-700 dark:border-red-400/30 dark:bg-red-500/20 dark:text-red-300"
                    : "border-gray-200 bg-gray-100 text-gray-700 dark:border-white/15 dark:bg-white/10 dark:text-white",
                ].join(" ")}
              >
                Severity: {severity}
              </span>
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-700 dark:border-white/15 dark:bg-white/10 dark:text-white">
                {emergencyDetails.status || "UNKNOWN"}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400">
              <span>
                ID: <span className="font-semibold text-gray-900 dark:text-slate-200">{reportId}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock3 size={12} />
                {formatDateTime(reportedTime)}
              </span>
            </div>
          </section>

          <div className="mt-4 border-b border-gray-200 dark:border-[#162544]">
            <div className="flex items-center justify-around">
              {TAB_OPTIONS.map((option) => {
                const active = tab === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTab(option.id)}
                    className={[
                      "border-b-[3px] px-1 pb-3 pt-2 text-base transition-colors",
                      active
                        ? "border-cyan-600 text-cyan-700 dark:border-cyan-400 dark:text-cyan-300"
                        : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200",
                    ].join(" ")}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {tab === "overview" ? (
            <div className="space-y-4 pt-4">
              <button
                type="button"
                onClick={onOpenDispatch}
                className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-500"
              >
                Dispatch Responders
              </button>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#22365D] dark:bg-[#0E1626]">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-500">Location</div>
                <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">{emergencyLocation}</div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-[#22365D] dark:bg-[#0E1626]">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-500">Reporter</div>
                <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-slate-100">{reporterName}</div>
                <div className="mt-2 text-xs text-gray-500 dark:text-slate-500">Contact</div>
                <div className="text-sm text-gray-800 dark:text-slate-300">{reporterContact}</div>
                <div className="mt-2 text-xs text-gray-500 dark:text-slate-500">Address</div>
                <div className="text-sm text-gray-800 dark:text-slate-300">{reporterAddress}</div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-[#22365D] dark:bg-[#0E1626]">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-500">Assigned Volunteers</div>

                {tasksLoading ? (
                  <div className="mt-3 text-sm text-gray-600 dark:text-slate-300">Loading assigned volunteers...</div>
                ) : null}

                {tasksError ? (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                    {tasksError}
                  </div>
                ) : null}

                {!tasksLoading && sortedTasks.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {sortedTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-[#22365D] dark:bg-[#0B1220]">
                        <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{task.volunteer?.name || "Volunteer"}</div>
                        <span className={["inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold", taskStatusClass(task.status)].join(" ")}>
                          {String(task.status || "UNKNOWN").toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {!tasksLoading && sortedTasks.length === 0 ? (
                  assignedRespondersFallback.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {assignedRespondersFallback.map((volunteer) => (
                        <div key={volunteer.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-[#22365D] dark:bg-[#0B1220]">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{volunteer.name}</div>
                            <div className="text-xs text-gray-500 dark:text-slate-500">{volunteer.skill}</div>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
                            ASSIGNED
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-gray-600 dark:text-slate-300">No volunteers assigned yet.</div>
                  )
                ) : null}
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-[#22365D] dark:bg-[#0E1626]">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-500">Report History</div>

                {timelineEvents.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {timelineEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-[#22365D] dark:bg-[#0B1220]">
                        <div className="w-20 shrink-0 text-xs font-semibold text-gray-600 dark:text-slate-400">
                          {formatTimeOnly(event.at)}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-slate-200">{event.label}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-600 dark:text-slate-300">No timeline events yet.</div>
                )}
              </div>
            </div>
          ) : null}

          {tab === "dispatch" ? (
            <div className="space-y-3 pt-4 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
              <button
                type="button"
                onClick={onOpenDispatch}
                className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-red-500"
              >
                Dispatch Responders
              </button>

              <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-[#22365D] dark:bg-[#0E1626]">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-500">Assigned Volunteers</div>

                {tasksLoading ? (
                  <div className="mt-3 text-sm text-gray-600 dark:text-slate-300">Loading assigned volunteers...</div>
                ) : null}

                {tasksError ? (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
                    {tasksError}
                  </div>
                ) : null}

                {!tasksLoading && sortedTasks.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {sortedTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-[#22365D] dark:bg-[#0B1220]">
                        <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{task.volunteer?.name || "Volunteer"}</div>
                        <span className={["inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold", taskStatusClass(task.status)].join(" ")}>
                          {String(task.status || "UNKNOWN").toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}

                {!tasksLoading && sortedTasks.length === 0 ? (
                  assignedRespondersFallback.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {assignedRespondersFallback.map((volunteer) => (
                        <div key={volunteer.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-[#22365D] dark:bg-[#0B1220]">
                          <div>
                            <div className="text-sm font-semibold text-gray-900 dark:text-slate-100">{volunteer.name}</div>
                            <div className="text-xs text-gray-500 dark:text-slate-500">{volunteer.skill}</div>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-500/20 dark:text-slate-300">
                            ASSIGNED
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-gray-600 dark:text-slate-300">No volunteers assigned yet.</div>
                  )
                ) : null}
              </div>
            </div>
          ) : null}

          {tab === "timeline" ? (
            <div className="pt-4 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
              <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-[#22365D] dark:bg-[#0E1626]">
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-500">Report History</div>

                {timelineEvents.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {timelineEvents.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 dark:border-[#22365D] dark:bg-[#0B1220]">
                        <div className="w-20 shrink-0 text-xs font-semibold text-gray-600 dark:text-slate-400">
                          {formatTimeOnly(event.at)}
                        </div>
                        <div className="text-sm text-gray-900 dark:text-slate-200">{event.label}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-3 text-sm text-gray-600 dark:text-slate-300">No timeline events yet.</div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {photosModalOpen && photoThumbs.length > 0 ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/65" onClick={() => setPhotosModalOpen(false)} />
          <div className="relative w-full max-w-3xl rounded-xl border border-gray-200 bg-white dark:border-[#162544] dark:bg-[#0B1220]">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between dark:border-[#162544]">
              <div className="text-sm font-bold text-gray-900 dark:text-slate-100">Photos ({photoThumbs.length})</div>
              <button
                type="button"
                onClick={() => setPhotosModalOpen(false)}
                className="h-8 w-8 rounded-md hover:bg-gray-100 grid place-items-center text-gray-700 dark:text-slate-300 dark:hover:bg-[#122036]"
                aria-label="Close photos"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {activePhoto ? (
                <img
                  src={activePhoto.src}
                  alt="Emergency photo"
                  className="h-[56vh] w-full rounded-lg border border-gray-200 object-contain bg-black/80 dark:border-[#22365D]"
                />
              ) : null}

              <div className="flex gap-2 overflow-x-auto pb-1">
                {photoThumbs.map((photo, index) => (
                  <button
                    key={photo.key}
                    type="button"
                    onClick={() => setActivePhotoIndex(index)}
                    className={[
                      "shrink-0 rounded-md border-2 overflow-hidden",
                      index === activePhotoIndex ? "border-blue-500" : "border-transparent",
                    ].join(" ")}
                  >
                    <img src={photo.src} alt={`Photo ${index + 1}`} className="h-16 w-16 object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

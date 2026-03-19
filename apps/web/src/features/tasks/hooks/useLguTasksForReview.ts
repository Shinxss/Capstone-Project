import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../../../lib/api";
import { appendActivityLog } from "../../activityLog/services/activityLog.service";
import { fetchEmergencyReports } from "../../emergency/services/emergency.service";
import { fetchDispatchVolunteers } from "../../lguLiveMap/services/volunteers.service";
import { toastSuccess } from "../../../services/feedback/toast.service";
import type { DispatchTask, TaskProof } from "../models/tasks.types";
import { fetchTaskProofBlob, verifyTask } from "../services/tasksApi";
import { useLguTasks } from "./useLguTasks";

export type ForReviewSort = "NEWEST" | "OLDEST";
export type ChecklistStatus = "pass" | "fail" | "unknown";

type ForReviewReporterInfo = {
  fullName: string | null;
  lifelineId: string | null;
  avatarUrl: string | null;
  contactNo: string | null;
  address: string | null;
};

export type ForReviewQueueItem = {
  task: DispatchTask;
  taskId: string;
  emergencyId: string;
  emergencyReference: string | null;
  volunteerName: string;
  volunteerAvatarUrl: string | null;
  volunteerLifelineId: string | null;
  emergencyType: string;
  barangay: string;
  proofCount: number;
  hasProof: boolean;
  missingProof: boolean;
  hasMissingData: boolean;
  submittedAt: string | null;
  submittedAtEpoch: number;
  submittedAtLabel: string;
  reporterName: string | null;
  reporterLifelineId: string | null;
  reporterAvatarUrl: string | null;
  reporterContactNo: string | null;
  reporterAddress: string | null;
};

export type ForReviewChecklistItem = {
  id: string;
  label: string;
  status: ChecklistStatus;
  detail: string;
};

const ALL_FILTER = "ALL";

function toErrorMessage(error: unknown, fallback: string) {
  const parsed = error as {
    message?: string;
    response?: { data?: { message?: string } };
  };
  return parsed?.response?.data?.message || parsed?.message || fallback;
}

function toDisplayText(value: string | null | undefined, fallback = "-") {
  const trimmed = String(value ?? "").trim();
  return trimmed || fallback;
}

function normalize(value: string | null | undefined) {
  return toDisplayText(value, "").toLowerCase();
}

function toOptionalText(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function buildReporterInfo(reportedBy: unknown): ForReviewReporterInfo {
  if (!reportedBy || typeof reportedBy !== "object") {
    return { fullName: null, lifelineId: null, avatarUrl: null, contactNo: null, address: null };
  }

  const reporter = reportedBy as {
    firstName?: string;
    lastName?: string;
    username?: string;
    lifelineId?: string;
    avatarUrl?: string;
    contactNo?: string;
    barangay?: string;
    municipality?: string;
    country?: string;
    postalCode?: string;
  };

  const firstName = toOptionalText(reporter.firstName);
  const lastName = toOptionalText(reporter.lastName);
  const username = toOptionalText(reporter.username);
  const fullName = [firstName, lastName].filter((part): part is string => Boolean(part)).join(" ").trim() || username;

  const addressParts = [reporter.barangay, reporter.municipality, reporter.country, reporter.postalCode]
    .map((part) => toOptionalText(part))
    .filter((part): part is string => Boolean(part));

  return {
    fullName: fullName || null,
    lifelineId: toOptionalText(reporter.lifelineId),
    avatarUrl: resolveAvatarUrl(reporter.avatarUrl) ?? null,
    contactNo: toOptionalText(reporter.contactNo),
    address: addressParts.length > 0 ? addressParts.join(", ") : null,
  };
}

function resolveAvatarUrl(value: string | null | undefined) {
  const avatar = String(value ?? "").trim();
  if (!avatar) return null;
  if (/^https?:\/\//i.test(avatar)) return avatar;

  const base = String(api.defaults.baseURL ?? "").trim();
  if (!base) return avatar;

  try {
    const baseUrl = new URL(base);
    const origin = `${baseUrl.protocol}//${baseUrl.host}`;
    return new URL(avatar, origin).toString();
  } catch {
    const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
    const normalizedPath = avatar.startsWith("/") ? avatar : `/${avatar}`;
    return `${normalizedBase}${normalizedPath}`;
  }
}

function resolveSubmittedAt(task: DispatchTask) {
  return task.completedAt || task.updatedAt || task.createdAt || null;
}

function toEpoch(iso: string | null | undefined) {
  if (!iso) return 0;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function toDateInputValue(iso: string | null | undefined) {
  if (!iso) return "";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "";
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "-";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString();
}

function hasCoordinates(task: DispatchTask) {
  const emergencyHasCoords = Number.isFinite(task.emergency?.lat) && Number.isFinite(task.emergency?.lng);
  const lastKnownHasCoords = Number.isFinite(task.lastKnownLocation?.lat) && Number.isFinite(task.lastKnownLocation?.lng);
  return emergencyHasCoords || lastKnownHasCoords;
}

function proofName(proof: TaskProof | null) {
  if (!proof) return "proof";
  const fileName = toDisplayText(proof.fileName, "");
  return fileName || "proof";
}

function toChecklistStatus(value: boolean | undefined): ChecklistStatus {
  if (value === true) return "pass";
  if (value === false) return "fail";
  return "unknown";
}

export function useLguTasksForReview() {
  const { tasks, loading, error, refetch } = useLguTasks("DONE");

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [emergencyType, setEmergencyType] = useState(ALL_FILTER);
  const [barangay, setBarangay] = useState(ALL_FILTER);
  const [date, setDate] = useState("");
  const [sort, setSort] = useState<ForReviewSort>("NEWEST");
  const [missingProofOnly, setMissingProofOnly] = useState(false);

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [activeProofIndex, setActiveProofIndex] = useState(0);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofPreviewUrls, setProofPreviewUrls] = useState<Record<string, string>>({});
  const [proofFileName, setProofFileName] = useState("proof");
  const proofPreviewUrlsRef = useRef<Record<string, string>>({});
  const [volunteerAvatarById, setVolunteerAvatarById] = useState<Record<string, string>>({});
  const [volunteerLifelineById, setVolunteerLifelineById] = useState<Record<string, string>>({});
  const [emergencyReferenceById, setEmergencyReferenceById] = useState<Record<string, string>>({});
  const [reporterByEmergencyId, setReporterByEmergencyId] = useState<Record<string, ForReviewReporterInfo>>({});

  const [reviewerNotesByTaskId, setReviewerNotesByTaskId] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const volunteers = await fetchDispatchVolunteers();
        if (cancelled) return;

        const nextAvatar: Record<string, string> = {};
        const nextLifelineId: Record<string, string> = {};
        for (const volunteer of volunteers) {
          const id = String(volunteer.id ?? "").trim();
          const avatar = String(volunteer.avatarUrl ?? "").trim();
          const lifelineId = String(volunteer.lifelineId ?? "").trim();
          if (!id) continue;
          if (avatar) {
            nextAvatar[id] = avatar;
          }
          if (lifelineId) {
            nextLifelineId[id] = lifelineId;
          }
        }
        setVolunteerAvatarById(nextAvatar);
        setVolunteerLifelineById(nextLifelineId);
      } catch {
        // optional enhancement only; keep initials fallback when this fetch fails
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const reports = await fetchEmergencyReports(500);
        if (cancelled) return;

        const next: Record<string, string> = {};
        const nextReporter: Record<string, ForReviewReporterInfo> = {};
        for (const report of reports ?? []) {
          const emergencyId = String(report?._id ?? "").trim();
          const referenceNumber = String(report?.referenceNumber ?? "").trim();
          if (!emergencyId) continue;
          if (referenceNumber) {
            next[emergencyId] = referenceNumber;
          }
          nextReporter[emergencyId] = buildReporterInfo(report?.reportedBy);
        }
        setEmergencyReferenceById(next);
        setReporterByEmergencyId(nextReporter);
      } catch {
        // optional enhancement only; keep fallback text when this fetch fails
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo<ForReviewQueueItem[]>(() => {
    return tasks.map((task) => {
      const submittedAt = resolveSubmittedAt(task);
      const volunteerId = String(task.volunteer?.id ?? "").trim();
      const emergencyId = String(task.emergency?.id ?? "").trim();
      const volunteerName = toDisplayText(task.volunteer?.name, "Unassigned volunteer");
      const inlineAvatar = resolveAvatarUrl(task.volunteer?.avatarUrl);
      const inlineLifelineId = String(task.volunteer?.lifelineId ?? "").trim();
      const inlineReference = String(task.emergency?.referenceNumber ?? "").trim();
      const emergencyTypeLabel = toDisplayText(task.emergency?.emergencyType, "Unknown emergency");
      const barangayName = toDisplayText(task.emergency?.barangayName, "Barangay unavailable");
      const proofs = task.proofs ?? [];
      const hasMissingData = !task.volunteer?.name || !task.emergency?.barangayName || !submittedAt;
      const reporter = emergencyId ? reporterByEmergencyId[emergencyId] : null;

      return {
        task,
        taskId: String(task.id),
        emergencyId,
        emergencyReference: inlineReference || (emergencyId ? emergencyReferenceById[emergencyId] ?? null : null),
        volunteerName,
        volunteerAvatarUrl: inlineAvatar || (volunteerId ? volunteerAvatarById[volunteerId] ?? null : null),
        volunteerLifelineId: inlineLifelineId || (volunteerId ? volunteerLifelineById[volunteerId] ?? null : null),
        emergencyType: emergencyTypeLabel,
        barangay: barangayName,
        proofCount: proofs.length,
        hasProof: proofs.length > 0,
        missingProof: proofs.length === 0,
        hasMissingData,
        submittedAt,
        submittedAtEpoch: toEpoch(submittedAt),
        submittedAtLabel: formatDateTime(submittedAt),
        reporterName: reporter?.fullName ?? null,
        reporterLifelineId: reporter?.lifelineId ?? null,
        reporterAvatarUrl: reporter?.avatarUrl ?? null,
        reporterContactNo: reporter?.contactNo ?? null,
        reporterAddress: reporter?.address ?? null,
      };
    });
  }, [tasks, volunteerAvatarById, volunteerLifelineById, emergencyReferenceById, reporterByEmergencyId]);

  const emergencyTypeOptions = useMemo(() => {
    const values = new Set<string>();
    for (const row of rows) values.add(row.emergencyType);
    return [ALL_FILTER, ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const barangayOptions = useMemo(() => {
    const values = new Set<string>();
    for (const row of rows) values.add(row.barangay);
    return [ALL_FILTER, ...Array.from(values).sort((a, b) => a.localeCompare(b))];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = normalize(search);
    const next = rows.filter((row) => {
      if (emergencyType !== ALL_FILTER && normalize(row.emergencyType) !== normalize(emergencyType)) return false;
      if (barangay !== ALL_FILTER && !normalize(row.barangay).includes(normalize(barangay))) return false;
      if (missingProofOnly && row.hasProof) return false;
      if (date && toDateInputValue(row.submittedAt) !== date) return false;

      if (!query) return true;
      const haystack = `${row.volunteerName} ${row.emergencyType} ${row.barangay} ${row.taskId}`.toLowerCase();
      return haystack.includes(query);
    });

    next.sort((a, b) => {
      const aHasDate = a.submittedAtEpoch > 0;
      const bHasDate = b.submittedAtEpoch > 0;
      if (aHasDate !== bHasDate) return aHasDate ? -1 : 1;

      if (a.submittedAtEpoch === b.submittedAtEpoch) return a.taskId.localeCompare(b.taskId);
      return sort === "NEWEST" ? b.submittedAtEpoch - a.submittedAtEpoch : a.submittedAtEpoch - b.submittedAtEpoch;
    });

    return next;
  }, [rows, emergencyType, barangay, missingProofOnly, date, search, sort]);

  useEffect(() => {
    if (filteredRows.length === 0) {
      if (selectedTaskId !== null) {
        setSelectedTaskId(null);
      }
      return;
    }

    const hasSelection = filteredRows.some((row) => row.taskId === selectedTaskId);
    if (!selectedTaskId || !hasSelection) {
      setSelectedTaskId(filteredRows[0].taskId);
    }
  }, [filteredRows, selectedTaskId]);

  const selectedQueueItem = useMemo(
    () => filteredRows.find((row) => row.taskId === selectedTaskId) ?? null,
    [filteredRows, selectedTaskId]
  );
  const selectedTask = selectedQueueItem?.task ?? null;
  const selectedProofs = selectedTask?.proofs ?? [];
  const activeProof = selectedProofs[activeProofIndex] ?? null;

  useEffect(() => {
    setActiveProofIndex(0);
  }, [selectedTaskId]);

  useEffect(() => {
    if (selectedProofs.length === 0 && activeProofIndex !== 0) {
      setActiveProofIndex(0);
      return;
    }
    if (selectedProofs.length > 0 && activeProofIndex >= selectedProofs.length) {
      setActiveProofIndex(0);
    }
  }, [selectedProofs.length, activeProofIndex]);

  const clearProofPreviewUrls = useCallback(() => {
    const current = proofPreviewUrlsRef.current;
    for (const objectUrl of Object.values(current)) {
      URL.revokeObjectURL(objectUrl);
    }
    proofPreviewUrlsRef.current = {};
    setProofPreviewUrls({});
  }, []);

  useEffect(() => {
    clearProofPreviewUrls();
    setProofError(null);
    setProofLoading(false);
  }, [selectedTaskId, clearProofPreviewUrls]);

  useEffect(() => {
    let cancelled = false;
    const currentActiveProofUrl = activeProof?.url;

    if (!currentActiveProofUrl) {
      setProofLoading(false);
      setProofError(null);
      return () => {
        cancelled = true;
      };
    }

    setProofFileName(proofName(activeProof));
    setProofError(null);

    if (proofPreviewUrlsRef.current[currentActiveProofUrl]) {
      setProofLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setProofLoading(true);

    void (async () => {
      try {
        const blob = await fetchTaskProofBlob(currentActiveProofUrl);
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        proofPreviewUrlsRef.current = {
          ...proofPreviewUrlsRef.current,
          [currentActiveProofUrl]: objectUrl,
        };
        setProofPreviewUrls((prev) => ({
          ...prev,
          [currentActiveProofUrl]: objectUrl,
        }));
      } catch (fetchError) {
        if (cancelled) return;
        setProofError(toErrorMessage(fetchError, "Failed to load proof"));
      } finally {
        if (!cancelled) {
          setProofLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeProof?.url, activeProof?.fileName]);

  useEffect(() => {
    let cancelled = false;
    const prefetchTargets = selectedProofs
      .slice(0, 3)
      .map((proof) => String(proof.url || "").trim())
      .filter((url) => url && !proofPreviewUrlsRef.current[url]);

    if (prefetchTargets.length === 0) {
      return () => {
        cancelled = true;
      };
    }

    void (async () => {
      for (const proofUrl of prefetchTargets) {
        if (cancelled) return;
        try {
          const blob = await fetchTaskProofBlob(proofUrl);
          if (cancelled) return;

          const objectUrl = URL.createObjectURL(blob);
          proofPreviewUrlsRef.current = {
            ...proofPreviewUrlsRef.current,
            [proofUrl]: objectUrl,
          };
          setProofPreviewUrls((prev) => ({
            ...prev,
            [proofUrl]: objectUrl,
          }));
        } catch {
          // ignore prefetch failures; active proof loader handles explicit selections
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedTaskId, selectedProofs]);

  useEffect(() => {
    return () => {
      clearProofPreviewUrls();
    };
  }, [clearProofPreviewUrls]);

  const onSelectTask = useCallback((id: string) => {
    setSelectedTaskId(id);
  }, []);

  const onSelectProofIndex = useCallback((index: number) => {
    setActiveProofIndex(index);
  }, []);

  const setReviewerNotes = useCallback(
    (value: string) => {
      if (!selectedTaskId) return;
      setReviewerNotesByTaskId((prev) => ({
        ...prev,
        [selectedTaskId]: value,
      }));
    },
    [selectedTaskId]
  );

  const reviewerNotes = selectedTaskId ? reviewerNotesByTaskId[selectedTaskId] ?? "" : "";
  const proofObjectUrl = activeProof?.url ? proofPreviewUrls[activeProof.url] ?? null : null;

  const downloadProof = useCallback(() => {
    if (!proofObjectUrl) return;

    const anchor = document.createElement("a");
    anchor.href = proofObjectUrl;
    anchor.download = proofFileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }, [proofFileName, proofObjectUrl]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setEmergencyType(ALL_FILTER);
    setBarangay(ALL_FILTER);
    setDate("");
    setSort("NEWEST");
    setMissingProofOnly(false);
  }, []);

  const checklist = useMemo<ForReviewChecklistItem[]>(() => {
    if (!selectedTask) return [];

    const status = String(selectedTask.status ?? "").trim().toUpperCase();
    const hasVolunteer = Boolean(selectedTask.volunteer?.id || selectedTask.volunteer?.name);
    const hasCompletedAt = Boolean(selectedTask.completedAt);
    const hasLocation = Boolean(selectedTask.emergency?.barangayName) || hasCoordinates(selectedTask);
    const hasProof = (selectedTask.proofs?.length ?? 0) > 0;

    return [
      {
        id: "done",
        label: "Task marked as DONE",
        status: status ? (status === "DONE" ? "pass" : "fail") : "unknown",
        detail: status ? `Current status: ${status}` : "Task status is missing",
      },
      {
        id: "volunteer",
        label: "Volunteer assigned",
        status: toChecklistStatus(hasVolunteer),
        detail: hasVolunteer ? toDisplayText(selectedTask.volunteer?.name, "Volunteer assigned") : "No volunteer assigned",
      },
      {
        id: "completed",
        label: "Completed timestamp available",
        status: toChecklistStatus(hasCompletedAt),
        detail: hasCompletedAt ? formatDateTime(selectedTask.completedAt) : "Completion time missing",
      },
      {
        id: "location",
        label: "Location / barangay available",
        status: toChecklistStatus(hasLocation),
        detail: hasLocation
          ? toDisplayText(selectedTask.emergency?.barangayName, "Coordinates available")
          : "No barangay or coordinates available",
      },
      {
        id: "proof",
        label: "At least one proof uploaded",
        status: toChecklistStatus(hasProof),
        detail: hasProof ? `${selectedTask.proofs?.length ?? 0} proof file(s)` : "No proof uploaded",
      },
    ];
  }, [selectedTask]);

  const onVerify = useCallback(
    async (id: string) => {
      try {
        setVerifyError(null);
        setVerifyingId(id);
        await verifyTask(id);

        const task = tasks.find((row) => String(row.id) === String(id));
        appendActivityLog({
          action: "Verified completed dispatch task",
          entityType: "dispatch",
          entityId: id,
          metadata: {
            emergencyId: task?.emergency?.id,
            volunteerId: task?.volunteer?.id,
            volunteerName: task?.volunteer?.name,
            completedAt: task?.completedAt,
          },
        });

        toastSuccess("Task verified", `Dispatch ${id} has been verified.`);
        await refetch();
      } catch (verifyTaskError) {
        setVerifyError(toErrorMessage(verifyTaskError, "Failed to verify task"));
      } finally {
        setVerifyingId(null);
      }
    },
    [refetch, tasks]
  );

  const hasActiveFilters = useMemo(() => {
    return (
      search.trim().length > 0 ||
      emergencyType !== ALL_FILTER ||
      barangay !== ALL_FILTER ||
      date.length > 0 ||
      sort !== "NEWEST" ||
      missingProofOnly
    );
  }, [search, emergencyType, barangay, date, sort, missingProofOnly]);

  const activeFilterBadges = useMemo(() => {
    const badges: string[] = [];
    if (search.trim()) badges.push(`Search: ${search.trim()}`);
    if (emergencyType !== ALL_FILTER) badges.push(`Type: ${emergencyType}`);
    if (barangay !== ALL_FILTER) badges.push(`Barangay: ${barangay}`);
    if (date) badges.push(`Date: ${date}`);
    if (sort !== "NEWEST") badges.push(`Sort: ${sort === "OLDEST" ? "Oldest" : "Newest"}`);
    if (missingProofOnly) badges.push("Missing proof only");
    return badges;
  }, [search, emergencyType, barangay, date, sort, missingProofOnly]);

  return {
    loading,
    error,
    refetch,
    rows,
    filteredRows,
    selectedTaskId,
    selectedTask,
    selectedQueueItem,
    onSelectTask,
    search,
    setSearch,
    emergencyType,
    setEmergencyType,
    emergencyTypeOptions,
    barangay,
    setBarangay,
    barangayOptions,
    date,
    setDate,
    sort,
    setSort,
    missingProofOnly,
    setMissingProofOnly,
    clearFilters,
    hasActiveFilters,
    activeFilterBadges,
    verifyingId,
    verifyError,
    onVerify,
    checklist,
    reviewerNotes,
    setReviewerNotes,
    activeProofIndex,
    onSelectProofIndex,
    selectedProofs,
    activeProof,
    proofLoading,
    proofError,
    proofObjectUrl,
    proofPreviewUrls,
    downloadProof,
  };
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLguTasks } from "./useLguTasks";
import { fetchTaskProofBlob, verifyTask } from "../services/tasksApi";
import { appendActivityLog } from "../../activityLog/services/activityLog.service";

export function useLguTasksForReview() {
  const { tasks, loading, error, refetch } = useLguTasks("DONE");

  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [proofOpen, setProofOpen] = useState(false);
  const [proofLoading, setProofLoading] = useState(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofObjectUrl, setProofObjectUrl] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState("proof");

  const proofObjectUrlRef = useRef<string | null>(null);

  const rows = useMemo(() => tasks, [tasks]);

  const closeProof = useCallback(() => {
    setProofOpen(false);
    setProofError(null);
    setProofLoading(false);

    if (proofObjectUrlRef.current) {
      URL.revokeObjectURL(proofObjectUrlRef.current);
      proofObjectUrlRef.current = null;
    }
    setProofObjectUrl(null);
  }, []);

  useEffect(() => {
    return () => {
      if (proofObjectUrlRef.current) {
        URL.revokeObjectURL(proofObjectUrlRef.current);
      }
    };
  }, []);

  const openProof = useCallback(
    async (proofUrl: string, fileName?: string) => {
      try {
        setProofError(null);
        setProofLoading(true);
        setProofOpen(true);

        if (proofObjectUrlRef.current) {
          URL.revokeObjectURL(proofObjectUrlRef.current);
          proofObjectUrlRef.current = null;
        }
        setProofObjectUrl(null);

        setProofFileName(fileName || "proof");

        const blob = await fetchTaskProofBlob(proofUrl);
        const objectUrl = URL.createObjectURL(blob);
        proofObjectUrlRef.current = objectUrl;
        setProofObjectUrl(objectUrl);
      } catch (e: any) {
        setProofError(e?.message || "Failed to load proof");
      } finally {
        setProofLoading(false);
      }
    },
    []
  );

  const downloadProof = useCallback(() => {
    if (!proofObjectUrl) return;

    const a = document.createElement("a");
    a.href = proofObjectUrl;
    a.download = proofFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [proofObjectUrl, proofFileName]);

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
        await refetch();
      } catch (e: any) {
        setVerifyError(e?.response?.data?.message || e?.message || "Failed to verify task");
      } finally {
        setVerifyingId(null);
      }
    },
    [refetch, tasks]
  );

  return {
    loading,
    error,
    refetch,
    rows,
    verifyingId,
    verifyError,
    onVerify,
    proofOpen,
    proofLoading,
    proofError,
    proofObjectUrl,
    openProof,
    closeProof,
    downloadProof,
  };
}

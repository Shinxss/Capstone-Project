import { useEffect, useMemo, useState } from "react";
import { fetchApprovalEvidenceBlob } from "../services/approvalsApi";

export type ResolvedApprovalPhoto = {
  key: string;
  src: string;
};

type EvidenceState = {
  requestKey: string;
  photos: ResolvedApprovalPhoto[];
};

export function useApprovalEvidence(photoUrls: string[], limit?: number) {
  const sourceKey = JSON.stringify(photoUrls);
  const requestKey = useMemo(() => {
    const urls = (JSON.parse(sourceKey) as string[]).filter(Boolean);
    return JSON.stringify(typeof limit === "number" ? urls.slice(0, limit) : urls);
  }, [limit, sourceKey]);
  const [result, setResult] = useState<EvidenceState>({ requestKey: "[]", photos: [] });

  useEffect(() => {
    const requested = JSON.parse(requestKey) as string[];
    if (requested.length === 0) return;

    let cancelled = false;
    const objectUrls: string[] = [];
    void Promise.allSettled(
      requested.map(async (url) => {
        const blob = await fetchApprovalEvidenceBlob(url);
        const src = URL.createObjectURL(blob);
        objectUrls.push(src);
        return { key: url, src };
      })
    ).then((results) => {
      if (cancelled) return;
      setResult({
        requestKey,
        photos: results.flatMap((entry) => (entry.status === "fulfilled" ? [entry.value] : [])),
      });
    });

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [requestKey]);

  const empty = requestKey === "[]";
  const current = result.requestKey === requestKey;
  return {
    photos: empty || !current ? [] : result.photos,
    loading: !empty && !current,
  };
}

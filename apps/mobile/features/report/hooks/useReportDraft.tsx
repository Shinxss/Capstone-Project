import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { EmergencyType, ReportDraft, ReportLocation } from "../models/report.types";

type ReportDraftContextValue = {
  draft: ReportDraft;
  setType: (type: EmergencyType) => void;
  setLocation: (coords: ReportLocation["coords"], label?: string) => void;
  clearLocation: () => void;
  setDescription: (description: string) => void;
  reset: () => void;
};

const ReportDraftContext = createContext<ReportDraftContextValue | null>(null);

export function ReportDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<ReportDraft>({ photos: [] });

  const setType = useCallback((type: EmergencyType) => {
    setDraft((current) => ({ ...current, type }));
  }, []);

  const setLocation = useCallback((coords: ReportLocation["coords"], label?: string) => {
    setDraft((current) => ({
      ...current,
      location: {
        coords,
        ...(label?.trim() ? { label: label.trim() } : {}),
      },
    }));
  }, []);

  const clearLocation = useCallback(() => {
    setDraft((current) => {
      const { location: _ignored, ...rest } = current;
      return rest;
    });
  }, []);

  const setDescription = useCallback((description: string) => {
    setDraft((current) => ({ ...current, description }));
  }, []);

  const reset = useCallback(() => {
    setDraft({ photos: [] });
  }, []);

  const value = useMemo(
    () => ({ draft, setType, setLocation, clearLocation, setDescription, reset }),
    [clearLocation, draft, reset, setDescription, setLocation, setType]
  );

  return <ReportDraftContext.Provider value={value}>{children}</ReportDraftContext.Provider>;
}

export function useReportDraft() {
  const context = useContext(ReportDraftContext);
  if (!context) {
    throw new Error("useReportDraft must be used within ReportDraftProvider");
  }

  return context;
}

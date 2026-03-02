import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { EmergencyType, ReportDraft, ReportLocation, ReportPhoto } from "../models/report.types";

function toCoordsLabel(coords: ReportLocation["coords"]) {
  return `Lat: ${coords.latitude.toFixed(5)}, Lng: ${coords.longitude.toFixed(5)}`;
}

type ReportDraftContextValue = {
  draft: ReportDraft;
  setType: (type: EmergencyType) => void;
  setLocationText: (text: string) => void;
  setLocation: (coords: ReportLocation["coords"], label?: string) => void;
  clearLocation: () => void;
  setDescription: (description: string) => void;
  addPhotoLocal: (asset: ReportPhoto) => void;
  updatePhoto: (index: number, patch: Partial<ReportPhoto>) => void;
  removePhoto: (index: number) => void;
  reset: () => void;
};

const ReportDraftContext = createContext<ReportDraftContextValue | null>(null);

export function ReportDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<ReportDraft>({ photos: [] });

  const setType = useCallback((type: EmergencyType) => {
    setDraft((current) => ({ ...current, type }));
  }, []);

  const setLocationText = useCallback((locationText: string) => {
    setDraft((current) => ({ ...current, locationText }));
  }, []);

  const setLocation = useCallback((coords: ReportLocation["coords"], label?: string) => {
    setDraft((current) => ({
      ...current,
      location: {
        coords,
        label: label?.trim() || current.locationText?.trim() || toCoordsLabel(coords),
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

  const addPhotoLocal = useCallback((asset: ReportPhoto) => {
    setDraft((current) => ({ ...current, photos: [...(current.photos ?? []), asset] }));
  }, []);

  const updatePhoto = useCallback((index: number, patch: Partial<ReportPhoto>) => {
    setDraft((current) => {
      const photos = current.photos ?? [];
      if (index < 0 || index >= photos.length) {
        return current;
      }

      return {
        ...current,
        photos: photos.map((photo, photoIndex) =>
          photoIndex === index ? { ...photo, ...patch } : photo
        ),
      };
    });
  }, []);

  const removePhoto = useCallback((index: number) => {
    setDraft((current) => {
      const photos = current.photos ?? [];
      if (index < 0 || index >= photos.length) {
        return current;
      }

      return {
        ...current,
        photos: photos.filter((_, photoIndex) => photoIndex !== index),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setDraft({ photos: [] });
  }, []);

  const value = useMemo(
    () => ({
      draft,
      setType,
      setLocationText,
      setLocation,
      clearLocation,
      setDescription,
      addPhotoLocal,
      updatePhoto,
      removePhoto,
      reset,
    }),
    [
      addPhotoLocal,
      clearLocation,
      draft,
      removePhoto,
      reset,
      setDescription,
      setLocation,
      setLocationText,
      setType,
      updatePhoto,
    ]
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

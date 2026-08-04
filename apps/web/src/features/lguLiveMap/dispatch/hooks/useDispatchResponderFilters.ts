import { useMemo, useState } from "react";
import type { DispatchTask } from "../../../tasks/models/tasks.types";
import type { LguEmergencyDetails, Volunteer } from "../../models/lguLiveMap.types";
import {
  EMERGENCY_TRAINING_CONFIG,
  NEARBY_RESPONDER_RADIUS_KM,
} from "../constants/dispatchResponders.constants";
import type {
  DispatchResponderFilter,
  DispatchResponderFilterOption,
  DispatchResponderSort,
} from "../types/dispatchResponders.types";
import {
  activeAssignedResponderIds,
  normalizeDispatchResponder,
  responderBestMatchValue,
  toDispatchEmergencyContext,
} from "../utils/dispatchResponder.utils";

type Params = {
  emergency: LguEmergencyDetails;
  volunteers: Volunteer[];
  tasks: DispatchTask[];
  selectedIds: string[];
};

function toTimestamp(value?: string | null) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function useDispatchResponderFilters({ emergency, volunteers, tasks, selectedIds }: Params) {
  const [activeFilter, setActiveFilter] = useState<DispatchResponderFilter>("recommended");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<DispatchResponderSort>("bestMatch");

  const emergencyContext = useMemo(() => toDispatchEmergencyContext(emergency), [emergency]);
  const assignedIds = useMemo(() => activeAssignedResponderIds(tasks), [tasks]);
  const responders = useMemo(
    () => volunteers.map((volunteer) => normalizeDispatchResponder(volunteer, emergencyContext, assignedIds)),
    [assignedIds, emergencyContext, volunteers],
  );
  const supportsRating = responders.some((responder) => responder.rating !== null);
  const supportsEta = responders.some((responder) => responder.etaMinutes !== null);
  const supportsLocation = responders.some((responder) => responder.distanceKm !== null);

  const filterOptions: DispatchResponderFilterOption[] = [
    { id: "recommended", label: "Recommended" },
    { id: "all", label: "All Responders" },
    { id: "nearby", label: "Nearby", disabled: !supportsLocation, disabledReason: "Live locations unavailable" },
    { id: "topRated", label: "Top Rated", disabled: !supportsRating, disabledReason: "Ratings unavailable" },
    { id: "trained", label: EMERGENCY_TRAINING_CONFIG[emergencyContext.emergencyType].label },
    { id: "available", label: "Available Now" },
  ];

  const visibleResponders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const searched = responders.filter((responder) => {
      if (!query) return true;
      return [
        responder.name,
        responder.role,
        responder.teamName,
        responder.barangayName,
        responder.municipality,
        ...responder.skills,
      ].some((value) => String(value ?? "").toLowerCase().includes(query));
    });

    const filtered = searched.filter((responder) => {
      if (activeFilter === "nearby") {
        return responder.distanceKm !== null && responder.distanceKm <= NEARBY_RESPONDER_RADIUS_KM;
      }
      if (activeFilter === "topRated") return responder.rating !== null && responder.rating >= 4;
      if (activeFilter === "trained") return responder.matchesEmergencyTraining;
      if (activeFilter === "available") return responder.isDispatchable;
      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "nearest") return (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY);
      if (sortBy === "highestRated") return (b.rating ?? -1) - (a.rating ?? -1);
      if (sortBy === "fastestEta") return (a.etaMinutes ?? Number.POSITIVE_INFINITY) - (b.etaMinutes ?? Number.POSITIVE_INFINITY);
      if (sortBy === "name") return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      if (sortBy === "recentlyActive") return toTimestamp(b.lastSeenAt) - toTimestamp(a.lastSeenAt);
      return responderBestMatchValue(b) - responderBestMatchValue(a);
    });
  }, [activeFilter, responders, searchQuery, sortBy]);

  const selectedResponders = responders.filter((responder) => selectedIds.includes(responder.id));
  const selectionIsValid =
    selectedResponders.length === selectedIds.length && selectedResponders.every((responder) => responder.isDispatchable);
  const hasActiveFilters = activeFilter !== "recommended" || Boolean(searchQuery.trim()) || sortBy !== "bestMatch";

  const clearFilters = () => {
    setActiveFilter("recommended");
    setSearchQuery("");
    setSortBy("bestMatch");
  };

  return {
    emergencyContext,
    responders,
    visibleResponders,
    selectedResponders,
    selectionIsValid,
    availableCount: responders.filter((responder) => responder.isDispatchable).length,
    activeFilter,
    setActiveFilter,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    supportsRating,
    supportsEta,
    supportsLocation,
    filterOptions,
    hasActiveFilters,
    clearFilters,
  };
}

import { normalizeMobileEmergencyVisualType } from "../../emergency/constants/emergencyVisuals";
import type { MyRequestSummary, RequestSortOrder, RequestTypeFilter } from "../models/myRequests";

export type FilterAndSortOptions = {
  searchValue?: string;
  typeFilter?: RequestTypeFilter;
  sortOrder?: RequestSortOrder;
};

/**
 * Filters and sorts My Request items cleanly without mutating the input array.
 * Sequence:
 * 1. Emergency type filter
 * 2. Search query filter
 * 3. Chronological sorting (newest vs oldest)
 */
export function filterAndSortMyRequests(
  items: MyRequestSummary[],
  options?: FilterAndSortOptions
): MyRequestSummary[] {
  const searchValue = options?.searchValue ?? "";
  const typeFilter = options?.typeFilter ?? "all";
  const sortOrder = options?.sortOrder ?? "newest";

  let next = [...items];

  if (typeFilter !== "all") {
    next = next.filter((item) => {
      const normalizedItemType = normalizeMobileEmergencyVisualType(item.type);
      return normalizedItemType === typeFilter;
    });
  }

  const needle = searchValue.trim().toLowerCase();
  if (needle) {
    next = next.filter((item) => {
      const haystack = [
        item.referenceNumber,
        item.locationText,
        item.type,
        item.trackingLabel,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(needle);
    });
  }

  next.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    const safeATime = Number.isFinite(aTime) ? aTime : 0;
    const safeBTime = Number.isFinite(bTime) ? bTime : 0;
    return sortOrder === "newest" ? safeBTime - safeATime : safeATime - safeBTime;
  });

  return next;
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SEARCH_SECTION_ORDER } from "../constants/search.constants";
import type {
  SearchCategory,
  SearchCategoryCount,
  SearchCategoryGroup,
  SearchResultItem,
} from "../models/globalSearch.types";
import {
  fetchSearchDataset,
  filterAndRankItems,
  getLocationItems,
  getReportAndNavItems,
} from "../services/globalSearch.service";

export function useSearchResults(portalPathPrefix = "/lgu") {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q")?.trim() ?? "";
  const [categoryState, setCategoryState] = useState<{
    sourceQuery: string;
    value: SearchCategory;
  }>({ sourceQuery: query, value: "ALL" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allItems, setAllItems] = useState<SearchResultItem[]>(() => [
    ...getLocationItems(portalPathPrefix),
    ...getReportAndNavItems(portalPathPrefix),
  ]);
  const selectedCategory = categoryState.sourceQuery === query ? categoryState.value : "ALL";
  const setSelectedCategory = useCallback(
    (value: SearchCategory) => setCategoryState({ sourceQuery: query, value }),
    [query]
  );

  useEffect(() => {
    let cancelled = false;

    void fetchSearchDataset(portalPathPrefix)
      .then((items) => {
        if (!cancelled) setAllItems(items);
      })
      .catch(() => {
        if (!cancelled) setError("Some live operational records could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [portalPathPrefix]);

  const matchingResults = useMemo(
    () => filterAndRankItems(allItems, query),
    [allItems, query]
  );

  const categoryCounts = useMemo<SearchCategoryCount>(() => {
    const counts: SearchCategoryCount = {
      ALL: matchingResults.length,
      EMERGENCY: 0,
      RESPONDER: 0,
      VOLUNTEER: 0,
      TASK: 0,
      LOCATION: 0,
      REPORT: 0,
      NAVIGATION: 0,
    };
    matchingResults.forEach((item) => {
      counts[item.category] += 1;
    });
    return counts;
  }, [matchingResults]);

  const visibleGroups = useMemo<SearchCategoryGroup[]>(() => {
    const categories =
      selectedCategory === "ALL" ? SEARCH_SECTION_ORDER : [selectedCategory];

    return categories.flatMap((category) => {
      const items = matchingResults.filter((item) => item.category === category);
      if (items.length === 0) return [];
      return [{ category, label: category, iconType: items[0].iconType, items }];
    });
  }, [matchingResults, selectedCategory]);

  const clearSearch = useCallback(() => {
    navigate(`${portalPathPrefix}/search`);
  }, [navigate, portalPathPrefix]);

  const openItem = useCallback(
    (item: SearchResultItem) => {
      if (item.external) window.open(item.path, "_blank", "noopener,noreferrer");
      else navigate(item.path);
    },
    [navigate]
  );

  return {
    query,
    clearSearch,
    selectedCategory,
    setSelectedCategory,
    categoryCounts,
    visibleGroups,
    matchingResults,
    loading,
    error,
    openItem,
  };
}

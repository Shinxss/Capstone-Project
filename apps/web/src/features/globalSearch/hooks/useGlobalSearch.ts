import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  SearchCategory,
  SearchCategoryCount,
  SearchResultItem,
} from "../models/globalSearch.types";
import {
  fetchSearchDataset,
  filterAndRankItems,
  getLocationItems,
  getNavigationItems,
} from "../services/globalSearch.service";

type UseGlobalSearchOptions = {
  portalPathPrefix?: string;
};

export function useGlobalSearch({ portalPathPrefix = "/lgu" }: UseGlobalSearchOptions = {}) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("ALL");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [allItems, setAllItems] = useState<SearchResultItem[]>(() => [
    ...getLocationItems(portalPathPrefix),
    ...getNavigationItems(portalPathPrefix),
  ]);

  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load live operational dataset when opened or on first interaction
  const loadDataset = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSearchDataset(portalPathPrefix);
      setAllItems(data);
    } catch {
      // Graceful fallback to initial navigation & location items
    } finally {
      setLoading(false);
    }
  }, [portalPathPrefix]);

  const openSearch = useCallback(() => {
    setIsOpen(true);
    void loadDataset();
  }, [loadDataset]);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setSelectedIndex(0);
  }, []);

  // Filter and score results
  const results = useMemo(() => {
    return filterAndRankItems(allItems, query, activeCategory);
  }, [allItems, query, activeCategory]);

  // Compute category counts
  const categoryCounts = useMemo<SearchCategoryCount>(() => {
    const clean = query.trim().toLowerCase();
    const items = clean
      ? filterAndRankItems(allItems, query, "ALL")
      : allItems;

    const counts: SearchCategoryCount = {
      ALL: items.length,
      EMERGENCY: 0,
      RESPONDER: 0,
      VOLUNTEER: 0,
      TASK: 0,
      LOCATION: 0,
      NAVIGATION: 0,
    };

    for (const it of items) {
      if (counts[it.category] !== undefined) {
        counts[it.category] += 1;
      }
    }

    return counts;
  }, [allItems, query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  // Select an item and execute navigation
  const selectItem = useCallback(
    (item: SearchResultItem) => {
      closeSearch();
      setQuery("");
      if (item.external) {
        window.open(item.path, "_blank");
      } else {
        navigate(item.path);
      }
    },
    [closeSearch, navigate]
  );

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => {
          const next = !prev;
          if (next) {
            void loadDataset();
            setTimeout(() => inputRef.current?.focus(), 50);
          }
          return next;
        });
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loadDataset]);

  // Key navigation while search is open
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSearch();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length === 0 ? 0 : (prev + 1) % results.length));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          results.length === 0 ? 0 : (prev - 1 + results.length) % results.length
        );
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (results[selectedIndex]) {
          selectItem(results[selectedIndex]);
        }
      }
    },
    [closeSearch, results, selectedIndex, selectItem]
  );

  return {
    isOpen,
    setIsOpen,
    openSearch,
    closeSearch,
    query,
    setQuery,
    activeCategory,
    setActiveCategory,
    selectedIndex,
    setSelectedIndex,
    loading,
    results,
    categoryCounts,
    selectItem,
    inputRef,
    handleKeyDown,
  };
}

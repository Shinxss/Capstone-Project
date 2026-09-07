import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  SearchResultItem,
} from "../models/globalSearch.types";
import {
  fetchSearchDataset,
  filterAndRankItems,
  getLocationItems,
  getReportAndNavItems,
  groupResultsByCategory,
} from "../services/globalSearch.service";

const RECENT_SEARCHES_KEY = "lifeline_recent_searches";

function loadRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((t) => typeof t === "string" && t.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(items: string[]) {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items.slice(0, 10)));
  } catch {
    // ignore
  }
}

type UseGlobalSearchOptions = {
  portalPathPrefix?: string;
  debounceMs?: number;
};

export function useGlobalSearch({
  portalPathPrefix = "/lgu",
  debounceMs = 200,
}: UseGlobalSearchOptions = {}) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);

  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadRecentSearches());

  const [allItems, setAllItems] = useState<SearchResultItem[]>(() => [
    ...getLocationItems(portalPathPrefix),
    ...getReportAndNavItems(portalPathPrefix),
  ]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Debounce query
  useEffect(() => {
    setIsDebouncing(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setIsDebouncing(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Load operational dataset on focus/open
  const loadDataset = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSearchDataset(portalPathPrefix);
      setAllItems(data);
    } catch {
      // Keep static defaults on failure
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

  const addRecentSearch = useCallback((term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const next = [clean, ...filtered].slice(0, 10);
      saveRecentSearches(next);
      return next;
    });
  }, []);

  const removeRecentSearch = useCallback((term: string) => {
    setRecentSearches((prev) => {
      const next = prev.filter((item) => item !== term);
      saveRecentSearches(next);
      return next;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    saveRecentSearches([]);
  }, []);

  // Filtered and ranked items ONLY when there are typed characters
  const flatResults = useMemo(() => {
    const clean = debouncedQuery.trim();
    if (!clean) return [];
    return filterAndRankItems(allItems, clean);
  }, [allItems, debouncedQuery]);

  // Grouped results for the anchored dropdown presentation
  const { groups: groupedResults, totalMatches } = useMemo(() => {
    if (flatResults.length === 0) return { groups: [], totalMatches: 0 };
    return groupResultsByCategory(flatResults, 4);
  }, [flatResults]);

  const [hasArrowNavigated, setHasArrowNavigated] = useState(false);

  // Reset arrow navigation tracking when query changes
  useEffect(() => {
    setSelectedIndex(0);
    setHasArrowNavigated(false);
  }, [debouncedQuery]);

  const navigateToFullSearch = useCallback(
    (overrideQuery?: string) => {
      const q = (overrideQuery !== undefined ? overrideQuery : query).trim();
      if (!q) return; // Only navigate if user has typed characters
      addRecentSearch(q);
      closeSearch();
      inputRef.current?.blur();
      navigate(`${portalPathPrefix}/search?q=${encodeURIComponent(q)}`);
    },
    [addRecentSearch, closeSearch, navigate, portalPathPrefix, query]
  );

  // Navigation on item selection
  const selectItem = useCallback(
    (item: SearchResultItem) => {
      if (item.title) {
        addRecentSearch(item.title);
      }
      closeSearch();
      inputRef.current?.blur();
      if (item.external) {
        window.open(item.path, "_blank");
      } else {
        navigate(item.path);
      }
    },
    [addRecentSearch, closeSearch, navigate]
  );

  // Global Ctrl+K / Cmd+K to focus search input
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        openSearch();
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [openSearch]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent | TouchEvent) {
      if (!isOpen) return;
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, closeSearch]);

  // Keyboard navigation within the input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen && (e.key === "ArrowDown" || e.key === "Enter")) {
        openSearch();
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        closeSearch();
        inputRef.current?.blur();
        return;
      }

      if (e.key === "ArrowDown") {
        if (flatResults.length === 0) return;
        e.preventDefault();
        setHasArrowNavigated(true);
        setSelectedIndex((prev) => (prev + 1) % flatResults.length);
        return;
      }

      if (e.key === "ArrowUp") {
        if (flatResults.length === 0) return;
        e.preventDefault();
        setHasArrowNavigated(true);
        setSelectedIndex((prev) => (prev - 1 + flatResults.length) % flatResults.length);
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        // If user manually highlighted an item using arrow keys, open that item
        if (hasArrowNavigated && flatResults[selectedIndex]) {
          selectItem(flatResults[selectedIndex]);
        } else {
          // Only open full search page if characters were typed
          if (query.trim()) {
            navigateToFullSearch();
          }
        }
      }
    },
    [isOpen, flatResults, selectedIndex, hasArrowNavigated, query, openSearch, closeSearch, selectItem, navigateToFullSearch]
  );

  return {
    isOpen,
    openSearch,
    closeSearch,
    query,
    setQuery,
    debouncedQuery,
    isSearching: loading || isDebouncing,
    flatResults,
    groupedResults,
    totalMatches,
    selectedIndex,
    setSelectedIndex,
    selectItem,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    clearRecentSearches,
    navigateToFullSearch,
    containerRef,
    inputRef,
    handleKeyDown,
  };
}

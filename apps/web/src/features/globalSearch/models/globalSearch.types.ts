export type SearchCategory =
  | "ALL"
  | "EMERGENCY"
  | "RESPONDER"
  | "VOLUNTEER"
  | "TASK"
  | "LOCATION"
  | "NAVIGATION";

export type SearchResultBadgeTone = "red" | "emerald" | "blue" | "amber" | "purple" | "gray";

export type SearchResultItem = {
  id: string;
  category: SearchCategory;
  title: string;
  subtitle: string;
  meta?: string;
  badge?: {
    label: string;
    tone: SearchResultBadgeTone;
  };
  path: string;
  external?: boolean;
  coordinates?: [number, number]; // [lng, lat]
  iconType: "emergency" | "responder" | "volunteer" | "task" | "location" | "navigation";
  rawStatus?: string;
};

export type SearchCategoryCount = Record<SearchCategory, number>;

export type GlobalSearchState = {
  query: string;
  activeCategory: SearchCategory;
  isOpen: boolean;
  selectedIndex: number;
  loading: boolean;
  error: string | null;
  results: SearchResultItem[];
  filteredResults: SearchResultItem[];
  categoryCounts: SearchCategoryCount;
};

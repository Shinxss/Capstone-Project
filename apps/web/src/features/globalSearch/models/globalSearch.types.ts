export type SearchCategory =
  | "ALL"
  | "EMERGENCY"
  | "RESPONDER"
  | "VOLUNTEER"
  | "TASK"
  | "LOCATION"
  | "REPORT"
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
  iconType: "emergency" | "responder" | "volunteer" | "task" | "location" | "report" | "navigation";
  rawStatus?: string;
  details?: {
    avatarUrl?: string;
    availability?: string;
    roleLabel?: string;
    skills?: string[];
    phone?: string;
    email?: string;
    location?: string;
    completedTasks?: number;
    rating?: number;
    reviewCount?: number;
    emergencyType?: string;
    severity?: "High" | "Medium";
    reportedBy?: string;
    reportedAt?: string;
    assignedTo?: string;
    photoUrls?: string[];
    assignedResponders?: number;
  };
};

export type SearchCategoryGroup = {
  category: SearchCategory;
  label: string;
  iconType: SearchResultItem["iconType"];
  items: SearchResultItem[];
};

export type SearchCategoryCount = Record<SearchCategory, number>;

export type GlobalSearchState = {
  query: string;
  isOpen: boolean;
  selectedIndex: number;
  loading: boolean;
  error: string | null;
  results: SearchResultItem[];
  groupedResults: SearchCategoryGroup[];
  categoryCounts: SearchCategoryCount;
};

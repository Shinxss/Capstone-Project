import {
  ClipboardList,
  Compass,
  FileText,
  MapPin,
  Search,
  ShieldCheck,
  Siren,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { SearchCategory } from "../models/globalSearch.types";

export type SearchCategoryDefinition = {
  key: SearchCategory;
  label: string;
  sectionLabel: string;
  icon: LucideIcon;
};

export const SEARCH_CATEGORIES: SearchCategoryDefinition[] = [
  { key: "ALL", label: "All", sectionLabel: "All results", icon: Search },
  { key: "VOLUNTEER", label: "Volunteers", sectionLabel: "Volunteers", icon: Users },
  { key: "EMERGENCY", label: "Emergencies", sectionLabel: "Emergencies", icon: Siren },
  { key: "TASK", label: "Tasks", sectionLabel: "Tasks", icon: ClipboardList },
  { key: "RESPONDER", label: "Responders", sectionLabel: "Responders", icon: ShieldCheck },
  { key: "LOCATION", label: "Locations", sectionLabel: "Locations", icon: MapPin },
  { key: "REPORT", label: "Reports", sectionLabel: "Reports & Analytics", icon: FileText },
  { key: "NAVIGATION", label: "Navigation", sectionLabel: "Pages & Quick Jump", icon: Compass },
];

export const SEARCH_SECTION_ORDER = SEARCH_CATEGORIES.filter(
  (category) => category.key !== "ALL"
).map((category) => category.key);

export function getSearchCategoryDefinition(category: SearchCategory) {
  return SEARCH_CATEGORIES.find((item) => item.key === category) ?? SEARCH_CATEGORIES[0];
}

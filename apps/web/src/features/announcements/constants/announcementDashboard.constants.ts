import type { AnnouncementFilters, AnnouncementTemplate } from "../models/announcements.types";

export const EMPTY_ANNOUNCEMENT_FILTERS: AnnouncementFilters = {
  status: "ALL",
  audience: "",
  search: "",
};

export const ANNOUNCEMENT_TEMPLATES: ReadonlyArray<AnnouncementTemplate> = [
  {
    id: "flood-advisory",
    title: "Flood Advisory",
    description: "Notify the community about flooding risks and safety precautions.",
    body: "Flooding has been reported in affected areas. Please avoid flooded roads, move valuables to higher ground, and monitor official LGU updates.",
    audience: "PUBLIC",
    category: "FLOOD",
  },
  {
    id: "volunteer-assembly",
    title: "Volunteer Assembly Notice",
    description: "Share assembly time, location, and coordination details.",
    body: "All available volunteers are requested to assemble at the designated coordination point. Please bring your identification and assigned safety equipment.",
    audience: "VOLUNTEER",
    category: "VOLUNTEER",
  },
  {
    id: "evacuation-reminder",
    title: "Evacuation Reminder",
    description: "Remind residents about evacuation centers and safety protocols.",
    body: "Residents in affected areas are advised to proceed calmly to the nearest designated evacuation center and follow instructions from barangay officials.",
    audience: "PUBLIC",
    category: "EVACUATION",
  },
  {
    id: "severe-weather",
    title: "Severe Weather Update",
    description: "Share official weather conditions and preparedness guidance.",
    body: "Severe weather conditions are expected. Secure loose outdoor items, charge communication devices, and remain indoors unless evacuation is advised.",
    audience: "ALL",
    category: "WEATHER",
  },
  {
    id: "public-safety",
    title: "Public Safety Reminder",
    description: "Publish a concise community-wide safety reminder.",
    body: "Please remain alert, follow verified LGU advisories, and report urgent concerns through official Lifeline emergency channels.",
    audience: "ALL",
    category: "SAFETY",
  },
];

import { ProfileSkill } from "./profileSkill.model";

const DEFAULT_PROFILE_SKILL_LABELS = [
  "First Aid",
  "CPR",
  "Basic Life Support",
  "Advanced Cardiac Life Support",
  "Automated External Defibrillator Operation",
  "Trauma Care",
  "Triage",
  "Wound Management",
  "Fracture Immobilization",
  "Emergency Childbirth Support",
  "Ambulance Assistance",
  "Patient Transport",
  "Search and Rescue",
  "Urban Search and Rescue",
  "Water Rescue",
  "Swiftwater Rescue",
  "High-Angle Rope Rescue",
  "Collapsed Structure Rescue",
  "Canine Search Support",
  "Missing Person Search",
  "Fire Response",
  "Wildfire Support",
  "Fire Suppression Basics",
  "Hazmat Awareness",
  "Hazmat Decontamination Support",
  "Flood Response",
  "Typhoon Response",
  "Earthquake Response",
  "Landslide Response",
  "Storm Surge Preparedness",
  "Disaster Risk Reduction",
  "Incident Command System",
  "Evacuation Center Operations",
  "Disaster Logistics",
  "Relief Goods Distribution",
  "Supply Chain Coordination",
  "Shelter Management",
  "Camp Coordination",
  "Volunteer Team Leadership",
  "Community Organizing",
  "Emergency Communications",
  "Radio Operations",
  "Satellite Communication Basics",
  "Public Information Support",
  "Crowd Management",
  "Evacuation Assistance",
  "Traffic and Route Management",
  "Driving",
  "Motorcycle Response",
  "Drone Operations",
  "GIS Mapping",
  "Damage Assessment",
  "Needs Assessment",
  "Psychological First Aid",
  "Mental Health and Psychosocial Support",
  "Child Protection in Emergencies",
  "Elderly Care Support",
  "Disability-Inclusive Response",
  "Sign Language Basics",
  "Basic Water Safety",
  "Food Handling and Safety",
  "Sanitation and Hygiene Promotion",
  "WASH Support",
] as const;

function normalizeLabel(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toSkillCode(label: string) {
  const normalizedCode = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  if (normalizedCode) return normalizedCode;

  let hash = 0;
  for (let index = 0; index < label.length; index += 1) {
    hash = (hash * 31 + label.charCodeAt(index)) >>> 0;
  }

  return `skill-${hash.toString(36)}`.slice(0, 80);
}

async function ensureDefaultProfileSkills() {
  const upserts = DEFAULT_PROFILE_SKILL_LABELS.map((label, index) => {
    const code = toSkillCode(label);
    return ProfileSkill.updateOne(
      { code },
      {
        $setOnInsert: {
          code,
          label,
          sortOrder: index,
          isActive: true,
        },
      },
      { upsert: true }
    );
  });

  await Promise.all(upserts);
}

export async function listActiveProfileSkillLabels() {
  await ensureDefaultProfileSkills();

  const items = await ProfileSkill.find({ isActive: true })
    .sort({ sortOrder: 1, label: 1 })
    .select("label")
    .lean();

  return items
    .map((item) => normalizeLabel(item?.label))
    .filter(Boolean);
}

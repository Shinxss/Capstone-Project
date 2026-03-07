export type ParsedSkillState = {
  selectedSkills: string[];
  otherSkillEnabled: boolean;
  otherSkillText: string;
  composedSkillsText: string;
};

function normalize(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeSkillOptions(options: string[]) {
  const normalized = options.map((option) => normalize(option)).filter(Boolean);
  return Array.from(new Set(normalized));
}

export function splitSkillsText(value: string) {
  return normalize(value)
    .split(/[\u2022,;\n|]/g)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function formatSkillsDisplayText(value: string | null | undefined) {
  const tokens = splitSkillsText(normalize(value));
  if (tokens.length === 0) return "";

  const seen = new Set<string>();
  const deduped: string[] = [];
  for (const token of tokens) {
    const normalizedToken = token.toLowerCase();
    if (seen.has(normalizedToken)) continue;
    seen.add(normalizedToken);
    deduped.push(token);
  }

  return deduped.join(" · ");
}

export function composeSkillsText(selectedSkills: string[], otherSkillEnabled: boolean, otherSkillText: string) {
  const uniqueSelected: string[] = [];
  for (const rawSkill of selectedSkills) {
    const skill = rawSkill.trim();
    if (skill && !uniqueSelected.includes(skill)) {
      uniqueSelected.push(skill);
    }
  }

  const parts = [...uniqueSelected];
  const other = normalize(otherSkillText);
  if (otherSkillEnabled && other) {
    parts.push(other);
  }

  return parts.join(" | ");
}

export function parseSkillState(skillsText: string, skillOptions: string[]): ParsedSkillState {
  const normalizedSkillsText = normalize(skillsText);
  if (!normalizedSkillsText) {
    return {
      selectedSkills: [],
      otherSkillEnabled: false,
      otherSkillText: "",
      composedSkillsText: "",
    };
  }

  const optionMap = new Map<string, string>();
  for (const option of skillOptions) {
    optionMap.set(option.toLowerCase(), option);
  }

  const selectedSkills: string[] = [];
  const otherSkills: string[] = [];

  for (const token of splitSkillsText(normalizedSkillsText)) {
    const matchedOption = optionMap.get(token.toLowerCase());
    if (matchedOption) {
      if (!selectedSkills.includes(matchedOption)) {
        selectedSkills.push(matchedOption);
      }
      continue;
    }

    if (!otherSkills.includes(token)) {
      otherSkills.push(token);
    }
  }

  const otherSkillText = otherSkills.join(", ");
  const otherSkillEnabled = otherSkillText.length > 0;

  return {
    selectedSkills,
    otherSkillEnabled,
    otherSkillText,
    composedSkillsText: composeSkillsText(selectedSkills, otherSkillEnabled, otherSkillText),
  };
}

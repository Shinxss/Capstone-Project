import type { AchievementDefinition, AchievementId } from "./achievement.types";

const VOLUNTEER = ["VOLUNTEER"] as const;
const MOBILE_USERS = ["VOLUNTEER", "COMMUNITY"] as const;

export const ACHIEVEMENT_DEFINITIONS: readonly AchievementDefinition[] = [
  { id: "verified-volunteer", title: "Verified Volunteer", description: "Become an officially verified Lifeline volunteer.", category: "verification", sortOrder: 1, audiences: VOLUNTEER },
  { id: "ready-to-respond", title: "Ready to Respond", description: "Respond to your first Lifeline emergency assignment.", category: "response", sortOrder: 2, audiences: VOLUNTEER },
  { id: "first-response", title: "First Response", description: "Complete your first officially verified emergency response.", category: "response", sortOrder: 3, audiences: VOLUNTEER },
  { id: "helping-hand", title: "Helping Hand", description: "Complete 5 verified emergency response tasks.", category: "service", sortOrder: 4, audiences: VOLUNTEER },
  { id: "community-responder", title: "Community Responder", description: "Complete 10 verified emergency response tasks.", category: "service", sortOrder: 5, audiences: VOLUNTEER },
  { id: "dedicated-responder", title: "Dedicated Responder", description: "Complete 25 verified emergency response tasks.", category: "service", sortOrder: 6, audiences: VOLUNTEER },
  { id: "lifeline-guardian", title: "Lifeline Guardian", description: "Complete 50 verified emergency response tasks.", category: "service", sortOrder: 7, audiences: VOLUNTEER },
  { id: "community-protector", title: "Community Protector", description: "Complete 100 verified emergency response tasks.", category: "service", sortOrder: 8, audiences: VOLUNTEER },
  { id: "response-veteran", title: "Response Veteran", description: "Complete 200 verified emergency response tasks.", category: "service", sortOrder: 9, audiences: VOLUNTEER },
  { id: "trusted-responder", title: "Trusted Responder", description: "Maintain an average rating of 4.5 or higher after receiving at least 5 community reviews.", category: "trust", sortOrder: 10, audiences: VOLUNTEER },
  { id: "dependable-hand", title: "Dependable Hand", description: "Maintain a dependable response record across your Lifeline assignments.", category: "response", sortOrder: 11, audiences: VOLUNTEER },
  { id: "always-ready", title: "Always Ready", description: "Respond to 25 Lifeline emergency assignments.", category: "response", sortOrder: 12, audiences: VOLUNTEER },
  { id: "trusted-lifeline", title: "Trusted Lifeline", description: "Build an exceptional record of trust through consistently high community ratings.", category: "trust", sortOrder: 13, audiences: VOLUNTEER },
  { id: "response-certified", title: "Response Certified", description: "Complete an emergency response with verified after-action proof.", category: "verification", sortOrder: 14, audiences: VOLUNTEER },
  { id: "chain-of-trust", title: "Chain of Trust", description: "Have your first verified response permanently recorded through Lifeline's blockchain audit trail.", category: "blockchain", sortOrder: 15, audiences: VOLUNTEER },
  { id: "immutable-impact", title: "Immutable Impact", description: "Record 25 verified emergency responses in Lifeline's blockchain-backed audit trail.", category: "blockchain", sortOrder: 16, audiences: VOLUNTEER },
  { id: "team-player", title: "Team Player", description: "Complete your first verified emergency response alongside another Lifeline responder.", category: "teamwork", sortOrder: 17, audiences: VOLUNTEER },
  { id: "helping-together", title: "Helping Together", description: "Complete 5 verified emergency responses alongside fellow responders.", category: "teamwork", sortOrder: 18, audiences: VOLUNTEER },
  { id: "community-connector", title: "Community Connector", description: "Support verified emergency responses across 3 different communities.", category: "teamwork", sortOrder: 19, audiences: VOLUNTEER },
  { id: "response-partner", title: "Response Partner", description: "Complete 10 verified collaborative emergency responses.", category: "teamwork", sortOrder: 20, audiences: VOLUNTEER },
  { id: "united-we-respond", title: "United We Respond", description: "Complete 20 verified emergency responses as part of a coordinated multi-responder effort.", category: "teamwork", sortOrder: 21, audiences: VOLUNTEER },
  { id: "response-leader", title: "Response Leader", description: "Lead a Lifeline response team and demonstrate verified field experience.", category: "teamwork", sortOrder: 22, audiences: VOLUNTEER },
  { id: "first-step", title: "First Step", description: "Complete your Lifeline user profile.", category: "verification", sortOrder: 23, audiences: VOLUNTEER },
  { id: "getting-started", title: "Getting Started", description: "Complete your profile and register your responder skills.", category: "verification", sortOrder: 24, audiences: VOLUNTEER },
  { id: "making-a-difference", title: "Making a Difference", description: "Contribute 5 verified hours of volunteer service.", category: "service", sortOrder: 25, audiences: VOLUNTEER },
  { id: "service-starter", title: "Service Starter", description: "Contribute 10 verified hours of volunteer service.", category: "service", sortOrder: 26, audiences: VOLUNTEER },
  { id: "community-supporter", title: "Community Supporter", description: "Contribute 25 verified hours of volunteer service.", category: "service", sortOrder: 27, audiences: VOLUNTEER },
  { id: "service-champion", title: "Service Champion", description: "Contribute 50 verified hours of volunteer service.", category: "service", sortOrder: 28, audiences: VOLUNTEER },
  { id: "community-guardian", title: "Community Guardian", description: "Contribute 100 verified hours of volunteer service.", category: "service", sortOrder: 29, audiences: VOLUNTEER },
  { id: "lifeline-veteran", title: "Lifeline Veteran", description: "Contribute 250 verified hours of volunteer service.", category: "service", sortOrder: 30, audiences: VOLUNTEER },
  { id: "legacy-responder", title: "Legacy Responder", description: "Contribute 500 verified hours of volunteer service.", category: "service", sortOrder: 31, audiences: VOLUNTEER },
  { id: "medical-aid-responder", title: "Medical Aid Responder", description: "Complete a verified medical emergency response.", category: "specialty", sortOrder: 32, audiences: VOLUNTEER },
  { id: "flood-response-ready", title: "Flood Response Ready", description: "Complete a verified flood emergency response.", category: "specialty", sortOrder: 33, audiences: VOLUNTEER },
  { id: "fire-response-ready", title: "Fire Response Ready", description: "Complete a verified fire emergency response.", category: "specialty", sortOrder: 34, audiences: VOLUNTEER },
  { id: "rescue-ready", title: "Rescue Ready", description: "Complete a verified rescue-oriented emergency response.", category: "specialty", sortOrder: 35, audiences: VOLUNTEER },
  { id: "evacuation-supporter", title: "Evacuation Supporter", description: "Support verified emergency operations involving evacuation-prone disasters.", category: "specialty", sortOrder: 36, audiences: VOLUNTEER },
  { id: "relief-coordinator", title: "Relief Coordinator", description: "Coordinate verified relief operations for disaster-affected communities.", category: "specialty", sortOrder: 37, audiences: VOLUNTEER },
  { id: "navigation-specialist", title: "Navigation Specialist", description: "Complete verified emergency responses across 5 different communities.", category: "specialty", sortOrder: 38, audiences: VOLUNTEER },
  { id: "field-support-specialist", title: "Field Support Specialist", description: "Demonstrate verified response experience across multiple emergency types.", category: "specialty", sortOrder: 39, audiences: VOLUNTEER },
  { id: "community-ready", title: "Community Ready", description: "Complete your Lifeline community profile.", category: "community", sortOrder: 40, audiences: MOBILE_USERS },
  { id: "safety-aware", title: "Safety Aware", description: "Submit your first emergency report through Lifeline.", category: "community", sortOrder: 41, audiences: MOBILE_USERS },
  { id: "verified-reporter", title: "Verified Reporter", description: "Have your first community emergency report officially verified.", category: "community", sortOrder: 42, audiences: MOBILE_USERS },
  { id: "community-watch", title: "Community Watch", description: "Have 5 community emergency reports officially verified.", category: "community", sortOrder: 43, audiences: MOBILE_USERS },
  { id: "prepared-citizen", title: "Prepared Citizen", description: "Build a strong record of responsible community reporting across different emergency types.", category: "community", sortOrder: 44, audiences: MOBILE_USERS },
  { id: "lifeline-supporter", title: "Lifeline Supporter", description: "Contribute 25 officially verified community emergency reports.", category: "community", sortOrder: 45, audiences: MOBILE_USERS },
  { id: "heart-of-lifeline", title: "Heart of Lifeline", description: "Demonstrate exceptional long-term service to the Lifeline community.", category: "recognition", sortOrder: 46, audiences: VOLUNTEER },
  { id: "guardian-of-the-community", title: "Guardian of the Community", description: "Reach an outstanding level of verified emergency service.", category: "recognition", sortOrder: 47, audiences: VOLUNTEER },
  { id: "beacon-of-hope", title: "Beacon of Hope", description: "Combine extensive service with an exceptional record of community trust.", category: "recognition", sortOrder: 48, audiences: VOLUNTEER },
  { id: "above-and-beyond", title: "Above & Beyond", description: "Go far beyond normal service expectations through exceptional verified contribution.", category: "recognition", sortOrder: 49, audiences: VOLUNTEER },
  { id: "pillar-of-service", title: "Pillar of Service", description: "Reach Lifeline's highest lifetime milestone for trusted volunteer service.", category: "recognition", sortOrder: 50, audiences: VOLUNTEER },
] as const;

export const VERIFIED_TASK_TARGETS: Readonly<Partial<Record<AchievementId, number>>> = {
  "first-response": 1,
  "helping-hand": 5,
  "community-responder": 10,
  "dedicated-responder": 25,
  "lifeline-guardian": 50,
  "community-protector": 100,
  "response-veteran": 200,
};

export const VOLUNTEER_HOUR_TARGETS: Readonly<Partial<Record<AchievementId, number>>> = {
  "making-a-difference": 5,
  "service-starter": 10,
  "community-supporter": 25,
  "service-champion": 50,
  "community-guardian": 100,
  "lifeline-veteran": 250,
  "legacy-responder": 500,
};

export const TEAM_RESPONSE_TARGETS: Readonly<Partial<Record<AchievementId, number>>> = {
  "team-player": 1,
  "helping-together": 5,
  "response-partner": 10,
  "united-we-respond": 20,
};

export const TRUSTED_RESPONDER_REVIEW_TARGET = 5;
export const TRUSTED_RESPONDER_RATING_TARGET = 4.5;
export const TRUSTED_LIFELINE_REVIEW_TARGET = 20;
export const TRUSTED_LIFELINE_RATING_TARGET = 4.7;

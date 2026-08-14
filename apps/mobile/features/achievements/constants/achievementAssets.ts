import type { ImageSource } from "expo-image";
import type { AchievementId } from "../models/achievement.types";

export const ACHIEVEMENT_BADGE_ASSETS: Record<AchievementId, ImageSource> = {
  "first-response": require("../../../assets/images/badges/first-response.png"),
  "ready-to-respond": require("../../../assets/images/badges/ready-to-respond.png"),
  "helping-hand": require("../../../assets/images/badges/helping-hand.png"),
  "community-responder": require("../../../assets/images/badges/community-responder.png"),
  "dedicated-responder": require("../../../assets/images/badges/dedicated-responder.png"),
  "lifeline-guardian": require("../../../assets/images/badges/lifeline-guardian.png"),
  "community-protector": require("../../../assets/images/badges/community-protector.png"),
  "response-veteran": require("../../../assets/images/badges/response-veteran.png"),
  "verified-volunteer": require("../../../assets/images/badges/verified-volunteer.png"),
  "trusted-responder": require("../../../assets/images/badges/trusted-responder.png"),
};

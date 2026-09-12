import type { ImageSource } from "expo-image";
import type { LevelNumber } from "../models/achievement.types";

export const LEVEL_BADGE_ASSETS: Record<LevelNumber, ImageSource> = {
  1: require("../../../assets/images/levels/level_1.png"),
  2: require("../../../assets/images/levels/level_2.png"),
  3: require("../../../assets/images/levels/level_3.png"),
  4: require("../../../assets/images/levels/level_4.png"),
  5: require("../../../assets/images/levels/level_5.png"),
  6: require("../../../assets/images/levels/level_6.png"),
  7: require("../../../assets/images/levels/level_7.png"),
  8: require("../../../assets/images/levels/level_8.png"),
  9: require("../../../assets/images/levels/level_9.png"),
  10: require("../../../assets/images/levels/level_10.png"),
};

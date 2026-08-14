import type { Request, Response } from "express";
import { evaluateAndAwardAchievements } from "./achievement.service";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load achievements";
}

export async function getMyAchievementsController(req: Request, res: Response) {
  const userId = String(req.userId ?? req.user?.id ?? "").trim();
  if (!userId) return res.status(401).json({ message: "Unauthorized" });

  try {
    const result = await evaluateAndAwardAchievements(userId);
    if (!result) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(result);
  } catch (error: unknown) {
    return res.status(500).json({ message: errorMessage(error) });
  }
}

import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { validate } from "../../middlewares/validate";
import {
  getPushPreferencesController,
  registerPushController,
  unregisterPushController,
  updatePushPreferencesController,
} from "./push.controller";
import {
  registerPushSchema,
  unregisterPushSchema,
  updatePushPreferencesSchema,
} from "./push.validation";

const router = Router();

router.post("/register", requireAuth, validate(registerPushSchema), registerPushController);
router.post("/unregister", requireAuth, validate(unregisterPushSchema), unregisterPushController);
router.patch(
  "/preferences",
  requireAuth,
  validate(updatePushPreferencesSchema),
  updatePushPreferencesController
);
router.get("/preferences", requireAuth, getPushPreferencesController);

export default router;

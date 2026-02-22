import { Router } from "express";
import { requireAuth } from "../../middlewares/requireAuth";
import { requireRole } from "../../middlewares/requireRole";
import { validate } from "../../middlewares/validate";
import {
  getMyPushTokensController,
  queryNotificationStateController,
  registerPushTokenController,
  setNotificationArchivedController,
  setNotificationReadController,
  sendMyTestPushController,
  unregisterPushTokenController,
} from "./notifications.controller";
import {
  queryNotificationStateSchema,
  registerPushTokenSchema,
  setNotificationArchivedSchema,
  setNotificationReadSchema,
  unregisterPushTokenSchema,
} from "./notifications.validation";

const router = Router();

router.post(
  "/push-token",
  requireAuth,
  validate(registerPushTokenSchema),
  registerPushTokenController
);

router.delete(
  "/push-token",
  requireAuth,
  validate(unregisterPushTokenSchema),
  unregisterPushTokenController
);

router.get("/push-token/me", requireAuth, getMyPushTokensController);
router.post("/push-test/me", requireAuth, sendMyTestPushController);

router.post(
  "/state/query",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  validate(queryNotificationStateSchema),
  queryNotificationStateController
);

router.patch(
  "/state/read",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  validate(setNotificationReadSchema),
  setNotificationReadController
);

router.patch(
  "/state/archive",
  requireAuth,
  requireRole("LGU", "ADMIN"),
  validate(setNotificationArchivedSchema),
  setNotificationArchivedController
);

export default router;

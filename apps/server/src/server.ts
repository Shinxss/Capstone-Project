import "dotenv/config";
import { createServer } from "node:http";
import { app } from "./app";
import { connectDB } from "./config/db";
import { initNotificationsSocket } from "./realtime/notificationsSocket";
import { seedDefaultRoleProfiles } from "./features/rbac/rbac.service";
import { ensureDispatchLifecycleIndexes } from "./features/dispatches/dispatch.model";
import {
  expirePendingDispatchOffers,
  startPendingDispatchExpirationSweep,
} from "./features/dispatches/dispatch.service";

async function start() {
  const MONGODB_URI = process.env.MONGODB_URI || "";
  if (!MONGODB_URI) throw new Error("Missing MONGODB_URI in .env");

  await connectDB(MONGODB_URI);
  await expirePendingDispatchOffers();
  await ensureDispatchLifecycleIndexes();
  await seedDefaultRoleProfiles();

  const PORT = Number(process.env.PORT || 5000);
  const httpServer = createServer(app);
  initNotificationsSocket(httpServer);
  startPendingDispatchExpirationSweep();

  httpServer.listen(PORT, () => console.log(`🚀 API running at http://localhost:${PORT}`));
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});

import "dotenv/config";
import { app } from "./app";
import { connectDB } from "./config/db";

async function start() {
  const MONGODB_URI = process.env.MONGODB_URI || "";
  if (!MONGODB_URI) throw new Error("Missing MONGODB_URI in .env");

  await connectDB(MONGODB_URI);

  const PORT = Number(process.env.PORT || 5000);
  app.listen(PORT, () => console.log(`🚀 API running at http://localhost:${PORT}`));
}

start().catch((e) => {
  console.error(e);
  process.exit(1);
});

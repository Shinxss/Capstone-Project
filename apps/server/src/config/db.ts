import mongoose from "mongoose";

const isProduction = process.env.NODE_ENV === "production";

export async function connectDB(mongoUri: string) {
  // ── Global Mongoose settings ──
  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri, {
    // Connection pool
    maxPoolSize: isProduction ? 20 : 5,
    minPoolSize: isProduction ? 5 : 1,

    // Timeouts
    serverSelectionTimeoutMS: 10_000,
    socketTimeoutMS: 45_000,

    // Reliability
    retryWrites: true,
    appName: "lifeline-server",

    // Disable auto-index in production (indexes should be created via migrations)
    autoIndex: !isProduction,
  });

  console.log("✅ MongoDB connected");
}

import mongoose from "mongoose";

export async function connectDB(mongoUri: string) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB connected");
}

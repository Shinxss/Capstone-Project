import bcrypt from "bcryptjs";
import { User } from "../../models/User";

export async function authenticateUser(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
  if (!user) return null;

  if (!user.isActive) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return user;
}

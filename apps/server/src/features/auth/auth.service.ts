import bcrypt from "bcryptjs";
import { User } from "../users/user.model";

export async function authenticateUser(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
  if (!user) return null;

  if (!user.isActive) return null;
  if ((user.role === "COMMUNITY" || user.role === "VOLUNTEER") && !user.emailVerified) return null;
  if (!user.passwordHash) return null;

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;

  return user;
}

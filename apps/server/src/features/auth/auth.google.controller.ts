import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import type { TokenPayload } from "google-auth-library";
import { signAccessToken } from "../../utils/jwt";
import { User } from "../users/user.model";
import { toAuthUserPayload } from "./otp.utils";
import { zodPasswordSchema } from "./password.policy";

const googleClient = new OAuth2Client();

type GoogleLoginBody = {
  idToken?: string;
};

type SetPasswordBody = {
  newPassword?: string;
  confirmPassword?: string;
};

const INVALID_CREDENTIALS = "Invalid credentials";
const GENERIC_GOOGLE_LOGIN_ERROR = "Google login failed.";
const INVALID_REQUEST = "Invalid request";
const LINKING_FAILED = "Linking failed";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getAudienceList() {
  return [process.env.GOOGLE_ANDROID_CLIENT_ID, process.env.GOOGLE_WEB_CLIENT_ID]
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value): value is string => Boolean(value));
}

function resolveAuthProvider(hasPassword: boolean, hasGoogle: boolean) {
  if (hasPassword && hasGoogle) return "both" as const;
  if (hasGoogle) return "google" as const;
  return "local" as const;
}

async function verifyGoogleIdTokenOrThrow(idToken: string): Promise<TokenPayload> {
  const audience = getAudienceList();
  if (audience.length === 0) {
    throw new Error("Missing GOOGLE_ANDROID_CLIENT_ID/GOOGLE_WEB_CLIENT_ID on server.");
  }

  const ticket = await googleClient.verifyIdToken({ idToken, audience });
  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error("Unable to read Google token payload.");
  }

  const email = normalizeText(payload.email).toLowerCase();
  if (!email) {
    throw new Error("Google account email is required.");
  }

  if (payload.email_verified === false) {
    throw new Error("Google email is not verified.");
  }

  if (!normalizeText(payload.sub)) {
    throw new Error("Google account identifier is missing.");
  }

  return payload;
}

export async function loginWithGoogle(req: Request, res: Response) {
  try {
    const { idToken } = req.body as GoogleLoginBody;

    if (!idToken || typeof idToken !== "string") {
      return res.status(400).json({ success: false, error: "idToken is required." });
    }

    let payload: TokenPayload;
    try {
      payload = await verifyGoogleIdTokenOrThrow(idToken);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid Google ID token.";
      if (/Missing GOOGLE_ANDROID_CLIENT_ID\/GOOGLE_WEB_CLIENT_ID/.test(message)) {
        return res.status(500).json({ success: false, error: GENERIC_GOOGLE_LOGIN_ERROR });
      }
      return res.status(401).json({ success: false, error: INVALID_CREDENTIALS });
    }

    const email = normalizeText(payload.email).toLowerCase();
    const googleSub = normalizeText(payload.sub);
    const firstName = normalizeText(payload.given_name) || email.split("@")[0] || "User";
    const lastName = normalizeText(payload.family_name);

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        email,
        firstName,
        lastName,
        role: "COMMUNITY",
        volunteerStatus: "NONE",
        isActive: true,
        authProvider: "google",
        googleSub,
        emailVerified: true,
      });
    } else {
      if (user.role !== "COMMUNITY" && user.role !== "VOLUNTEER") {
        return res.status(401).json({ success: false, error: INVALID_CREDENTIALS });
      }

      if (user.googleSub && user.googleSub !== googleSub) {
        return res.status(401).json({ success: false, error: INVALID_CREDENTIALS });
      }

      let shouldSave = false;

      if (!user.googleSub) {
        user.googleSub = googleSub;
        shouldSave = true;
      }

      const nextAuthProvider = resolveAuthProvider(Boolean(user.passwordHash), true);
      if (user.authProvider !== nextAuthProvider) {
        user.authProvider = nextAuthProvider;
        shouldSave = true;
      }

      if (!user.firstName && firstName) {
        user.firstName = firstName;
        shouldSave = true;
      }

      if (!user.lastName && lastName) {
        user.lastName = lastName;
        shouldSave = true;
      }

      if (!user.emailVerified) {
        user.emailVerified = true;
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, error: INVALID_CREDENTIALS });
    }

    const accessToken = signAccessToken({ sub: user._id.toString(), role: user.role });

    return res.json({
      success: true,
      data: {
        accessToken,
        user: toAuthUserPayload(user),
      },
    });
  } catch (err) {
    console.error("[auth.google] Failed to login with Google", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

export async function setPassword(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const { newPassword, confirmPassword } = req.body as SetPasswordBody;
    if (typeof newPassword !== "string" || typeof confirmPassword !== "string") {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters and include at least one letter and one number.",
      });
    }

    const parsedPassword = zodPasswordSchema().safeParse(newPassword);
    if (!parsedPassword.success) {
      return res.status(400).json({
        success: false,
        error: parsedPassword.error.issues[0]?.message ?? "Invalid password.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: "Passwords do not match." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    if (user.passwordHash) {
      return res.status(400).json({ success: false, error: "Password already set for this account." });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.authProvider = resolveAuthProvider(true, Boolean(user.googleSub));
    await user.save();

    return res.status(200).json({ success: true, data: { user: toAuthUserPayload(user) } });
  } catch (err) {
    console.error("[auth.google] Failed to set password", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

export async function linkGoogle(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: INVALID_CREDENTIALS });
    }

    const { idToken } = req.body as GoogleLoginBody;
    if (!idToken || typeof idToken !== "string") {
      return res.status(400).json({ success: false, error: INVALID_REQUEST });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ success: false, error: INVALID_CREDENTIALS });
    }

    let payload: TokenPayload;
    try {
      payload = await verifyGoogleIdTokenOrThrow(idToken);
    } catch {
      return res.status(401).json({ success: false, error: INVALID_CREDENTIALS });
    }

    const payloadEmail = normalizeText(payload.email).toLowerCase();
    const userEmail = normalizeText(user.email).toLowerCase();
    if (!payloadEmail || !userEmail || payloadEmail !== userEmail) {
      return res.status(401).json({ success: false, error: INVALID_CREDENTIALS });
    }

    const googleSub = normalizeText(payload.sub);
    if (user.googleSub && user.googleSub !== googleSub) {
      return res.status(409).json({ success: false, error: LINKING_FAILED });
    }

    const linkedElsewhere = await User.findOne({
      _id: { $ne: user._id },
      googleSub,
    });

    if (linkedElsewhere) {
      return res.status(409).json({ success: false, error: LINKING_FAILED });
    }

    user.googleSub = googleSub;
    user.emailVerified = true;
    user.authProvider = resolveAuthProvider(Boolean(user.passwordHash), true);
    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        user: toAuthUserPayload(user),
      },
    });
  } catch (err) {
    console.error("[auth.google] Failed to link Google account", err);
    return res.status(500).json({ success: false, error: "Server error" });
  }
}

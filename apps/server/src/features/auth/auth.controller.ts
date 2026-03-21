import type { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { AUDIT_EVENT } from "../audit/audit.constants";
import { logAudit, logSecurityEvent } from "../audit/audit.service";
import { User } from "../users/user.model";
import { VolunteerApplication } from "../volunteerApplications/volunteerApplication.model";
import { verifyMfaChallenge } from "../../utils/mfa";
import { signAccessToken } from "../../utils/jwt";
import { authenticateUser } from "./auth.service";
import { toAuthUserPayload } from "./otp.utils";
import { TokenBlocklist } from "./TokenBlocklist.model";
import { resolveAccessTokenExpiresIn } from "./accessTokenExpiry";

const ACCOUNT_SUSPENDED = "Account is suspended. Please contact your administrator.";
const BIRTHDATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_GENDERS = ["Male", "Female", "Prefer not to say"] as const;
const ALLOWED_GENDER_SET = new Set<string>(ALLOWED_GENDERS);

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

const updateMeSchema = z
  .object({
    firstName: z.string().trim().min(1, "First name is required").max(100, "First name is too long"),
    lastName: z.string().trim().min(1, "Last name is required").max(100, "Last name is too long"),
    email: z.string().trim().email("Email must be valid").optional(),
    birthdate: z
      .string()
      .trim()
      .max(10, "Birthdate must be YYYY-MM-DD")
      .optional()
      .refine((v) => v === undefined || v === "" || BIRTHDATE_REGEX.test(v), "Birthdate must be YYYY-MM-DD"),
    contactNo: z.string().trim().max(20, "Contact number is too long").optional(),
    gender: z
      .string()
      .trim()
      .max(30, "Gender is too long")
      .optional()
      .refine(
        (value) => value === undefined || value === "" || ALLOWED_GENDER_SET.has(value),
        "Gender must be Male, Female, or Prefer not to say"
      ),
    skills: z.string().trim().max(300, "Skills is too long").optional(),
    lguPosition: z.string().trim().max(200, "LGU position is too long").optional(),
    barangay: z.string().trim().max(200, "Barangay is too long").optional(),
    municipality: z.string().trim().max(200, "City/State is too long").optional(),
    country: z.string().trim().max(100, "Country is too long").optional(),
    postalCode: z.string().trim().max(20, "Postal code is too long").optional(),
    avatarUrl: z.string().trim().max(500, "Avatar URL is too long").optional(),
  })
  .strict();

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const actorEmail = email.toLowerCase().trim();
    const existingAccount = await User.findOne({ email: actorEmail }).select("_id isActive").lean();
    if (existingAccount && existingAccount.isActive === false) {
      await logSecurityEvent(req, AUDIT_EVENT.AUTH_LOGIN_FAIL, "FAIL", {
        actorEmail,
        accountStatus: "SUSPENDED",
        reason: "ACCOUNT_SUSPENDED",
      });
      return res.status(403).json({
        message: ACCOUNT_SUSPENDED,
        code: "ACCOUNT_SUSPENDED",
      });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      await logSecurityEvent(req, AUDIT_EVENT.AUTH_LOGIN_FAIL, "FAIL", {
        actorEmail,
        reason: "INVALID_CREDENTIALS",
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signAccessToken(
      { sub: user._id.toString(), role: user.role },
      { expiresIn: resolveAccessTokenExpiresIn(req) }
    );

    await logAudit(req, {
      eventType: AUDIT_EVENT.AUTH_LOGIN_SUCCESS,
      outcome: "SUCCESS",
      actor: {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
      },
      target: {
        type: "USER",
        id: user._id.toString(),
      },
      metadata: {
        loginChannel: "password",
      },
    });

    return res.status(200).json({
      token,
      accessToken: token,
      user: toAuthUserPayload(user),
    });
  } catch {
    return res.status(500).json({ message: "Login failed." });
  }
}

export async function adminMfaVerify(req: Request, res: Response) {
  try {
    const { challengeId, code } = req.body as { challengeId?: string; code?: string };

    if (!challengeId || !code) {
      return res.status(400).json({ success: false, error: "challengeId and code are required" });
    }

    const userId = await verifyMfaChallenge(challengeId, String(code).trim());
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: ACCOUNT_SUSPENDED,
        code: "ACCOUNT_SUSPENDED",
      });
    }
    if (user.role !== "ADMIN") return res.status(403).json({ success: false, error: "Not allowed" });

    const token = signAccessToken(
      { sub: user._id.toString(), role: user.role },
      { expiresIn: resolveAccessTokenExpiresIn(req) }
    );

    await logAudit(req, {
      eventType: AUDIT_EVENT.AUTH_MFA_VERIFY_SUCCESS,
      outcome: "SUCCESS",
      actor: {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
      },
      target: {
        type: "USER",
        id: user._id.toString(),
      },
      metadata: {
        challengeId,
      },
    });

    return res.json({
      success: true,
      data: {
        accessToken: token,
        role: "ADMIN",
        user: {
          id: user._id.toString(),
          lifelineId: user.lifelineId ?? undefined,
          username: user.username,
          role: user.role,
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          adminTier: user.adminTier ?? "CDRRMO",
        },
      },
    });
  } catch (err: any) {
    await logSecurityEvent(req, AUDIT_EVENT.AUTH_MFA_VERIFY_FAIL, "FAIL", {
      reason: err?.message || "OTP verification failed",
      challengeId: req.body?.challengeId,
    });
    return res.status(401).json({ success: false, error: err?.message || "OTP verification failed" });
  }
}

export async function me(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select(
      "username firstName lastName email lifelineId role adminTier lguName lguPosition barangay municipality birthdate contactNo gender skills country postalCode avatarUrl authProvider passwordHash googleSub emailVerified volunteerStatus onDuty notificationPrefs"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    let fallbackGender = "";
    let fallbackSkills = "";
    if (user.role === "VOLUNTEER" && (!asTrimmedString(user.gender) || !asTrimmedString(user.skills))) {
      const latestVerifiedApplication = await VolunteerApplication.findOne({
        userId: user._id,
        status: "verified",
      })
        .select("sex skillsOther")
        .sort({ createdAt: -1 })
        .lean();

      fallbackGender = asTrimmedString(latestVerifiedApplication?.sex);
      fallbackSkills = asTrimmedString(latestVerifiedApplication?.skillsOther);
    }

    const payload = toAuthUserPayload(user);
    if (!asTrimmedString(payload.gender) && fallbackGender) {
      payload.gender = fallbackGender;
    }
    if (!asTrimmedString(payload.skills) && fallbackSkills) {
      payload.skills = fallbackSkills;
    }

    return res.status(200).json({
      user: payload,
    });
  } catch {
    return res.status(500).json({ message: "Failed to fetch profile." });
  }
}

export async function updateMe(req: Request, res: Response) {
  try {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const parsed = updateMeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation error", errors: parsed.error.flatten() });
    }

    const body = parsed.data;
    const normalizedEmail = body.email ? body.email.toLowerCase() : null;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!user.isActive) {
      return res.status(403).json({
        message: ACCOUNT_SUSPENDED,
        code: "ACCOUNT_SUSPENDED",
      });
    }

    if (normalizedEmail && (user.email ?? "").toLowerCase() !== normalizedEmail) {
      const emailTaken = await User.findOne({
        _id: { $ne: user._id },
        email: normalizedEmail,
      })
        .select("_id")
        .lean();
      if (emailTaken) return res.status(409).json({ message: "Email is already in use." });
    }

    const changedFields: string[] = [];

    const nextFirstName = body.firstName;
    if ((user.firstName ?? "") !== nextFirstName) changedFields.push("firstName");
    user.firstName = nextFirstName;

    const nextLastName = body.lastName;
    if ((user.lastName ?? "") !== nextLastName) changedFields.push("lastName");
    user.lastName = nextLastName;

    if (normalizedEmail !== null) {
      if ((user.email ?? "").toLowerCase() !== normalizedEmail) changedFields.push("email");
      user.email = normalizedEmail;
    }

    const hasOwn = <K extends keyof typeof body>(key: K) => Object.prototype.hasOwnProperty.call(body, key);

    if (hasOwn("birthdate")) {
      const nextBirthdate = body.birthdate ?? "";
      if ((user.birthdate ?? "") !== nextBirthdate) changedFields.push("birthdate");
      user.birthdate = nextBirthdate;
    }

    if (hasOwn("contactNo")) {
      const nextContactNo = body.contactNo ?? "";
      if ((user.contactNo ?? "") !== nextContactNo) changedFields.push("contactNo");
      user.contactNo = nextContactNo;
    }

    if (hasOwn("gender")) {
      const nextGender = body.gender ?? "";
      if ((user.gender ?? "") !== nextGender) changedFields.push("gender");
      user.gender = nextGender;
    }

    if (hasOwn("skills")) {
      const nextSkills = body.skills ?? "";
      if ((user.skills ?? "") !== nextSkills) changedFields.push("skills");
      user.skills = nextSkills;
    }

    if (hasOwn("country")) {
      const nextCountry = body.country ?? "";
      if ((user.country ?? "") !== nextCountry) changedFields.push("country");
      user.country = nextCountry;
    }

    if (hasOwn("municipality")) {
      const nextMunicipality = body.municipality ?? "";
      if ((user.municipality ?? "") !== nextMunicipality) changedFields.push("municipality");
      user.municipality = nextMunicipality;
    }

    if (hasOwn("barangay")) {
      const nextBarangay = body.barangay ?? "";
      if ((user.barangay ?? "") !== nextBarangay) changedFields.push("barangay");
      user.barangay = nextBarangay;
    }

    if (hasOwn("postalCode")) {
      const nextPostalCode = body.postalCode ?? "";
      if ((user.postalCode ?? "") !== nextPostalCode) changedFields.push("postalCode");
      user.postalCode = nextPostalCode;
    }

    if (hasOwn("lguPosition")) {
      const nextLguPosition = body.lguPosition ?? "";
      if ((user.lguPosition ?? "") !== nextLguPosition) changedFields.push("lguPosition");
      user.lguPosition = nextLguPosition;
    }

    if (hasOwn("avatarUrl")) {
      const nextAvatarUrl = body.avatarUrl ?? "";
      if ((user.avatarUrl ?? "") !== nextAvatarUrl) changedFields.push("avatarUrl");
      user.avatarUrl = nextAvatarUrl;
    }

    await user.save();

    await logAudit(req, {
      eventType: AUDIT_EVENT.USER_PROFILE_UPDATE,
      outcome: "SUCCESS",
      actor: {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
      },
      target: {
        type: "USER",
        id: user._id.toString(),
      },
      metadata: {
        changedFields,
      },
    });

    return res.status(200).json({
      success: true,
      user: toAuthUserPayload(user),
    });
  } catch (e: unknown) {
    if (typeof e === "object" && e && "code" in e && (e as { code?: unknown }).code === 11000) {
      return res.status(409).json({ message: "Email is already in use." });
    }
    return res.status(500).json({ message: "Failed to update profile." });
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const auth = req.auth;
    if (!auth?.jti || !auth?.sub || typeof auth.exp !== "number") {
      return res.status(401).json({ message: "Invalid token" });
    }

    const expiresAt = new Date(auth.exp * 1000);
    const userId = new Types.ObjectId(auth.sub);

    await TokenBlocklist.updateOne(
      { jti: auth.jti },
      {
        $setOnInsert: {
          jti: auth.jti,
          userId,
          expiresAt,
          reason: "logout",
        },
      },
      { upsert: true }
    );

    await logAudit(req, {
      eventType: AUDIT_EVENT.AUTH_LOGOUT,
      outcome: "SUCCESS",
      actor: {
        id: req.userId || auth.sub,
        role: req.role || auth.role,
      },
      target: {
        type: "USER",
        id: auth.sub,
      },
    });

    return res.status(200).json({ success: true });
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

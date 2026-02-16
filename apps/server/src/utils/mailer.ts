import nodemailer from "nodemailer";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function createTransporter() {
  const host = mustEnv("SMTP_HOST");
  const port = Number(mustEnv("SMTP_PORT"));
  const secure = String(process.env.SMTP_SECURE || "false") === "true";

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: mustEnv("SMTP_USER"),
      pass: mustEnv("SMTP_PASS"),
    },
  });
}

type SendOtpEmailParams = {
  to: string;
  otp: string;
  actionText: string;
  expiryTime: number;
};

function escapeHtml(input: string) {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildOtpText({ actionText, otp, expiryTime }: Omit<SendOtpEmailParams, "to">) {
  return `Lifeline OTP - ${actionText}

Your One-Time Password (OTP) is: ${otp}

Enter this code in the Lifeline app to complete: ${actionText}
This code expires in ${expiryTime} minutes.

Security notice:
- Do not share this code with anyone.
- Lifeline staff will never ask for your OTP.

If you did not request this code, you can ignore this email.

- Lifeline Security Team`;
}

function buildOtpHtml({ actionText, otp, expiryTime }: Omit<SendOtpEmailParams, "to">) {
  const preheader = `Your Lifeline OTP code is ${otp} (expires in ${expiryTime} min)`;

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lifeline OTP</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f6f7fb; font-family: Arial, Helvetica, sans-serif;">
    <div style="display:none; font-size:1px; color:#f6f7fb; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
      ${preheader}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f7fb; padding:24px 12px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e8eaf1;">
            <tr>
              <td style="padding:22px 24px; background:#ffffff; border-bottom:1px solid #eef0f6;">
                <div style="font-size:22px; font-weight:800; letter-spacing:0.2px;">
                  <span style="color:#DC2626;">Life</span><span style="color:#8e95a3;">line</span>
                </div>
                <div style="margin-top:6px; font-size:13px; color:#6B7280;">Security Verification</div>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 24px 8px 24px;">
                <div style="font-size:18px; font-weight:800; color:#111827; margin-bottom:10px;">
                  Verify your ${escapeHtml(actionText)}
                </div>
                <div style="font-size:14px; color:#374151; line-height:20px; margin-bottom:16px;">
                  We received a request to verify your identity for <b>${escapeHtml(actionText)}</b>.
                  Please enter the code below in the Lifeline app.
                </div>

                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="padding:10px 0 14px 0;">
                      <div style="display:inline-block; background:#f3f4f6; border:1px solid #e5e7eb; padding:18px 22px; border-radius:12px; font-size:34px; font-weight:900; letter-spacing:6px; color:#DC2626; text-align:center; min-width:240px;">
                        ${escapeHtml(otp)}
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="font-size:13px; color:#6B7280; line-height:18px; margin-bottom:18px;">
                  This code will expire in <b>${expiryTime} minutes</b>.
                </div>

                <div style="height:1px; background:#eef0f6; margin:10px 0 18px 0;"></div>

                <div style="font-size:13px; color:#374151; line-height:19px;">
                  <div style="font-weight:800; color:#111827; margin-bottom:6px;">Security notice</div>
                  Do not share this code with anyone. Lifeline will never ask you for your OTP.
                </div>

                <div style="margin-top:14px; font-size:13px; color:#374151; line-height:19px;">
                  <div style="font-weight:800; color:#111827; margin-bottom:6px;">Didn't request this?</div>
                  You can ignore this email. No action is needed.
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px; background:#ffffff;">
                <div style="font-size:12px; color:#9CA3AF; line-height:18px;">
                  (c) ${new Date().getFullYear()} Lifeline. This email was sent from an automated system. Please do not reply.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html: string;
  otp: string;
};

function hasSmtpConfig() {
  const required = ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"] as const;
  return required.every((key) => Boolean(process.env[key]));
}

async function sendMailWithDevFallback(payload: MailPayload) {
  if (!hasSmtpConfig()) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[mailer] SMTP not configured. OTP for ${payload.to}: ${payload.otp}`);
      return;
    }

    throw new Error("SMTP is not configured.");
  }

  const transporter = createTransporter();
  const fromEmail = process.env.SMTP_FROM || mustEnv("SMTP_USER");

  await transporter.sendMail({
    from: `Lifeline <${fromEmail}>`,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}

export async function sendOtpEmail(params: SendOtpEmailParams) {
  const subject = `Lifeline OTP - ${params.actionText}`;

  const text = buildOtpText({
    actionText: params.actionText,
    otp: params.otp,
    expiryTime: params.expiryTime,
  });

  const html = buildOtpHtml({
    actionText: params.actionText,
    otp: params.otp,
    expiryTime: params.expiryTime,
  });

  await sendMailWithDevFallback({
    to: params.to,
    subject,
    text,
    html,
    otp: params.otp,
  });
}

function buildSignupVerificationText(otp: string, expiryMin: number) {
  return `Lifeline Account Verification OTP

Verify your Lifeline account.
Complete signup using this code: ${otp}

Enter this OTP in the Lifeline app within ${expiryMin} minutes to complete signup.
If you did not create a Lifeline account, you can safely ignore this email.

- Lifeline Security Team`;
}

function buildSignupVerificationHtml(otp: string, expiryMin: number) {
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lifeline Account Verification OTP</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f6f7fb; font-family:Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f7fb; padding:24px 12px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:14px; border:1px solid #e8eaf1; overflow:hidden;">
            <tr>
              <td style="padding:22px 24px; border-bottom:1px solid #eef0f6;">
                <div style="font-size:22px; font-weight:800;">
                  <span style="color:#DC2626;">Life</span><span style="color:#8e95a3;">line</span>
                </div>
                <div style="margin-top:6px; font-size:13px; color:#6B7280;">Account Verification</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <div style="font-size:20px; font-weight:800; color:#111827; margin-bottom:10px;">
                  Verify your Lifeline account
                </div>
                <div style="font-size:14px; color:#374151; line-height:20px; margin-bottom:14px;">
                  Welcome to Lifeline. Use the OTP below to complete signup and activate your account.
                </div>
                <div style="display:inline-block; background:#f3f4f6; border:1px solid #e5e7eb; border-radius:12px; padding:18px 22px; font-size:34px; font-weight:900; letter-spacing:6px; color:#DC2626;">
                  ${escapeHtml(otp)}
                </div>
                <div style="font-size:13px; color:#6B7280; margin-top:14px;">
                  This verification code expires in <b>${expiryMin} minutes</b>.
                </div>
                <div style="height:1px; background:#eef0f6; margin:16px 0;"></div>
                <div style="font-size:13px; color:#374151; line-height:19px;">
                  Next step: Enter this OTP in the Lifeline signup verification screen to complete signup.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

function buildPasswordResetText(otp: string, expiryMin: number) {
  return `Lifeline Password Reset OTP

Reset your Lifeline password with this code: ${otp}

Enter this OTP in the Lifeline app to continue password reset. This code expires in ${expiryMin} minutes.
If you didn't request a password reset, ignore this email.

- Lifeline Security Team`;
}

function buildPasswordResetHtml(otp: string, expiryMin: number) {
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Lifeline Password Reset OTP</title>
  </head>
  <body style="margin:0; padding:0; background-color:#f6f7fb; font-family:Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f7fb; padding:24px 12px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:14px; border:1px solid #e8eaf1; overflow:hidden;">
            <tr>
              <td style="padding:22px 24px; border-bottom:1px solid #eef0f6;">
                <div style="font-size:22px; font-weight:800;">
                  <span style="color:#DC2626;">Life</span><span style="color:#8e95a3;">line</span>
                </div>
                <div style="margin-top:6px; font-size:13px; color:#6B7280;">Password Recovery</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <div style="font-size:20px; font-weight:800; color:#111827; margin-bottom:10px;">
                  Reset your Lifeline password
                </div>
                <div style="font-size:14px; color:#374151; line-height:20px; margin-bottom:14px;">
                  We received a request to reset your Lifeline password. Use the OTP below to continue.
                </div>
                <div style="display:inline-block; background:#fef2f2; border:1px solid #fecaca; border-radius:12px; padding:18px 22px; font-size:34px; font-weight:900; letter-spacing:6px; color:#B91C1C;">
                  ${escapeHtml(otp)}
                </div>
                <div style="font-size:13px; color:#6B7280; margin-top:14px;">
                  This reset code expires in <b>${expiryMin} minutes</b>.
                </div>
                <div style="height:1px; background:#eef0f6; margin:16px 0;"></div>
                <div style="font-size:13px; color:#374151; line-height:19px;">
                  If you didn't request this, no changes were made and you can safely ignore this email.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

export async function sendSignupVerificationOtpEmail(to: string, otp: string, expiryMin: number) {
  await sendMailWithDevFallback({
    to,
    otp,
    subject: "Lifeline Account Verification OTP",
    text: buildSignupVerificationText(otp, expiryMin),
    html: buildSignupVerificationHtml(otp, expiryMin),
  });
}

export async function sendPasswordResetOtpEmail(to: string, otp: string, expiryMin: number) {
  await sendMailWithDevFallback({
    to,
    otp,
    subject: "Lifeline Password Reset OTP",
    text: buildPasswordResetText(otp, expiryMin),
    html: buildPasswordResetHtml(otp, expiryMin),
  });
}
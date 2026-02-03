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
  actionText: string; // e.g. "Admin Login Verification"
  expiryTime: number; // minutes
};

function buildOtpText({
  actionText,
  otp,
  expiryTime,
}: Omit<SendOtpEmailParams, "to">) {
  return `Lifeline OTP - ${actionText}

Your One-Time Password (OTP) is: ${otp}

Enter this code in the Lifeline app to complete: ${actionText}
This code expires in ${expiryTime} minutes.

Security notice:
- Do not share this code with anyone.
- Lifeline staff will never ask for your OTP.

If you did not request this code, you can ignore this email.

— Lifeline Security Team`;
}

// ✅ HTML template (Logto-ish: clean, centered, big code box)
// Uses tables + inline CSS for maximum email client compatibility.
function buildOtpHtml({
  actionText,
  otp,
  expiryTime,
}: Omit<SendOtpEmailParams, "to">) {
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
    <!-- Preheader (hidden preview text) -->
    <div style="display:none; font-size:1px; color:#f6f7fb; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">
      ${preheader}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f6f7fb; padding:24px 12px;">
      <tr>
        <td align="center">
          <!-- Container -->
          <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%; background:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e8eaf1;">
            <!-- Header -->
            <tr>
              <td style="padding:22px 24px; background:#ffffff; border-bottom:1px solid #eef0f6;">
                <div style="font-size:22px; font-weight:800; letter-spacing:0.2px;">
                  <span style="color:#DC2626;">Life</span><span style="color:#8e95a3;">line</span>
                </div>
                <div style="margin-top:6px; font-size:13px; color:#6B7280;">
                  Security Verification
                </div>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:26px 24px 8px 24px;">
                <div style="font-size:18px; font-weight:800; color:#111827; margin-bottom:10px;">
                  Verify your ${escapeHtml(actionText)}
                </div>

                <div style="font-size:14px; color:#374151; line-height:20px; margin-bottom:16px;">
                  We received a request to verify your identity for <b>${escapeHtml(
                    actionText
                  )}</b>.
                  Please enter the code below in the Lifeline app.
                </div>

                <!-- OTP Box -->
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td align="center" style="padding:10px 0 14px 0;">
                      <div style="
                        display:inline-block;
                        background:#f3f4f6;
                        border:1px solid #e5e7eb;
                        padding:18px 22px;
                        border-radius:12px;
                        font-size:34px;
                        font-weight:900;
                        letter-spacing:6px;
                        color:#DC2626;
                        text-align:center;
                        min-width:240px;
                      ">
                        ${escapeHtml(otp)}
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="font-size:13px; color:#6B7280; line-height:18px; margin-bottom:18px;">
                  This code will expire in <b>${expiryTime} minutes</b>.
                </div>

                <!-- Divider -->
                <div style="height:1px; background:#eef0f6; margin:10px 0 18px 0;"></div>

                <!-- Security Notice -->
                <div style="font-size:13px; color:#374151; line-height:19px;">
                  <div style="font-weight:800; color:#111827; margin-bottom:6px;">
                    Security notice
                  </div>
                  Do not share this code with anyone. Lifeline will never ask you for your OTP.
                  If someone requests this code, it may be a scam attempt.
                </div>

                <div style="margin-top:14px; font-size:13px; color:#374151; line-height:19px;">
                  <div style="font-weight:800; color:#111827; margin-bottom:6px;">
                    Didn’t request this?
                  </div>
                  You can ignore this email. No action is needed.
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:18px 24px; background:#ffffff;">
                <div style="font-size:12px; color:#9CA3AF; line-height:18px;">
                  © ${new Date().getFullYear()} Lifeline. This email was sent from an automated system. Please do not reply.
                </div>
              </td>
            </tr>
          </table>

          <!-- Small footer spacing -->
          <div style="height:16px;"></div>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

// ✅ Simple HTML escaping to avoid breaking the template if actionText has symbols
function escapeHtml(input: string) {
  return String(input)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendOtpEmail(params: SendOtpEmailParams) {
  const transporter = createTransporter();
  const fromEmail = process.env.SMTP_FROM || mustEnv("SMTP_USER");

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

  await transporter.sendMail({
    from: `Lifeline <${fromEmail}>`,
    to: params.to,
    subject,
    text, // ✅ fallback
    html, // ✅ pretty email
  });
}
